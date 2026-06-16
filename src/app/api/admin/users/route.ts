import { NextRequest, NextResponse } from "next/server";
import { getDb, schema, type Database } from "@/lib/db";
import { authenticate, isAuthenticated, type AuthenticatedRequest } from "@/lib/auth/middleware";
import { hashPassword, generateId } from "@/lib/auth/crypto";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type AdminResult =
  | { ok: true; auth: AuthenticatedRequest; db: Database }
  | { ok: false; response: NextResponse };

async function requireAdmin(request: NextRequest): Promise<AdminResult> {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return { ok: false, response: auth };

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const [user] = await db
    .select({ isAdmin: schema.users.isAdmin })
    .from(schema.users)
    .where(eq(schema.users.id, auth.userId))
    .limit(1);

  if (!user?.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { ok: true, auth, db };
}

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;
  const { db } = result;

  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      isAdmin: schema.users.isAdmin,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users);

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;
  const { db } = result;

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const now = new Date();
  const userId = generateId();
  const passwordHash = await hashPassword(password);

  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    isAdmin: false,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(
    { id: userId, email: email.toLowerCase() },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;
  const { db, auth } = result;

  const { id } = await request.json();

  if (id === auth.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  await db.delete(schema.users).where(eq(schema.users.id, id));
  return NextResponse.json({ success: true });
}

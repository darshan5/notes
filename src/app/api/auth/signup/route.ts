import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { hashPassword, generateId } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const body = await request.json();
  const { email, password } = body;

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
    createdAt: now,
    updatedAt: now,
  });

  const token = await createSession(db, userId, env.JWT_SECRET);
  const response = NextResponse.json({ userId, email: email.toLowerCase() });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

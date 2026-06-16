import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/crypto";
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

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  await db
    .update(schema.users)
    .set({ pinAttempts: 0 })
    .where(eq(schema.users.id, user.id));

  const token = await createSession(db, user.id, env.JWT_SECRET);
  const hasPin = !!user.pinHash;

  const response = NextResponse.json({
    userId: user.id,
    email: user.email,
    hasPin,
  });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

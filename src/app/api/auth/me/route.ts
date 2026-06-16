import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      hasPin: schema.users.pinHash,
      isAdmin: schema.users.isAdmin,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, auth.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    hasPin: !!user.hasPin,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  });
}

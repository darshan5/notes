import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { generateId, generateApiKey, hashApiKey } from "@/lib/auth/crypto";
import { eq, and } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const keys = await db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      createdAt: schema.apiKeys.createdAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, auth.userId));

  return NextResponse.json({
    keys: keys.map((k) => ({
      ...k,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const rawKey = generateApiKey();
  const keyHash = await hashApiKey(rawKey);
  const id = generateId();

  await db.insert(schema.apiKeys).values({
    id,
    userId: auth.userId,
    keyHash,
    name,
    createdAt: new Date(),
  });

  return NextResponse.json({ id, name, key: rawKey }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  await db
    .delete(schema.apiKeys)
    .where(
      and(eq(schema.apiKeys.id, id), eq(schema.apiKeys.userId, auth.userId))
    );

  return NextResponse.json({ success: true });
}

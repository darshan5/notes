import { eq } from "drizzle-orm";
import { type Database, schema } from "@/lib/db";
import { generateId } from "./crypto";
import { createJwt, verifyJwt } from "./jwt";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(
  db: Database,
  userId: string,
  jwtSecret: string,
  deviceName?: string
): Promise<string> {
  const sessionId = generateId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    deviceName: deviceName ?? null,
    isPinDevice: false,
    expiresAt,
    createdAt: now,
  });

  return createJwt(
    { sub: userId, sid: sessionId, exp: Math.floor(expiresAt.getTime() / 1000) },
    jwtSecret
  );
}

export async function validateSession(
  db: Database,
  token: string,
  jwtSecret: string
): Promise<{ userId: string; sessionId: string } | null> {
  const payload = await verifyJwt(token, jwtSecret);
  if (!payload) return null;

  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, payload.sid))
    .limit(1);

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, payload.sid));
    return null;
  }

  return { userId: payload.sub, sessionId: payload.sid };
}

export async function invalidateAllSessions(
  db: Database,
  userId: string
): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

export async function validateApiKey(
  db: Database,
  keyHash: string
): Promise<string | null> {
  const [apiKey] = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .limit(1);

  if (!apiKey) return null;

  await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, apiKey.id));

  return apiKey.userId;
}

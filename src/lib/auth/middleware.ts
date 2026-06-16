import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateSession, validateApiKey } from "./session";
import { hashApiKey } from "./crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface AuthenticatedRequest {
  userId: string;
  sessionId?: string;
}

export async function authenticate(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    const keyHash = await hashApiKey(apiKeyHeader);
    const userId = await validateApiKey(db, keyHash);
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    return { userId };
  }

  const token =
    request.cookies.get("session")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await validateSession(db, token, env.JWT_SECRET);
  if (!session) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  return { userId: session.userId, sessionId: session.sessionId };
}

export function isAuthenticated(
  result: AuthenticatedRequest | NextResponse
): result is AuthenticatedRequest {
  return "userId" in result;
}

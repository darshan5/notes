import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { invalidateAllSessions } from "@/lib/auth/session";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  await invalidateAllSessions(db, auth.userId);

  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}

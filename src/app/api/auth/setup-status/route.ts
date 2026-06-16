import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users);

  return NextResponse.json({ needsSetup: count === 0 });
}

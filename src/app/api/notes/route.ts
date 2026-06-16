import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { generateId } from "@/lib/auth/crypto";
import { eq, desc, and, sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const noteRows = await db
    .select()
    .from(schema.notes)
    .where(eq(schema.notes.userId, auth.userId))
    .orderBy(desc(schema.notes.pinned), desc(schema.notes.updatedAt));

  const noteIds = noteRows.map((n) => n.id);
  let tags: { noteId: string; tag: string }[] = [];
  if (noteIds.length > 0) {
    tags = await db
      .select()
      .from(schema.noteTags)
      .where(
        sql`${schema.noteTags.noteId} IN (${sql.join(
          noteIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
  }

  const tagsByNote = new Map<string, string[]>();
  for (const t of tags) {
    const arr = tagsByNote.get(t.noteId) ?? [];
    arr.push(t.tag);
    tagsByNote.set(t.noteId, arr);
  }

  const notes = noteRows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    pinned: n.pinned,
    tags: tagsByNote.get(n.id) ?? [],
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const body = await request.json();
  const { title = "", body: noteBody = "", tags = [], pinned = false } = body;

  const now = new Date();
  const noteId = generateId();

  await db.insert(schema.notes).values({
    id: noteId,
    userId: auth.userId,
    title,
    body: noteBody,
    pinned,
    createdAt: now,
    updatedAt: now,
  });

  if (tags.length > 0) {
    await db.insert(schema.noteTags).values(
      tags.map((tag: string) => ({ noteId, tag: tag.trim().toLowerCase() }))
    );
  }

  return NextResponse.json(
    {
      id: noteId,
      title,
      body: noteBody,
      pinned,
      tags,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    { status: 201 }
  );
}

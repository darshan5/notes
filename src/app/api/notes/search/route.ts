import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ notes: [] });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const tagMatches = await db
    .select({ noteId: schema.noteTags.noteId })
    .from(schema.noteTags)
    .where(
      and(
        like(schema.noteTags.tag, `%${q.toLowerCase()}%`),
        sql`${schema.noteTags.noteId} IN (SELECT id FROM notes WHERE user_id = ${auth.userId})`
      )
    );
  const tagNoteIds = new Set(tagMatches.map((t) => t.noteId));

  const allNotes = await db
    .select()
    .from(schema.notes)
    .where(
      and(
        eq(schema.notes.userId, auth.userId),
        sql`(${schema.notes.title} LIKE ${'%' + q + '%'} OR ${schema.notes.body} LIKE ${'%' + q + '%'} OR ${schema.notes.id} IN (${
          tagNoteIds.size > 0
            ? sql.join([...tagNoteIds].map((id) => sql`${id}`), sql`, `)
            : sql`''`
        }))`
      )
    )
    .orderBy(desc(schema.notes.pinned), desc(schema.notes.updatedAt));

  const noteIds = allNotes.map((n) => n.id);
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

  const notes = allNotes
    .sort((a, b) => {
      const aTagMatch = tagNoteIds.has(a.id) ? 1 : 0;
      const bTagMatch = tagNoteIds.has(b.id) ? 1 : 0;
      if (aTagMatch !== bTagMatch) return bTagMatch - aTagMatch;
      if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .map((n) => ({
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

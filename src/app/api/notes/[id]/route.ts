import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { eq, and, sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getNote(db: ReturnType<typeof getDb>, noteId: string, userId: string) {
  const [note] = await db
    .select()
    .from(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId)))
    .limit(1);
  return note;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const note = await getNote(db, id, auth.userId);
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const tags = await db
    .select({ tag: schema.noteTags.tag })
    .from(schema.noteTags)
    .where(eq(schema.noteTags.noteId, id));

  return NextResponse.json({
    id: note.id,
    title: note.title,
    body: note.body,
    pinned: note.pinned,
    tags: tags.map((t) => t.tag),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const note = await getNote(db, id, auth.userId);
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const body = await request.json();
  const now = new Date();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (body.title !== undefined) updates.title = body.title;
  if (body.body !== undefined) updates.body = body.body;
  if (body.pinned !== undefined) updates.pinned = body.pinned;

  await db.update(schema.notes).set(updates).where(eq(schema.notes.id, id));

  if (body.tags !== undefined) {
    await db.delete(schema.noteTags).where(eq(schema.noteTags.noteId, id));
    if (body.tags.length > 0) {
      await db.insert(schema.noteTags).values(
        body.tags.map((tag: string) => ({ noteId: id, tag: tag.trim().toLowerCase() }))
      );
    }
  }

  const tags = await db
    .select({ tag: schema.noteTags.tag })
    .from(schema.noteTags)
    .where(eq(schema.noteTags.noteId, id));

  const updated = await getNote(db, id, auth.userId);
  return NextResponse.json({
    id: updated!.id,
    title: updated!.title,
    body: updated!.body,
    pinned: updated!.pinned,
    tags: tags.map((t) => t.tag),
    createdAt: updated!.createdAt.toISOString(),
    updatedAt: updated!.updatedAt.toISOString(),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const note = await getNote(db, id, auth.userId);
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await db.delete(schema.notes).where(eq(schema.notes.id, id));
  return NextResponse.json({ success: true });
}

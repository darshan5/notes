"use client";

import { offlineDb, type OfflineNote, type PendingChange } from "./db";

export type SyncStatus = "idle" | "syncing" | "error";

export async function getPendingNoteIds(): Promise<{ creates: Set<string>; updates: Set<string>; deletes: Set<string> }> {
  const changes = await getPendingChanges();
  const creates = new Set<string>();
  const updates = new Set<string>();
  const deletes = new Set<string>();
  for (const c of changes) {
    if (c.type === "create") creates.add(c.noteId);
    else if (c.type === "update") updates.add(c.noteId);
    else if (c.type === "delete") deletes.add(c.noteId);
  }
  return { creates, updates, deletes };
}

export async function saveNotesLocally(notes: OfflineNote[]): Promise<void> {
  if (!offlineDb) return;
  const { creates, updates } = await getPendingNoteIds();
  const pendingIds = new Set([...creates, ...updates]);

  await offlineDb.transaction("rw", offlineDb.notes, async () => {
    let pendingNotes: OfflineNote[] = [];
    if (pendingIds.size > 0) {
      pendingNotes = await offlineDb!.notes
        .where("id")
        .anyOf([...pendingIds])
        .toArray();
    }
    await offlineDb!.notes.clear();
    await offlineDb!.notes.bulkPut(notes);
    for (const pn of pendingNotes) {
      const existsOnServer = notes.some((n) => n.id === pn.id);
      if (!existsOnServer) {
        await offlineDb!.notes.put(pn);
      }
    }
  });
}

export async function getLocalNotes(): Promise<OfflineNote[]> {
  if (!offlineDb) return [];
  return offlineDb.notes
    .orderBy("updatedAt")
    .reverse()
    .toArray()
    .then((notes) =>
      notes
        .filter((n) => !n._deleted)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
    );
}

export async function saveLocalChange(change: Omit<PendingChange, "id">): Promise<void> {
  if (!offlineDb) return;
  await offlineDb.pendingChanges.add(change as PendingChange);
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  if (!offlineDb) return [];
  return offlineDb.pendingChanges.orderBy("timestamp").toArray();
}

export async function clearPendingChanges(): Promise<void> {
  if (!offlineDb) return;
  await offlineDb.pendingChanges.clear();
}

export async function syncChanges(): Promise<boolean> {
  const changes = await getPendingChanges();
  if (changes.length === 0) return true;

  try {
    for (const change of changes) {
      switch (change.type) {
        case "create": {
          const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(change.data),
          });
          if (!res.ok) throw new Error("Failed to create note");
          break;
        }
        case "update": {
          const res = await fetch(`/api/notes/${change.noteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(change.data),
          });
          if (!res.ok) throw new Error("Failed to update note");
          break;
        }
        case "delete": {
          const res = await fetch(`/api/notes/${change.noteId}`, {
            method: "DELETE",
          });
          if (!res.ok && res.status !== 404) throw new Error("Failed to delete note");
          break;
        }
      }
    }
    await clearPendingChanges();
    return true;
  } catch {
    return false;
  }
}

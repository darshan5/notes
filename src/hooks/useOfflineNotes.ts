"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  saveNotesLocally,
  getLocalNotes,
  saveLocalChange,
  syncChanges,
  type SyncStatus,
} from "@/lib/offline/sync";
import type { Note } from "./useNotes";
import type { OfflineNote } from "@/lib/offline/db";

function noteToOffline(note: Note): OfflineNote {
  return { ...note, _dirty: false, _deleted: false };
}

export function useOfflineNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const isOnline = useOnlineStatus();
  const syncingRef = useRef(false);

  const fetchFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
        await saveNotesLocally(data.notes.map(noteToOffline));
        return data.notes;
      }
    } catch {}
    return null;
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const local = await getLocalNotes();
      if (local.length > 0) {
        setNotes(local as Note[]);
      }

      if (isOnline) {
        await fetchFromServer();
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, fetchFromServer]);

  const searchNotes = useCallback(
    async (query: string) => {
      if (!query.trim()) return fetchNotes();
      setLoading(true);
      try {
        if (isOnline) {
          try {
            const res = await fetch(
              `/api/notes/search?q=${encodeURIComponent(query)}`
            );
            if (res.ok) {
              const data = await res.json();
              setNotes(data.notes);
              return;
            }
          } catch {}
        }
        const local = await getLocalNotes();
        const q = query.toLowerCase();
        const filtered = (local as Note[]).filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q))
        );
        setNotes(filtered);
      } finally {
        setLoading(false);
      }
    },
    [isOnline, fetchNotes]
  );

  const createNote = useCallback(
    async (note: {
      title: string;
      body: string;
      tags: string[];
      pinned?: boolean;
    }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const localNote: Note = {
        id,
        ...note,
        pinned: note.pinned ?? false,
        createdAt: now,
        updatedAt: now,
      };

      if (isOnline) {
        try {
          const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(note),
          });
          if (res.ok) {
            const data = await res.json();
            setNotes((prev) => [data, ...prev]);
            await saveNotesLocally([noteToOffline(data), ...notes.map(noteToOffline)]);
            return data;
          }
        } catch {}
      }

      setNotes((prev) => [localNote, ...prev]);
      await saveLocalChange({
        noteId: id,
        type: "create",
        data: localNote,
        timestamp: Date.now(),
      });
      return localNote;
    },
    [isOnline, notes]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      if (isOnline) {
        try {
          const res = await fetch(`/api/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (res.ok) {
            const data = await res.json();
            setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
            return data;
          }
        } catch {}
      }

      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, ...updates, updatedAt: new Date().toISOString() }
            : n
        )
      );
      await saveLocalChange({
        noteId: id,
        type: "update",
        data: updates,
        timestamp: Date.now(),
      });
    },
    [isOnline]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (isOnline) {
        try {
          const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
          if (res.ok) {
            setNotes((prev) => prev.filter((n) => n.id !== id));
            return;
          }
        } catch {}
      }

      await saveLocalChange({
        noteId: id,
        type: "delete",
        timestamp: Date.now(),
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [isOnline]
  );

  const togglePin = useCallback(
    async (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      return updateNote(id, { pinned: !note.pinned });
    },
    [notes, updateNote]
  );

  useEffect(() => {
    if (!isOnline || syncingRef.current) return;
    syncingRef.current = true;
    setSyncStatus("syncing");
    syncChanges()
      .then((success) => {
        setSyncStatus(success ? "idle" : "error");
        if (success) fetchFromServer();
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [isOnline, fetchFromServer]);

  return {
    notes,
    loading,
    syncStatus,
    fetchNotes,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  };
}

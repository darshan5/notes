"use client";

import { useState, useCallback } from "react";

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      return fetchNotes();
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  const createNote = useCallback(
    async (note: { title: string; body: string; tags: string[]; pinned?: boolean }) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes((prev) => [data, ...prev]);
      return data;
    },
    []
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
      return data;
    },
    []
  );

  const deleteNote = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePin = useCallback(
    async (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      return updateNote(id, { pinned: !note.pinned });
    },
    [notes, updateNote]
  );

  return {
    notes,
    loading,
    fetchNotes,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  };
}

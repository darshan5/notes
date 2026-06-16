"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineNotes } from "@/hooks/useOfflineNotes";
import { type Note } from "@/hooks/useNotes";
import { SearchBar } from "@/components/SearchBar";
import { NoteCard } from "@/components/NoteCard";
import { StatusBar } from "@/components/StatusBar";
import { NoteEditor } from "@/components/NoteEditor";

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const { notes, loading, syncStatus, fetchNotes, searchNotes, togglePin, deleteNote } = useOfflineNotes();
  const router = useRouter();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchNotes();
  }, [user, authLoading, router, fetchNotes]);

  function handleDelete(id: string) {
    if (confirm("Delete this note?")) {
      deleteNote(id);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
      </div>
    );
  }

  if (editingNote || showNew) {
    return (
      <NoteEditor
        note={editingNote}
        onClose={() => {
          setEditingNote(null);
          setShowNew(false);
          fetchNotes();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <StatusBar syncStatus={syncStatus} />
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 px-4 pb-3 pt-4 backdrop-blur-lg">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Notes</h1>
          <button
            onClick={() => router.push("/settings")}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <SearchBar onSearch={searchNotes} />
      </header>

      <main>
        {loading && notes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <p className="text-lg text-neutral-400">No notes yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Tap + to create your first note
            </p>
          </div>
        ) : (
          <div>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onTogglePin={() => togglePin(note.id)}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type Note } from "@/hooks/useNotes";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { saveLocalChange } from "@/lib/offline/sync";
import { offlineDb } from "@/lib/offline/db";
import { TagInput } from "./TagInput";

interface NoteEditorProps {
  note: Note | null;
  onClose: () => void;
}

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [noteId, setNoteId] = useState(note?.id ?? null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef({ title: note?.title ?? "", body: note?.body ?? "", tags: note?.tags ?? [] as string[] });
  const isOnline = useOnlineStatus();

  const isNew = !noteId;

  const hasChanges =
    title !== lastSavedRef.current.title ||
    body !== lastSavedRef.current.body ||
    JSON.stringify(tags) !== JSON.stringify(lastSavedRef.current.tags);

  const save = useCallback(async () => {
    if (!hasChanges && !isNew) return;
    if (saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      if (isNew) {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, tags }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        const data = await res.json();
        setNoteId(data.id);
      } else {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, tags }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      lastSavedRef.current = { title, body, tags };
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [title, body, tags, noteId, isNew, hasChanges, saving]);

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    if (!hasChanges || !isOnline) return;
    autoSaveRef.current = setTimeout(() => {
      save();
    }, 2000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [title, body, tags, hasChanges, isOnline, save]);

  const saveLocallyAndExit = useCallback(async () => {
    if (hasChanges || isNew) {
      const id = noteId ?? crypto.randomUUID();
      const now = new Date().toISOString();
      if (isNew) {
        await saveLocalChange({
          noteId: id,
          type: "create",
          data: { id, title, body, tags, pinned: false, createdAt: now, updatedAt: now },
          timestamp: Date.now(),
        });
        if (offlineDb) {
          await offlineDb.notes.put({ id, title, body, tags, pinned: false, createdAt: now, updatedAt: now });
        }
      } else {
        await saveLocalChange({
          noteId: id,
          type: "update",
          data: { title, body, tags },
          timestamp: Date.now(),
        });
        if (offlineDb) {
          const existing = await offlineDb.notes.get(id);
          if (existing) {
            await offlineDb.notes.put({ ...existing, title, body, tags, updatedAt: now });
          }
        }
      }
    }
    onClose();
  }, [noteId, title, body, tags, isNew, hasChanges, onClose]);

  async function handleSaveAndExit() {
    if (isOnline) {
      await save();
      onClose();
    } else {
      await saveLocallyAndExit();
    }
  }

  function handleClose() {
    if (hasChanges && isOnline) {
      save().then(onClose);
    } else if (hasChanges && !isOnline) {
      saveLocallyAndExit();
    } else {
      onClose();
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)]/80 px-4 py-3 backdrop-blur-lg">
        <button
          onClick={handleClose}
          className="text-base text-blue-500 hover:text-blue-400"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="text-sm text-yellow-400">Offline</span>
          )}
          {saving && (
            <span className="text-sm text-[var(--text-tertiary)]">Saving...</span>
          )}
          {saved && (
            <span className="text-sm text-green-400">Saved</span>
          )}
          {error && (
            <span className="text-sm text-red-400">Error</span>
          )}
        </div>
      </header>

      <div className="px-4 py-4 pb-28">
        {error && (
          <p className="mb-3 rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          autoFocus={isNew}
          className="mb-3 w-full bg-transparent text-3xl font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start typing..."
          rows={16}
          className="mb-4 w-full resize-none bg-transparent text-lg leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Tags
          </label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </div>

      {/* FAB action buttons */}
      <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-3">
        {/* Save */}
        <button
          onClick={save}
          disabled={saving || (!hasChanges && !isNew) || !isOnline}
          title="Save"
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
            hasChanges && isOnline
              ? "bg-blue-600 text-white shadow-blue-600/25"
              : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
          } disabled:opacity-50`}
        >
          {saving ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
        </button>
        {/* Save & Exit */}
        <button
          onClick={handleSaveAndExit}
          disabled={saving}
          title="Save & Exit"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/25 transition-all active:scale-95 disabled:opacity-50"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { type Note } from "@/hooks/useNotes";
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
  const [error, setError] = useState("");

  const isNew = !note;
  const hasChanges =
    isNew ||
    title !== note?.title ||
    body !== note?.body ||
    JSON.stringify(tags) !== JSON.stringify(note?.tags);

  async function handleSave() {
    setSaving(true);
    setError("");
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
      } else {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, tags }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 backdrop-blur-lg">
        <button
          onClick={onClose}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Cancel
        </button>
        <h2 className="text-sm font-medium text-neutral-400">
          {isNew ? "New Note" : "Edit Note"}
        </h2>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-neutral-600"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </header>

      <div className="px-4 py-4">
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
          className="mb-3 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-neutral-600"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start typing..."
          rows={12}
          className="mb-4 w-full resize-none bg-transparent text-base leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-600"
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
            Tags
          </label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </div>
    </div>
  );
}

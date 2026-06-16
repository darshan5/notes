"use client";

import { Note } from "@/hooks/useNotes";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

export function NoteCard({ note, onClick, onTogglePin, onDelete }: NoteCardProps) {
  const preview = note.body.split("\n")[0].slice(0, 120);
  const date = new Date(note.updatedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-start gap-3 border-b border-[var(--border)] px-4 py-4 active:bg-[var(--bg-hover)]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {note.pinned && (
            <span className="text-sm text-blue-400">📌</span>
          )}
          <h3 className="truncate text-lg font-medium text-[var(--text-primary)]">
            {note.title || "Untitled"}
          </h3>
        </div>
        {preview && (
          <p className="mt-0.5 truncate text-base text-[var(--text-secondary)]">{preview}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-[var(--text-tertiary)]">{dateStr}</span>
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[var(--tag-bg)] px-2 py-0.5 text-sm text-[var(--text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onTogglePin}
          className={`rounded-lg p-2.5 ${
            note.pinned
              ? "text-blue-400 hover:bg-blue-400/10"
              : "text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
          title={note.pinned ? "Unpin" : "Pin"}
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2.5 text-[var(--text-tertiary)] hover:bg-red-400/10 hover:text-red-400"
          title="Delete"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

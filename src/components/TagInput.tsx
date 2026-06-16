"use client";

import { useState, useRef } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  function addTag() {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
      onClick={() => ref.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-1 text-sm text-neutral-300"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-neutral-500 hover:text-white"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? "Add tags..." : ""}
        className="min-w-[80px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
      />
    </div>
  );
}

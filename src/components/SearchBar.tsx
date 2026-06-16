"use client";

import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, onSearch]);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
        >
          ×
        </button>
      )}
    </div>
  );
}

"use client";

import Dexie, { type Table } from "dexie";

export interface OfflineNote {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _dirty?: boolean;
  _deleted?: boolean;
}

export interface PendingChange {
  id?: number;
  noteId: string;
  type: "create" | "update" | "delete";
  data?: Partial<OfflineNote>;
  timestamp: number;
}

class NotesDatabase extends Dexie {
  notes!: Table<OfflineNote, string>;
  pendingChanges!: Table<PendingChange, number>;

  constructor() {
    super("NotesDB");
    this.version(1).stores({
      notes: "id, updatedAt, *tags",
      pendingChanges: "++id, noteId, timestamp",
    });
  }
}

export const offlineDb = typeof window !== "undefined" ? new NotesDatabase() : null;

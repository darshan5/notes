"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface StatusBarProps {
  syncStatus?: "idle" | "syncing" | "error";
}

export function StatusBar({ syncStatus = "idle" }: StatusBarProps) {
  const isOnline = useOnlineStatus();

  if (isOnline && syncStatus === "idle") return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 px-4 py-1.5 text-center text-xs font-medium ${
        !isOnline
          ? "bg-yellow-600 text-yellow-50"
          : syncStatus === "syncing"
            ? "bg-blue-600 text-blue-50"
            : syncStatus === "error"
              ? "bg-red-600 text-red-50"
              : ""
      }`}
    >
      {!isOnline
        ? "You're offline — changes saved locally"
        : syncStatus === "syncing"
          ? "Syncing..."
          : syncStatus === "error"
            ? "Sync failed — will retry"
            : null}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/notes");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
    </div>
  );
}

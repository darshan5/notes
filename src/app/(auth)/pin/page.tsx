"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PinInput } from "@/components/PinInput";
import { Suspense } from "react";

function PinPageInner() {
  const [error, setError] = useState("");
  const { setPin, verifyPin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";

  async function handleSubmit(pin: string) {
    setError("");
    try {
      if (isSetup) {
        await setPin(pin);
        router.push("/notes");
      } else {
        await verifyPin(pin);
        router.push("/notes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN verification failed");
    }
  }

  return (
    <PinInput
      onSubmit={handleSubmit}
      error={error}
      title={isSetup ? "Set Your PIN" : "Enter PIN"}
      subtitle={
        isSetup
          ? "Choose a 4-digit PIN for quick access"
          : "Enter your 4-digit PIN to continue"
      }
    />
  );
}

export default function PinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
        </div>
      }
    >
      <PinPageInner />
    </Suspense>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";

interface PinInputProps {
  onSubmit: (pin: string) => void;
  error?: string;
  title: string;
  subtitle?: string;
}

export function PinInput({ onSubmit, error, title, subtitle }: PinInputProps) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setDigits(["", "", "", ""]);
      refs[0].current?.focus();
    }
  }, [error]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }
    if (value && index === 3) {
      const pin = next.join("");
      if (pin.length === 4) onSubmit(pin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
      <h1 className="mb-2 text-2xl font-bold text-white">{title}</h1>
      {subtitle && (
        <p className="mb-8 text-sm text-neutral-400">{subtitle}</p>
      )}
      <div className="flex gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-14 w-14 rounded-xl border border-neutral-700 bg-neutral-900 text-center text-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}

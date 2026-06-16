"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      router.push("/pin?setup=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-3xl font-bold text-white">Notes</h1>
        <p className="mb-8 text-center text-sm text-neutral-400">
          Create your account
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            required
            minLength={6}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

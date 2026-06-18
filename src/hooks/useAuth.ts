"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  hasPin: boolean;
  isAdmin: boolean;
}

const STORAGE_KEY = "notes_user";

function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useAuth() {
  const [user, setUserState] = useState<User | null>(getCachedUser);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    setCachedUser(u);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      // Offline — keep cached user, don't sign out
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const u = { id: data.userId, email: data.email, hasPin: data.hasPin, isAdmin: data.isAdmin ?? false };
    setUser(u);
    return data;
  };

  const signup = async (email: string, password: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const u = { id: data.userId, email: data.email, hasPin: false, isAdmin: true };
    setUser(u);
    return data;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout-all", { method: "POST" });
    } catch {}
    setUser(null);
  };

  const verifyPin = async (pin: string) => {
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, action: "verify" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const setPin = async (pin: string) => {
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, action: "set" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(user ? { ...user, hasPin: true } : null);
    return data;
  };

  return { user, loading, login, signup, logout, verifyPin, setPin, checkAuth };
}

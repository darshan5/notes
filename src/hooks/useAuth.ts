"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  hasPin: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setUser({ id: data.userId, email: data.email, hasPin: data.hasPin, isAdmin: data.isAdmin ?? false });
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
    setUser({ id: data.userId, email: data.email, hasPin: false, isAdmin: true });
    return data;
  };

  const logout = async () => {
    await fetch("/api/auth/logout-all", { method: "POST" });
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
    setUser((u) => (u ? { ...u, hasPin: true } : null));
    return data;
  };

  return { user, loading, login, signup, logout, verifyPin, setPin, checkAuth };
}

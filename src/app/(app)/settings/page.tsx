"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface ManagedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading, logout, setPin } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchKeys();
    if (user.isAdmin) fetchUsers();
  }, [user, authLoading, router]);

  async function fetchKeys() {
    const res = await fetch("/api/api-keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys);
    }
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKeyValue(data.key);
      setNewKeyName("");
      fetchKeys();
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this API key?")) return;
    await fetch("/api/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchKeys();
  }

  async function createUser() {
    setUserError("");
    setUserSuccess("");
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setUserError("Email and password are required");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newUserEmail, password: newUserPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserError(data.error);
      return;
    }
    setUserSuccess(`User ${data.email} created`);
    setNewUserEmail("");
    setNewUserPassword("");
    fetchUsers();
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}? Their notes will also be deleted.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchUsers();
  }

  async function handleSetPin() {
    setPinError("");
    if (!/^\d{4}$/.test(pin)) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    try {
      await setPin(pin);
      setShowPinSetup(false);
      setPinValue("");
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Failed to set PIN");
    }
  }

  async function handleLogoutAll() {
    if (!confirm("This will log you out of all devices. Continue?")) return;
    await logout();
    router.replace("/login");
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 flex items-center border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 backdrop-blur-lg">
        <button
          onClick={() => router.push("/notes")}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back
        </button>
        <h1 className="ml-4 text-lg font-bold text-white">Settings</h1>
      </header>

      <div className="space-y-6 px-4 py-6">
        {/* Account */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Account
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-neutral-300">Email</span>
              <span className="text-sm text-neutral-500">{user.email}</span>
            </div>
            {user.isAdmin && (
              <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-3">
                <span className="text-sm text-neutral-300">Role</span>
                <span className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
                  Admin
                </span>
              </div>
            )}
          </div>
        </section>

        {/* User Management (admin only) */}
        {user.isAdmin && (
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
              Users
            </h2>
            <div className="space-y-2">
              {userSuccess && (
                <p className="rounded-lg bg-green-900/20 px-3 py-2 text-sm text-green-400">
                  {userSuccess}
                </p>
              )}
              {userError && (
                <p className="rounded-lg bg-red-900/20 px-3 py-2 text-sm text-red-400">
                  {userError}
                </p>
              )}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <p className="mb-3 text-sm text-neutral-400">Add a new user</p>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
                  />
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Password (6+ characters)"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
                  />
                  <button
                    onClick={createUser}
                    disabled={!newUserEmail.trim() || !newUserPassword.trim()}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Add User
                  </button>
                </div>
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">{u.email}</p>
                    {u.isAdmin && (
                      <span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-xs text-blue-400">
                        admin
                      </span>
                    )}
                  </div>
                  {!u.isAdmin && (
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Security */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Security
          </h2>
          <div className="space-y-2">
            {!showPinSetup ? (
              <button
                onClick={() => setShowPinSetup(true)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-left text-sm text-white hover:bg-neutral-800"
              >
                {user.hasPin ? "Change PIN" : "Set up PIN"}
              </button>
            ) : (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <p className="mb-3 text-sm text-neutral-400">
                  Enter a 4-digit PIN for quick access
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234"
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-center text-white outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSetPin}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Set
                  </button>
                  <button
                    onClick={() => {
                      setShowPinSetup(false);
                      setPinValue("");
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-neutral-400"
                  >
                    Cancel
                  </button>
                </div>
                {pinError && (
                  <p className="mt-2 text-xs text-red-400">{pinError}</p>
                )}
              </div>
            )}
            <button
              onClick={handleLogoutAll}
              className="w-full rounded-lg border border-red-900/50 bg-neutral-900 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-900/20"
            >
              Log out all sessions
            </button>
          </div>
        </section>

        {/* API Keys */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
            API Keys
          </h2>
          <div className="space-y-2">
            {newKeyValue && (
              <div className="rounded-lg border border-green-900/50 bg-green-900/20 p-4">
                <p className="mb-2 text-sm text-green-300">
                  Copy this key now — it won&apos;t be shown again:
                </p>
                <code className="block break-all rounded bg-neutral-900 p-2 text-xs text-green-400">
                  {newKeyValue}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newKeyValue);
                    setNewKeyValue("");
                  }}
                  className="mt-2 text-xs text-green-400 hover:text-green-300"
                >
                  Copy & dismiss
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., CLI)"
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
              />
              <button
                onClick={createKey}
                disabled={!newKeyName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Create
              </button>
            </div>
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{key.name}</p>
                  <p className="text-xs text-neutral-500">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt &&
                      ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
            {keys.length === 0 && !newKeyValue && (
              <p className="py-2 text-sm text-neutral-500">
                No API keys yet. Create one to access notes from external tools.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

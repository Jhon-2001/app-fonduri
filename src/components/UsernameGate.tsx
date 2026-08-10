"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getStoredUserId,
  getStoredUsername,
  storeUser,
} from "@/lib/storage";

export function UsernameGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = getStoredUsername();
    const userId = getStoredUserId();
    if (existing && userId) {
      setNeedsUsername(false);
    } else {
      setNeedsUsername(true);
    }
    setReady(true);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la salvare.");
        return;
      }
      storeUser(data.user.username, data.user.id);
      setNeedsUsername(false);
    } catch {
      setError("Nu s-a putut conecta la server.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--muted)]">
        Se încarcă...
      </div>
    );
  }

  if (needsUsername) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl"
        >
          <h1 className="text-2xl font-bold text-[var(--fg)]">
            Bun venit
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Introdu un nume de utilizator pentru a începe. Timpul de completare
            a formularului va intra în clasament.
          </p>

          <label className="mt-6 block text-sm font-semibold text-[var(--fg)]">
            Nume utilizator *
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-[var(--fg)] outline-none ring-[var(--brand-blue)] focus:ring-2"
              placeholder="ex: ion.popescu"
              maxLength={40}
              required
            />
          </label>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 w-full px-4 py-3"
          >
            {loading ? "Se salvează..." : "Continuă"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

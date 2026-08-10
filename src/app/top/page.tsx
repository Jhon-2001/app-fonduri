"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { formatDuration } from "@/lib/storage";

type Row = {
  id: number;
  username: string;
  duration_ms: number;
  project_title: string;
  domain: string;
  created_at: string;
};

export default function TopPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Eroare la încărcare.");
          return;
        }
        setRows(data.rows ?? []);
      } catch {
        setError("Nu s-a putut încărca clasamentul.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <Header showHome />

      <main className="mx-auto w-full max-w-3xl px-4 pt-4">
        <BackButton />

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-blue)]/15 text-[var(--brand-blue)]">
            <Trophy size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--fg)]">
              Clasament timp completare
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Cei mai rapizi la completarea formularului
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Link
            href="/aplica"
            className="btn-primary px-4 py-2 text-sm"
          >
            Completează formularul
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {loading && (
            <p className="p-6 text-sm text-[var(--muted)]">Se încarcă...</p>
          )}
          {error && (
            <p className="p-6 text-sm text-red-400">{error}</p>
          )}
          {!loading && !error && rows.length === 0 && (
            <p className="p-6 text-sm text-[var(--muted)]">
              Încă nu există depuneri. Fii primul în clasament!
            </p>
          )}
          {!loading && rows.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Utilizator</th>
                  <th className="px-4 py-3 font-medium">Timp</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    Proiect
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--brand-blue)]">
                      {index + 1}
                    </td>
                    <td className="max-w-[180px] truncate whitespace-nowrap px-4 py-3 text-[var(--fg)]" title={row.username}>
                      {row.username}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--brand-green)]">
                      {formatDuration(row.duration_ms)}
                    </td>
                    <td className="hidden px-4 py-3 text-[var(--muted)] sm:table-cell">
                      <div className="max-w-[220px] truncate">
                        {row.project_title}
                      </div>
                      <div className="truncate text-xs">{row.domain}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

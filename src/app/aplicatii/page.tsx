"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { formatDuration } from "@/lib/storage";
import { COUNTIES } from "@/lib/seed-top10";
import { DOMAINS } from "@/lib/domains";

type AppRow = {
  id: number;
  app_number: string;
  username: string;
  institution: string;
  project_title: string;
  domain: string;
  county: string;
  locality: string;
  status: string;
  duration_ms: number;
  created_at: string;
  is_reference: number;
};

function formatDate(value: string) {
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;
}

export default function AplicatiiPage() {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [top10, setTop10] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [county, setCounty] = useState("");
  const [domain, setDomain] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (county) params.set("county", county);
        if (domain) params.set("domain", domain);

        const [allRes, topRes] = await Promise.all([
          fetch(`/api/aplicatii?${params.toString()}`),
          fetch("/api/aplicatii?top=1"),
        ]);
        const allData = await allRes.json();
        const topData = await topRes.json();
        if (!allRes.ok) {
          setError(allData.error || "Eroare la încărcare.");
          return;
        }
        setRows(allData.rows ?? []);
        setTop10(
          (topData.rows ?? []).map(
            (r: {
              id: number;
              username: string;
              duration_ms: number;
              project_title: string;
              domain: string;
              created_at: string;
              app_number?: string;
              institution?: string;
              county?: string;
              locality?: string;
              status?: string;
            }) => ({
              id: r.id,
              app_number: r.app_number || `ADRNV-${r.id}`,
              username: r.username,
              institution: r.institution || r.username,
              project_title: r.project_title,
              domain: r.domain,
              county: r.county || "",
              locality: r.locality || "",
              status: r.status || "Depus",
              duration_ms: r.duration_ms,
              created_at: r.created_at,
              is_reference: 0,
            })
          )
        );
      } catch {
        setError("Nu s-au putut încărca aplicațiile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [q, county, domain]);

  const domainOptions = useMemo(
    () => DOMAINS.flatMap((d) => [d.label, ...d.subdomains]),
    []
  );

  return (
    <div className="min-h-screen pb-16">
      <Header showHome />

      <main className="mx-auto w-full max-w-6xl px-4 pt-2">
        <BackButton />

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--fg)] sm:text-3xl">
            Aplicații depuse – ADR Nord-Vest
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Verificați aici că aplicația dvs. a fost înregistrată cu succes.
          </p>
          <Link
            href="/aplica"
            className="btn-primary mt-5 inline-flex px-5 py-3"
          >
            <Plus size={18} />
            Depune o altă aplicație
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 text-lg font-bold text-[var(--fg)]">
            Top 10 cei mai buni timpi
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Incluzând cele mai rapide 10 depuneri extrase de pe platforma
            oficială (27.02.2026, de la 10:00:26).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Număr aplicație</th>
                  <th className="px-3 py-2 font-medium">Instituție</th>
                  <th className="px-3 py-2 font-medium">Timp</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">
                    Domeniu
                  </th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {top10.map((row, index) => (
                  <tr
                    key={`top-${row.id}`}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="px-3 py-3 font-semibold text-[var(--brand-blue)]">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg bg-[var(--input)] px-2 py-1 text-xs font-medium text-[var(--fg)]">
                        {row.app_number}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--fg)]">
                      {row.institution}
                    </td>
                    <td className="px-3 py-3 font-mono text-[var(--brand-green)]">
                      {formatDuration(row.duration_ms)}
                    </td>
                    <td className="hidden max-w-[220px] truncate px-3 py-3 text-[var(--muted)] md:table-cell">
                      {row.domain}
                    </td>
                    <td className="hidden px-3 py-3 text-[var(--muted)] lg:table-cell">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm font-semibold text-[var(--fg)] md:col-span-1">
              Căutare
              <div className="relative mt-2">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Căutați după număr aplicație, instituție sau proiect..."
                  className="w-full rounded-xl border border-transparent bg-[var(--input)] py-3 pl-10 pr-3 font-normal text-[var(--fg)] outline-none ring-[var(--brand-blue)] focus:ring-2"
                />
              </div>
            </label>

            <label className="block text-sm font-semibold text-[var(--fg)]">
              Filtrare după județ
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="mt-2 w-full rounded-xl border border-transparent bg-[var(--input)] px-3 py-3 font-normal text-[var(--fg)] outline-none ring-[var(--brand-blue)] focus:ring-2"
              >
                <option value="">Toate județele</option>
                {COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[var(--fg)]">
              Domeniu de activitate
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-2 w-full rounded-xl border border-transparent bg-[var(--input)] px-3 py-3 font-normal text-[var(--fg)] outline-none ring-[var(--brand-blue)] focus:ring-2"
              >
                <option value="">Toate domeniile</option>
                {domainOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {loading && (
            <p className="p-6 text-sm text-[var(--muted)]">Se încarcă...</p>
          )}
          {error && <p className="p-6 text-sm text-red-400">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="p-6 text-sm text-[var(--muted)]">
              Nu există aplicații pentru filtrele selectate.
            </p>
          )}
          {!loading && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Număr aplicație</th>
                    <th className="px-4 py-3 font-medium">Instituție</th>
                    <th className="px-4 py-3 font-medium">Domeniu</th>
                    <th className="px-4 py-3 font-medium">Județ</th>
                    <th className="px-4 py-3 font-medium">Localitate</th>
                    <th className="px-4 py-3 font-medium">Timp</th>
                    <th className="px-4 py-3 font-medium">Data depunerii</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-[var(--input)] px-2 py-1 text-xs font-medium text-[var(--fg)]">
                          {row.app_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--fg)]">
                        {row.institution}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-[var(--muted)]">
                        {row.domain}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {row.county || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {row.locality || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--brand-green)]">
                        {formatDuration(row.duration_ms)}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[var(--brand-green)]/15 px-2.5 py-1 text-xs font-medium text-[var(--brand-green)]">
                          {row.status || "Depus"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--brand-blue)] underline"
          >
            Înapoi la pagina principală
          </Link>
        </div>
      </main>
    </div>
  );
}

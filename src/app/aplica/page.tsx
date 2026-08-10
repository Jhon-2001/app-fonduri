"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { ApplicationForm } from "@/components/ApplicationForm";
import { formatDuration, getFormDurationMs } from "@/lib/storage";

const LIMIT_MS = 25_000;

function AplicaContent() {
  const searchParams = useSearchParams();
  const shuffle = searchParams.get("shuffle") === "1";
  const openKey = searchParams.get("open") ?? "default";
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(getFormDurationMs());
    }, 100);
    return () => window.clearInterval(id);
  }, [openKey]);

  const overLimit = elapsed >= LIMIT_MS;

  return (
    <div className="min-h-screen">
      <Header
        showHome
        trailing={
          <div
            className={`flex items-center gap-1.5 font-mono text-base font-semibold tabular-nums transition-colors ${
              overLimit ? "text-red-500" : "text-[#60a5fa]"
            }`}
          >
            <Timer size={18} strokeWidth={2} className="shrink-0" />
            {formatDuration(elapsed)}
          </div>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <BackButton />

        <div className="fx-heading mb-6">
          Formular aplicație – ADR Nord-Vest
          {shuffle ? " (ordine aleatoare)" : ""}
        </div>

        <ApplicationForm
          key={openKey}
          shuffleFields={shuffle}
          onReshuffle={() => setElapsed(0)}
        />
      </main>
    </div>
  );
}

export default function AplicaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          Se încarcă...
        </div>
      }
    >
      <AplicaContent />
    </Suspense>
  );
}

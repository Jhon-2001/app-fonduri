"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  Plus,
  Shuffle,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/Header";

export default function HomePage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  function openForm() {
    router.push(`/aplica?open=${Date.now()}`);
  }

  function openRandomForm() {
    router.push(`/aplica?shuffle=1&open=${Date.now()}`);
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-16 pt-8 text-center">
        <h1 className="max-w-4xl text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl sm:leading-snug">
          Apelul de selecție al partenerilor dedicat DTE2 – „Sprijin pentru
          pregătirea documentațiilor tehnico-economice pentru proiecte care
          vizează următoarea perioadă de programare”
        </h1>

        <p className="mt-6 text-lg font-medium text-[var(--brand-green)]">
          Acces platformă depunere aplicații
        </p>

        <h2 className="mt-6 text-sm font-semibold text-[var(--fg)] sm:text-base">
          Calendar estimativ al apelului de selecție a partenerilor
        </h2>

        <ul className="mt-3 w-full max-w-2xl space-y-1.5 text-left text-sm">
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="text-[var(--muted)]">Consultare publică</span>
            <span className="shrink-0 font-semibold text-[var(--brand-blue)]">
              22.04.2026 – 30.04.2026
            </span>
          </li>
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="text-[var(--muted)]">
              Publicare Ghid final / anunț selecție parteneri
            </span>
            <span className="shrink-0 font-semibold text-[var(--brand-blue)]">
              31 iulie 2026
            </span>
          </li>
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="font-medium text-[var(--brand-green)]">
              Termen depunere fișe de proiecte
            </span>
            <span className="shrink-0 font-semibold text-[var(--brand-blue)]">
              14.08.2026, 10:00 – 31.08.2026, 10:00
            </span>
          </li>
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="text-[var(--muted)]">
              Depunere cereri MySMIS (necompetitive)
            </span>
            <span className="shrink-0 font-semibold text-[var(--brand-blue)]">
              31.08.2026, 10:00 – 30.10.2026, 10:00
            </span>
          </li>
        </ul>

        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={openForm} className="btn-primary px-5 py-3">
            <Plus size={18} />
            Deschide formular
          </button>
          <button
            type="button"
            onClick={openRandomForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 font-semibold text-[var(--fg)] transition hover:bg-[var(--surface-2)]"
          >
            <Shuffle size={18} />
            Deschide formular aleator
          </button>
          <Link
            href="/aplicatii"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 font-semibold text-[var(--fg)] transition hover:bg-[var(--surface-2)]"
          >
            <FileText size={18} />
            Vezi aplicațiile depuse
          </Link>
          <Link
            href="/top"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 font-semibold text-[var(--fg)] transition hover:bg-[var(--surface-2)]"
          >
            <Trophy size={18} />
            Clasament timp
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--fg)]">
          <Link
            href="/documentatie"
            className="inline-flex items-center gap-2 hover:text-[var(--brand-blue)]"
          >
            <BookOpen size={16} />
            Documentație
          </Link>
          <Link
            href="/intrebari-frecvente"
            className="inline-flex items-center gap-2 hover:text-[var(--brand-blue)]"
          >
            <HelpCircle size={16} />
            Întrebări frecvente
          </Link>
          <Link
            href="/top"
            className="inline-flex items-center gap-2 hover:text-[var(--brand-blue)]"
          >
            <Trophy size={16} />
            Clasament timp
          </Link>
        </div>

        <section
          id="despre"
          className="mt-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left"
        >
          <h2 className="text-xl font-bold text-[var(--fg)]">
            Despre acest apel
          </h2>
          <p className="mt-4 text-[var(--fg)] leading-relaxed">
            Agenția de Dezvoltare Regională Nord-Vest lansează un apel pentru{" "}
            <strong>selectarea partenerilor</strong> cu care va depune,
            ulterior,{" "}
            <strong>
              cereri de finanțare pentru pregătirea documentațiilor
              tehnico-economice (DTE)
            </strong>{" "}
            aferente unor proiecte de investiții viitoare.
          </p>

          {expanded && (
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
              <p>
                Acest apel <strong className="text-[var(--fg)]">nu finanțează lucrări</strong> și{" "}
                <strong className="text-[var(--fg)]">nu finanțează investiții</strong>; are ca
                scop identificarea proiectelor și a partenerilor care vor pregăti
                documentațiile tehnice necesare pentru o etapă viitoare de
                finanțare; se desfășoară în cadrul mecanismului de dezvoltare
                teritorială integrată (DTE).
              </p>
              <p>
                Agenția de Dezvoltare Regională Nord-Vest are rolul de lider de
                parteneriat și aplică o procedură de selecție competitivă, pe
                baza unei fișe de proiect și a unei grile de evaluare.
              </p>
              <p>
                Pot depune fișe de proiect: unități administrativ-teritoriale și
                instituții publice; organizații neguvernamentale, asociații și
                alte entități cu personalitate juridică, cu condiția
                îndeplinirii criteriilor de eligibilitate.
              </p>
              <p>
                Depunerea unei fișe de proiect nu garantează selecția și nu
                generează automat finanțare.
              </p>
              <p>
                Fișele de proiect pot viza investiții din domenii precum:
                eficiență energetică; infrastructură verde; mobilitate urbană;
                infrastructură rutieră; educație; regenerare urbană și rurală;
                patrimoniu; turism, precum și alte domenii eligibile.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition hover:bg-[var(--surface-2)]"
          >
            <ChevronDown
              size={16}
              className={`transition ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Vezi mai puțin" : "Vezi mai mult"}
          </button>
        </section>
      </main>
    </div>
  );
}

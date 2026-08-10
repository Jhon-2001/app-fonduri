"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Plus } from "lucide-react";
import { DOMAINS } from "@/lib/domains";
import { COUNTIES, localitiesForCounty } from "@/lib/locations";
import {
  clearFormTimer,
  formatDuration,
  getFormDurationMs,
  getStoredUserId,
  getStoredUsername,
  startFormTimer,
} from "@/lib/storage";
import {
  ExpectedAnswers,
  getExpectedAnswers,
  validateAgainstExpected,
} from "@/lib/expected-answers";
import { DocumentUpload } from "./DocumentUpload";
import { RecaptchaChallenge } from "./RecaptchaChallenge";

type FormState = ExpectedAnswers & {
  domainId: string;
  subdomain: string;
  captchaAnswer: string;
};

type FieldKey = keyof ExpectedAnswers;

const FIELD_META: Record<
  FieldKey,
  { label: string; required?: boolean; type?: string }
> = {
  institution: { label: "Numele instituției *", required: true },
  representative: { label: "Numele reprezentantului legal *", required: true },
  email: { label: "Adresa de e-mail *", required: true, type: "email" },
  phone: { label: "Număr de telefon" },
  county: { label: "Județ" },
  locality: { label: "Localitate" },
  projectTitle: { label: "Titlul proiectului *", required: true },
  amount: { label: "Valoarea solicitată (euro) *", required: true },
  score: { label: "Punctaj prescorat *", required: true },
};

/** Layout ca pe platformă: full-width + perechi pe 2 coloane */
type LayoutRow =
  | { type: "full"; field: FieldKey }
  | { type: "pair"; fields: [FieldKey, FieldKey] };

const INSTITUTION_LAYOUT: LayoutRow[] = [
  { type: "full", field: "institution" },
  { type: "full", field: "representative" },
  { type: "pair", fields: ["email", "phone"] },
  { type: "pair", fields: ["county", "locality"] },
];

const PROJECT_LAYOUT: LayoutRow[] = [
  { type: "full", field: "projectTitle" },
  { type: "pair", fields: ["amount", "score"] },
];

/** Câmpuri care se amestecă liber (fără județ/localitate – acelea stau mereu împreună) */
const SHUFFLEABLE_FIELDS: FieldKey[] = [
  "institution",
  "representative",
  "email",
  "phone",
  "projectTitle",
  "amount",
  "score",
];

const COUNTY_LOCALITY_PAIR: LayoutRow = {
  type: "pair",
  fields: ["county", "locality"],
};

const initialState: FormState = {
  institution: "",
  representative: "",
  email: "",
  phone: "",
  county: "",
  locality: "",
  projectTitle: "",
  amount: "",
  score: "",
  domainId: "",
  subdomain: "",
  captchaAnswer: "",
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type ShuffleUnit = { kind: "field"; field: FieldKey } | { kind: "countyPair" };

function buildShuffledLayouts(): {
  institution: LayoutRow[];
  project: LayoutRow[];
} {
  const units: ShuffleUnit[] = [
    ...SHUFFLEABLE_FIELDS.map((field) => ({ kind: "field" as const, field })),
    { kind: "countyPair" },
  ];
  const order = shuffle(units);

  const rows: LayoutRow[] = [];
  let i = 0;
  while (i < order.length) {
    const unit = order[i];
    if (unit.kind === "countyPair") {
      rows.push(COUNTY_LOCALITY_PAIR);
      i += 1;
      continue;
    }

    const next = order[i + 1];
    const canPair =
      next &&
      next.kind === "field" &&
      Math.random() >= 0.45;

    if (canPair && next.kind === "field") {
      rows.push({ type: "pair", fields: [unit.field, next.field] });
      i += 2;
    } else {
      rows.push({ type: "full", field: unit.field });
      i += 1;
    }
  }

  const mid = Math.ceil(rows.length / 2);
  return {
    institution: rows.slice(0, mid),
    project: rows.slice(mid),
  };
}

type Props = {
  shuffleFields?: boolean;
  onReshuffle?: () => void;
};

export function ApplicationForm({
  shuffleFields = false,
  onReshuffle,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [hasValidDoc, setHasValidDoc] = useState(false);
  const [recaptchaOk, setRecaptchaOk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const [institutionLayout, setInstitutionLayout] =
    useState<LayoutRow[]>(INSTITUTION_LAYOUT);
  const [projectLayout, setProjectLayout] =
    useState<LayoutRow[]>(PROJECT_LAYOUT);
  const [blockOrder, setBlockOrder] = useState<
    Array<"institution" | "project" | "documents" | "security">
  >(["institution", "project", "documents", "security"]);

  const captcha = useMemo(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, sum: a + b };
  }, []);

  const selectedDomain = DOMAINS.find((d) => d.id === form.domainId);

  function applyShuffle() {
    if (shuffleFields) {
      const layouts = buildShuffledLayouts();
      setInstitutionLayout(layouts.institution);
      setProjectLayout(layouts.project);
      // Securitatea rămâne mereu jos, ca pe platformă
      setBlockOrder([
        ...shuffle(["institution", "project", "documents"] as const),
        "security",
      ]);
    } else {
      setInstitutionLayout(INSTITUTION_LAYOUT);
      setProjectLayout(PROJECT_LAYOUT);
      setBlockOrder(["institution", "project", "documents", "security"]);
    }
  }

  useEffect(() => {
    applyShuffle();
    startFormTimer();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleFields]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      if (key === "county") {
        return {
          ...prev,
          county: value as string,
          locality: value === "Cluj" ? prev.locality : "",
        };
      }
      return { ...prev, [key]: value };
    });
  }

  const localityOptions = localitiesForCounty(form.county);
  const localityEnabled = form.county === "Cluj";

  function reshuffle() {
    applyShuffle();
    setForm(initialState);
    setHasValidDoc(false);
    setRecaptchaOk(false);
    setError("");
    setSuccess("");
    startFormTimer();
    onReshuffle?.();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const expected = getExpectedAnswers();
    const answerErrors = validateAgainstExpected(form, expected);
    if (answerErrors.length > 0) {
      setError(answerErrors[0]);
      return;
    }

    if (!form.domainId || !form.subdomain) {
      setError("Selectează un domeniu și un domeniu secundar.");
      return;
    }

    if (!hasValidDoc) {
      setError("Încarcă cel puțin un document PDF valid.");
      return;
    }

    if (!recaptchaOk) {
      setError("Finalizează verificarea reCAPTCHA.");
      return;
    }

    if (Number(form.captchaAnswer) !== captcha.sum) {
      setError("Răspunsul la verificarea de securitate este greșit.");
      return;
    }

    const username = getStoredUsername();
    const userId = getStoredUserId();
    if (!username || !userId) {
      setError("Utilizatorul nu este setat. Reîncarcă pagina.");
      return;
    }

    setSubmitting(true);
    const durationMs = getFormDurationMs();

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username,
          durationMs,
          institution: form.institution,
          projectTitle: form.projectTitle,
          domain: selectedDomain?.label ?? form.domainId,
          subdomain: form.subdomain,
          county: form.county,
          locality: form.locality,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Depunerea a eșuat.");
        return;
      }

      clearFormTimer();
      setSuccess(
        `Aplicația ${data.appNumber ?? ""} a fost depusă! Timp: ${formatDuration(durationMs)}.`
      );
      setTimeout(() => router.push("/aplicatii"), 1200);
    } catch {
      setError("Eroare de rețea la depunere.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(key: FieldKey) {
    const meta = FIELD_META[key];

    if (key === "county") {
      return (
        <div key={key} className="w-full">
          <label className="fx-label" htmlFor="f-county">
            {meta.label}
          </label>
          <select
            id="f-county"
            className="fx-input"
            value={form.county}
            onChange={(e) => update("county", e.target.value)}
          >
            <option value="">Selectează județul</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (key === "locality") {
      return (
        <div key={key} className="w-full">
          <label className="fx-label" htmlFor="f-locality">
            {meta.label}
          </label>
          <select
            id="f-locality"
            className="fx-input disabled:cursor-not-allowed disabled:opacity-50"
            value={form.locality}
            disabled={!localityEnabled}
            onChange={(e) => update("locality", e.target.value)}
          >
            <option value="">
              {localityEnabled
                ? "Selectează localitatea"
                : "Selectează mai întâi județul Cluj"}
            </option>
            {localityOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={key} className="w-full">
        <label className="fx-label" htmlFor={`f-${key}`}>
          {meta.label}
        </label>
        <input
          id={`f-${key}`}
          type={meta.type ?? "text"}
          className="fx-input"
          value={form[key]}
          required={meta.required}
          onChange={(e) => update(key, e.target.value)}
        />
      </div>
    );
  }

  function renderLayout(rows: LayoutRow[]) {
    return (
      <div className="space-y-6">
        {rows.map((row, idx) =>
          row.type === "full" ? (
            <div key={`${row.field}-${idx}`}>{renderField(row.field)}</div>
          ) : (
            <div
              key={`${row.fields.join("-")}-${idx}`}
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              {row.fields.map(renderField)}
            </div>
          )
        )}
      </div>
    );
  }

  const institutionBlock = (
    <div key="institution" className="fx-card">
      <div className="fx-heading">Detalii instituție/organizație</div>
      {renderLayout(institutionLayout)}
    </div>
  );

  const projectBlock = (
    <div key="project" className="fx-card">
      <div className="fx-heading">Detalii proiect</div>
      {renderLayout(projectLayout)}

      <div className="mt-6">
        <div className="fx-label mb-3">Domenii fișe de proiect DTE *</div>
        <div>
          {DOMAINS.map((domain) => {
            const active = form.domainId === domain.id;
            return (
              <div key={domain.id} className="mb-3">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="domain"
                    className="fx-radio"
                    value={domain.id}
                    checked={active}
                    onChange={() => {
                      update("domainId", domain.id);
                      update("subdomain", "");
                    }}
                    required
                  />
                  <span>{domain.label}</span>
                </label>

                {active && (
                  <div className="fx-subgroup space-y-2">
                    <div className="fx-sublabel">
                      Selectează un domeniu secundar: *
                    </div>
                    {domain.subdomains.map((sub) => (
                      <label key={sub} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="subdomain"
                          className="fx-radio"
                          value={sub}
                          checked={form.subdomain === sub}
                          onChange={() => update("subdomain", sub)}
                          required
                        />
                        <span>{sub}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const documentsBlock = (
    <div key="documents">
      <DocumentUpload onValidChange={setHasValidDoc} />
    </div>
  );

  const securityBlock = (
    <div key="security" className="fx-card">
      <div className="fx-heading !mb-2">Verificare de securitate</div>
      <p className="mb-6 text-sm text-[var(--muted)] opacity-80">
        În formularul real, veți trebui să rezolvați o întrebare matematică
        simplă pentru a preveni spam-ul.
      </p>
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-lg font-semibold text-[var(--fg)] dark:bg-zinc-800">
          {captcha.a} + {captcha.b} = ?
        </div>
        <div className="min-w-0 flex-1">
          <label className="fx-label" htmlFor="f-captcha">
            Răspuns
          </label>
          <input
            id="f-captcha"
            className="fx-input"
            value={form.captchaAnswer}
            onChange={(e) => update("captchaAnswer", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-6">
        <RecaptchaChallenge verified={recaptchaOk} onChange={setRecaptchaOk} />
      </div>
    </div>
  );

  const blocks = {
    institution: institutionBlock,
    project: projectBlock,
    documents: documentsBlock,
    security: securityBlock,
  };

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Se încarcă...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {shuffleFields && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={reshuffle}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--fg)]"
          >
            Reamestecă
          </button>
        </div>
      )}

      {blockOrder.map((id) => blocks[id])}

      {error && (
        <p className="fx-card !py-3 text-sm text-red-500">{error}</p>
      )}
      {success && (
        <p className="fx-card !py-3 text-sm text-emerald-500">{success}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-medium"
        >
          <Plus size={16} strokeWidth={2.5} />
          {submitting ? "Se depune..." : "Depune"}
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--fg)] hover:bg-[var(--surface-2)]"
        >
          <Home size={16} />
          Pagina principală
        </Link>
      </div>
    </form>
  );
}

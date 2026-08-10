"use client";

import { FormEvent, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import {
  EMPTY_EXPECTED,
  EXPECTED_FIELDS,
  ExpectedAnswers,
  getExpectedAnswers,
  getSkipValidation,
  saveExpectedAnswers,
  saveSkipValidation,
} from "@/lib/expected-answers";
import { COUNTIES, localitiesForCounty } from "@/lib/locations";

export default function AdminPage() {
  const [answers, setAnswers] = useState<ExpectedAnswers>(EMPTY_EXPECTED);
  const [skipValidation, setSkipValidation] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAnswers(getExpectedAnswers());
    setSkipValidation(getSkipValidation());
    setReady(true);
  }, []);

  function update(key: keyof ExpectedAnswers, value: string) {
    setAnswers((prev) => {
      if (key === "county") {
        return {
          ...prev,
          county: value,
          locality: value === "Cluj" ? prev.locality : "",
        };
      }
      return { ...prev, [key]: value };
    });
    setSaved(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveExpectedAnswers(answers);
    saveSkipValidation(skipValidation);
    setSaved(true);
  }

  function handleClear() {
    setAnswers(EMPTY_EXPECTED);
    saveExpectedAnswers(EMPTY_EXPECTED);
    setSaved(true);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Se încarcă...
      </div>
    );
  }

  const localityOptions = localitiesForCounty(answers.county);
  const localityEnabled = answers.county === "Cluj";

  return (
    <div className="min-h-screen">
      <Header showHome />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <BackButton href="/" />

        <div className="fx-card mb-8">
          <div className="fx-heading !mb-2">Admin – răspunsuri așteptate</div>
          <p className="fx-sublabel !mb-0">
            Setează valorile exacte pe care utilizatorul trebuie să le introducă
            în fiecare câmp pentru ca formularul să se valideze la depunere.
            Upload-ul PDF și selecția de domeniu/subdomeniu nu sunt verificate
            aici. Câmpurile lăsate goale nu sunt verificate. Localitatea se
            activează doar pentru județul Cluj.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="fx-card">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={skipValidation}
                onChange={(e) => {
                  const next = e.target.checked;
                  setSkipValidation(next);
                  saveSkipValidation(next);
                  setSaved(true);
                }}
              />
              <span>
                <span className="block font-medium text-[var(--fg)]">
                  Nu verifica datele la depunere
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  Dacă e activă, formularul nu compară câmpurile cu valorile
                  setate aici. Captcha / reCAPTCHA rămân obligatorii.
                </span>
              </span>
            </label>
          </div>

          <div className="fx-card space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {EXPECTED_FIELDS.map(({ key, label }) => {
                if (key === "county") {
                  return (
                    <div key={key} className="w-full">
                      <label className="fx-label" htmlFor={`admin-${key}`}>
                        {label}
                      </label>
                      <select
                        id={`admin-${key}`}
                        className="fx-input"
                        value={answers.county}
                        onChange={(e) => update("county", e.target.value)}
                      >
                        <option value="">— fără verificare —</option>
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
                      <label className="fx-label" htmlFor={`admin-${key}`}>
                        {label}
                      </label>
                      <select
                        id={`admin-${key}`}
                        className="fx-input disabled:cursor-not-allowed disabled:opacity-50"
                        value={answers.locality}
                        disabled={!localityEnabled}
                        onChange={(e) => update("locality", e.target.value)}
                      >
                        <option value="">
                          {localityEnabled
                            ? "— fără verificare —"
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
                    <label className="fx-label" htmlFor={`admin-${key}`}>
                      {label}
                    </label>
                    <input
                      id={`admin-${key}`}
                      className="fx-input"
                      value={answers[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={`Valoare corectă pentru ${label.toLowerCase()}`}
                    />
                  </div>
                );
              })}
            </div>

            {saved && (
              <p className="text-sm text-emerald-500">
                Setările au fost salvate.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary px-4 py-2.5 text-sm">
                Salvează
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--fg)]"
              >
                Șterge răspunsurile
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

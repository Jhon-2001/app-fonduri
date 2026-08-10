"use client";

import { useRef, useState } from "react";
import { FileText, Plus, X } from "lucide-react";

const MAX_FILES = 10;
const MAX_SIZE = 15 * 1024 * 1024;

type FileSlot = {
  id: string;
  file: File | null;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
};

function createSlot(): FileSlot {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file: null,
    status: "idle",
  };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  onValidChange: (hasValidFile: boolean) => void;
};

export function DocumentUpload({ onValidChange }: Props) {
  const [slots, setSlots] = useState<FileSlot[]>([createSlot()]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function syncValidity(next: FileSlot[]) {
    onValidChange(next.some((s) => s.status === "done" && s.file));
  }

  function updateSlot(id: string, patch: Partial<FileSlot>) {
    setSlots((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      syncValidity(next);
      return next;
    });
  }

  async function simulateUpload(id: string, file: File) {
    updateSlot(id, { file, status: "uploading", error: undefined });
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    updateSlot(id, { file, status: "done" });
  }

  function handleFileChange(id: string, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      updateSlot(id, { file: null, status: "idle", error: undefined });
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      updateSlot(id, {
        file: null,
        status: "error",
        error: "Doar fișiere PDF sunt acceptate.",
      });
      if (inputRefs.current[id]) inputRefs.current[id]!.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      updateSlot(id, {
        file: null,
        status: "error",
        error: "Fișierul depășește 15MB.",
      });
      if (inputRefs.current[id]) inputRefs.current[id]!.value = "";
      return;
    }

    void simulateUpload(id, file);
  }

  function addSlot() {
    if (slots.length >= MAX_FILES) return;
    setSlots((prev) => [...prev, createSlot()]);
  }

  function removeSlot(id: string) {
    setSlots((prev) => {
      const next =
        prev.length === 1 ? [createSlot()] : prev.filter((s) => s.id !== id);
      syncValidity(next);
      return next;
    });
  }

  function clearSlot(id: string) {
    if (inputRefs.current[id]) inputRefs.current[id]!.value = "";
    updateSlot(id, { file: null, status: "idle", error: undefined });
  }

  return (
    <div className="fx-card">
      <div className="fx-heading">Documente</div>

      <div className="space-y-4">
        {slots.map((slot, index) => (
          <div key={slot.id}>
            <label className="fx-label">
              Încărcare document {index === 0 ? "*" : ""}
            </label>

            {slot.status === "done" && slot.file ? (
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <FileText
                    size={32}
                    strokeWidth={1.5}
                    className="shrink-0 text-zinc-500 dark:text-zinc-400"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[var(--fg)]">
                      {slot.file.name}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {formatBytes(slot.file.size)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => clearSlot(slot.id)}
                  aria-label="Elimină fișier"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <X size={16} />
                </button>
                {index === slots.length - 1 && slots.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={addSlot}
                    aria-label="Adaugă fișier"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--fg)]"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  ref={(el) => {
                    inputRefs.current[slot.id] = el;
                  }}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => handleFileChange(slot.id, e.target.files)}
                  className="block w-full text-sm text-[var(--fg)] file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--input)] file:px-3 file:py-2 file:text-[var(--fg)]"
                />
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    aria-label="Elimină fișier"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)]"
                  >
                    <X size={16} />
                  </button>
                )}
                {index === slots.length - 1 && slots.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={addSlot}
                    aria-label="Adaugă fișier"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--fg)]"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            )}

            {slot.status === "uploading" && (
              <p className="fx-sublabel mt-2 mb-0">
                Se încarcă {slot.file?.name}...
              </p>
            )}
            {slot.status === "error" && (
              <p className="mt-1 text-xs text-red-500">{slot.error}</p>
            )}
          </div>
        ))}
      </div>

      {slots.length < MAX_FILES && (
        <button
          type="button"
          onClick={addSlot}
          className="mt-4 text-sm font-medium text-[var(--fg)] hover:underline"
        >
          + Adaugă alt fișier
        </button>
      )}

      <p className="fx-sublabel mt-4 mb-0">
        Formate acceptate: PDF. Dimensiune maximă: 15MB per fișier. Maxim 10
        fișiere.
      </p>
    </div>
  );
}

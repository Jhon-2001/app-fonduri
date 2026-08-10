"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Home, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Header({
  showHome = false,
  sticky = true,
  trailing,
}: {
  showHome?: boolean;
  sticky?: boolean;
  trailing?: ReactNode;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={`w-full border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur ${
        sticky ? "sticky top-0 z-40" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            <span className="text-sm font-black tracking-tighter">
              <span className="text-[var(--brand-green)]">A</span>
              <span className="text-[var(--brand-blue)]">N</span>
            </span>
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-[var(--brand-blue)]">
              ADR
            </span>
            <span className="block text-xs font-semibold text-[var(--brand-green)]">
              Nord-Vest
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {trailing}

          <div
            className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
            role="radiogroup"
            aria-label="Temă"
          >
            <button
              type="button"
              role="radio"
              aria-checked={theme === "light"}
              aria-label="Mod deschis"
              onClick={() => setTheme("light")}
              className={`rounded-full p-2 transition ${
                theme === "light"
                  ? "bg-[var(--chip-active)] text-[var(--fg)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              <Sun size={16} />
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "dark"}
              aria-label="Mod întunecat"
              onClick={() => setTheme("dark")}
              className={`rounded-full p-2 transition ${
                theme === "dark"
                  ? "bg-[var(--chip-active)] text-[var(--fg)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              <Moon size={16} />
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "system"}
              aria-label="Mod sistem"
              onClick={() => setTheme("system")}
              className={`rounded-full p-2 transition ${
                theme === "system"
                  ? "bg-[var(--chip-active)] text-[var(--fg)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              <Monitor size={16} />
            </button>
          </div>

          {showHome && (
            <Link
              href="/"
              aria-label="Pagina principală"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--fg)] transition hover:bg-[var(--surface-2)]"
            >
              <Home size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

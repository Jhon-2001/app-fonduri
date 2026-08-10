"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  href?: string;
  label?: string;
  className?: string;
};

export function BackButton({
  href = "/",
  label = "Înapoi",
  className = "mb-5",
}: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition hover:bg-[var(--surface-2)] ${className}`}
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

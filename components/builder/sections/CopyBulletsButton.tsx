"use client";

import { useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/toast";

/** Plain markdown list — easy to paste into ChatGPT, Claude, etc. */
export function formatBulletsForClipboard(bullets: string[]): string {
  return bullets
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `- ${b}`)
    .join("\n");
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  );
}

/** Shown once an entry has 2+ bullet rows so the user can paste them into
 * another AI. Only non-empty lines are copied. */
export function CopyBulletsButton({ bullets }: { bullets: string[] }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const filled = bullets.map((b) => b.trim()).filter(Boolean);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (bullets.length < 2) return null;

  async function handleCopy() {
    const text = formatBulletsForClipboard(bullets);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy bullets. Try selecting them manually.");
    }
  }

  const label = "Copy all points";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        disabled={filled.length === 0}
        aria-label={label}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors md:h-8 md:w-8 ${
          copied
            ? "text-emerald-600"
            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-ink-soft)]"
        }`}
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-ink)] px-2 py-1 text-[11px] font-medium text-[var(--color-paper)] opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

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
 * another AI. Only non-empty lines are copied. Sits beside the bullets label. */
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

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={filled.length === 0}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium transition-colors md:min-h-0 ${
        copied
          ? "text-emerald-600"
          : "text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      }`}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      Copy all points
    </button>
  );
}

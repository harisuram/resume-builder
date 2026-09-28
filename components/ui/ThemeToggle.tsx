"use client";

import { useSyncExternalStore } from "react";
import { resolvedTheme, toggleTheme } from "@/lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="theme-icon-sun h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.6M12 19.4V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.6M19.4 12H21M4.9 19.1 6 18M18 6l1.1-1.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="theme-icon-moon h-4 w-4" aria-hidden="true">
      <path d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6.2 6.2 0 0 0 20 14.5Z" />
    </svg>
  );
}

// Every toggle on the page stays in sync, and the stored theme is read on
// the client only (the server render always says light, as before).
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function flipTheme() {
  toggleTheme();
  for (const listener of listeners) listener();
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => resolvedTheme() === "dark",
    () => false,
  );

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      onClick={flipTheme}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-soft)] transition duration-200 ease-out hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}

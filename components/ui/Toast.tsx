"use client";

import { useToastStore } from "@/lib/toast";

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0 text-red-700"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <span
      className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)] text-[var(--color-surface)]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path className="toast-check" d="m3 6.2 2 2 4-4.4" />
      </svg>
    </span>
  );
}

/** Fixed top-center stack for failed actions (export, save, photo, AI) and
 * short confirmations (section reorder). Lives
 * outside any overflow pane so a toast can't be clipped by the form. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;

  return (
    <div
      className="no-print pointer-events-none fixed left-1/2 top-[calc(4.25rem+env(safe-area-inset-top))] z-[60] flex w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === "success" ? "status" : "alert"}
          className="toast-in pointer-events-auto flex w-full items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 shadow-card"
        >
          {toast.tone === "success" ? <SuccessIcon /> : <ErrorIcon />}
          <p className="flex-1 text-[13px] leading-snug text-[var(--color-ink)]">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}


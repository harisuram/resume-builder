"use client";

import { showToast, useToastStore } from "@/lib/toast";

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

/** Fixed top-right stack for failed actions (export, save, photo, AI). Lives
 * outside any overflow pane so a toast can't be clipped by the form. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;

  return (
    <div
      className="no-print pointer-events-none fixed right-4 top-[calc(4.25rem+env(safe-area-inset-top))] z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 shadow-lg"
        >
          <ErrorIcon />
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

/** Re-export so call sites can `import { showToast } from "@/components/ui/Toast"`. */
export { showToast };

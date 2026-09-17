"use client";

import { createPortal } from "react-dom";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
        <h2 className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="secondary" size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

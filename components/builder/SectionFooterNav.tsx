"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SectionFooterNav({
  canGoBack,
  canGoNext,
  nextEnabled,
  nextBlockedReason,
  canSkip,
  canClear,
  clearLabel,
  onBack,
  onNext,
  onSkip,
  onClear,
  onPreview,
}: {
  canGoBack: boolean;
  canGoNext: boolean;
  /** Whether the Next button is currently clickable — false while the step
   * is unresolved (unfilled and not skipped), in which case `Skip` is the
   * intended way past it. */
  nextEnabled: boolean;
  nextBlockedReason?: string;
  canSkip: boolean;
  /** False when the current step has nothing entered, so Clear would be a
   * no-op. The button still renders so the left cluster doesn't jump. */
  canClear: boolean;
  /** Section name used in the confirmation copy. */
  clearLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClear: () => void;
  /** Mobile-only: open the live preview over this step. Omitted on desktop
   * (the side pane is already there) and while the sheet is open. */
  onPreview?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!canGoBack && !canGoNext && !canSkip) return null;

  const helper = !nextEnabled && nextBlockedReason ? nextBlockedReason : undefined;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:static md:z-auto md:mt-8 md:bg-transparent md:px-0 md:py-0 md:pt-5 md:backdrop-blur-none">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
        <div className="flex items-center gap-2 max-md:w-full">
          {canGoBack && (
            <Button variant="secondary" onClick={onBack} className="max-md:min-h-11">
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={() => setConfirming(true)} disabled={!canClear} className="max-md:min-h-11">
            Clear
          </Button>
          {onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              aria-label="Preview resume"
              title="Preview resume"
              aria-haspopup="dialog"
              className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-cta transition duration-200 ease-out hover:brightness-110 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:hidden"
            >
              <EyeIcon />
            </button>
          ) : null}
        </div>
        {helper ? (
          <p className="min-w-0 text-[11.5px] leading-snug text-[var(--color-ink-faint)] md:hidden">{helper}</p>
        ) : null}
        <div className="flex items-center gap-2 max-md:w-full md:gap-3">
          {helper ? (
            <span className="hidden min-w-0 text-[11.5px] text-[var(--color-ink-faint)] md:inline">{helper}</span>
          ) : null}
          {canSkip && (
            <Button variant="ghost" onClick={onSkip} className="max-md:min-h-11 max-md:flex-1">
              Skip
            </Button>
          )}
          {canGoNext && (
            <Button variant="primary" onClick={onNext} disabled={!nextEnabled} className="max-md:min-h-11 max-md:flex-1">
              Next
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title={`Clear ${clearLabel}?`}
        description={`This removes everything you've entered in ${clearLabel}. This can't be undone.`}
        confirmLabel="Clear section"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          onClear();
          setConfirming(false);
        }}
      />
    </div>
  );
}

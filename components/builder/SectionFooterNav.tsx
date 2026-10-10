"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AnimatedDownloadIcon, AnimatedEyeIcon } from "./AnimatedIcons";

function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:hidden" aria-hidden="true">
      <path d="M5 6.5 12 12l-7 5.5Z" />
      <path d="M18.5 6.5v11" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:hidden" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** A light tap on phones that support it (Android Chrome); a no-op
 * elsewhere, including iOS Safari. */
function haptic() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  if (!window.matchMedia("(max-width: 767px)").matches) return;
  try {
    navigator.vibrate?.(8);
  } catch {
    // Some browsers throw when vibration is blocked by policy.
  }
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
  onDownload,
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
  /** Below md: jump to the download step. From md up the sidebar's
   * pinned Download item does this instead. */
  onDownload?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const prevRef = useRef({ label: clearLabel, enabled: nextEnabled });

  // Same step, Next just unlocked because the user filled it in (not by
  // arriving on an already-finished step, or by switching it off).
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { label: clearLabel, enabled: nextEnabled };
    if (prev.label === clearLabel && !prev.enabled && nextEnabled && canClear && canGoNext) {
      setCelebration((n) => n + 1);
    }
  }, [clearLabel, nextEnabled, canClear, canGoNext]);

  if (!canGoBack && !canGoNext && !canSkip) return null;

  const helper = !nextEnabled && nextBlockedReason ? nextBlockedReason : undefined;

  return (
    <div className="no-print mt-8 border-t border-[var(--color-border)] pt-5 md:flex md:flex-wrap md:items-center md:justify-between md:gap-2">
      {/* Back and Clear stay in the page flow, so on phones they sit at the
          end of the form; only Skip and Save & Next are pinned. */}
      <div className="flex items-center gap-2">
        {canGoBack && (
          <Button variant="secondary" onClick={onBack} className="max-md:min-h-11">
            Back
          </Button>
        )}
        <Button variant="ghost" onClick={() => setConfirming(true)} disabled={!canClear}
          className="max-md:min-h-11 max-md:border max-md:border-dashed max-md:border-[var(--color-border)] max-md:bg-[var(--color-surface)]/60 max-md:text-[var(--color-ink-soft)] max-md:disabled:opacity-60"
        >
          Clear
        </Button>
      </div>
      {/* Phones: a floating frosted-glass capsule (iOS tab bar style) with
          Preview riding just above it. From md up it
          flattens back into the inline footer row. */}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:pointer-events-auto md:static md:z-0 md:flex-row md:items-center md:gap-3 md:p-0">
        {onPreview || onDownload ? (
          <div className="flex items-end justify-end gap-2 px-1 lg:hidden">
            {onDownload ? (
              <button
                type="button"
                onClick={onDownload}
                aria-label="Preview and download your resume"
                className="pointer-events-auto flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-accent)] pl-1 pr-3 text-[13px] font-semibold text-[var(--color-accent-ink)] shadow-[0_8px_22px_-8px_var(--accent-glow),inset_0_1px_0_rgb(255_255_255_/_0.22)] transition duration-200 ease-out hover:brightness-110 active:scale-95 active:brightness-95 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent-ink)_20%,transparent)]">
                  <AnimatedDownloadIcon className="h-3.5 w-3.5" />
                </span>
                <span aria-hidden="true">Download</span>
              </button>
            ) : null}
            {onPreview ? (
              <button
                type="button"
                onClick={onPreview}
                aria-label="Preview resume"
                title="Preview resume"
                data-mtour="preview"
                aria-haspopup="dialog"
                className="pointer-events-auto flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--preview-from),var(--preview-to))] pl-1 pr-3 text-[13px] font-semibold text-[var(--preview-ink)] shadow-[0_8px_22px_-8px_var(--preview-glow),inset_0_1px_0_rgb(255_255_255_/_0.22)] ring-1 ring-[color-mix(in_srgb,var(--preview-ink)_16%,transparent)] transition duration-200 ease-out hover:brightness-110 active:scale-95 active:brightness-95 lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--preview-ink)_20%,transparent)]">
                  <AnimatedEyeIcon className="h-3.5 w-3.5" />
                </span>
                <span aria-hidden="true">Preview</span>
              </button>
            ) : null}
          </div>
        ) : null}
        <div data-mtour="capsule" className="pointer-events-auto relative flex items-center gap-1.5 max-md:w-full max-md:rounded-full max-md:border max-md:border-[var(--color-border)]/70 max-md:bg-[var(--color-surface)]/65 max-md:p-1.5 max-md:shadow-[0_10px_40px_-8px_rgb(0_0_0_/_0.28),inset_0_1px_0_color-mix(in_srgb,var(--color-surface)_60%,transparent)] max-md:backdrop-blur-2xl max-md:backdrop-saturate-[1.8] md:gap-3">
          {helper ? (
            <span className="hidden min-w-0 text-[11.5px] text-[var(--color-ink-faint)] md:inline">{helper}</span>
          ) : null}
          {canSkip && (
            <Button
              variant="ghost"
              onClick={() => {
                haptic();
                onSkip();
              }}
              className="max-md:min-h-11 max-md:flex-1 max-md:rounded-full max-md:text-[var(--color-ink-soft)] max-md:active:scale-95 max-md:active:bg-[var(--color-ink)]/5"
            >
              <SkipIcon />
              Skip
            </Button>
          )}
          {canGoNext && (
            <Button
              variant="primary"
              key={celebration > 0 ? `ready-${celebration}` : "next"}
              onClick={() => {
                haptic();
                onNext();
              }}
              disabled={!nextEnabled}
              className={`${celebration > 0 ? "capsule-ready " : ""}max-md:min-h-11 max-md:min-w-0 max-md:flex-[2] max-md:rounded-full max-md:px-3 max-md:active:scale-[0.97] whitespace-nowrap`}
            >
              Save &amp; Next
              <NextIcon />
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
}) {
  const [confirming, setConfirming] = useState(false);

  if (!canGoBack && !canGoNext && !canSkip) return null;

  return (
    <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-5">
      <div className="flex items-center gap-2">
        {canGoBack && (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        <Button variant="ghost" onClick={() => setConfirming(true)} disabled={!canClear}>
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {!nextEnabled && nextBlockedReason && (
          <span className="text-[11.5px] text-[var(--color-ink-faint)]">{nextBlockedReason}</span>
        )}
        {canSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        )}
        {canGoNext && (
          <Button variant="primary" onClick={onNext} disabled={!nextEnabled}>
            Next
          </Button>
        )}
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

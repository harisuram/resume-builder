"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { clearCoverLetter } from "@/lib/coverLetter";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { showToast } from "@/lib/toast";

function NewLetterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

/** The resume Navbar's twin. "Start new letter" clears only the letter —
 * the resume and its details stay. */
export function CoverLetterNavbar({ onReset }: { onReset: () => void }) {
  const resetStore = useCoverLetterStore((s) => s.resetStore);
  const setHasSavedCopy = useCoverLetterStore((s) => s.setHasSavedCopy);
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="no-print flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 shadow-card backdrop-blur-xl sm:px-6">
      <Logo />
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)} aria-label="Start new cover letter">
          <NewLetterIcon />
          <span className="hidden sm:inline" aria-hidden="true">
            Start new letter
          </span>
          <span className="sm:hidden" aria-hidden="true">
            New
          </span>
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Start a new cover letter?"
        description="This clears the letter saved on this device. Your resume and your details stay as they are. This can't be undone."
        confirmLabel="Clear and start over"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          try {
            clearCoverLetter();
          } catch {
            showToast("Couldn't clear the saved letter on this device.");
          }
          setHasSavedCopy(false);
          resetStore();
          setConfirming(false);
          onReset();
        }}
      />
    </header>
  );
}

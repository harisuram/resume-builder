"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { clearResumeData } from "@/lib/storage";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";

function NewResumeIcon() {
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
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M12 12.5v5" />
      <path d="M9.5 15h5" />
    </svg>
  );
}

export function Navbar() {
  const resetStore = useBuilderStore((s) => s.resetStore);
  const setHasSavedCopy = useBuilderStore((s) => s.setHasSavedCopy);
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="no-print flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 shadow-card backdrop-blur-xl sm:px-6">
      <Logo />
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)} aria-label="Start new resume">
          <NewResumeIcon />
          <span className="hidden sm:inline" aria-hidden="true">
            Start new resume
          </span>
          <span className="sm:hidden" aria-hidden="true">
            New
          </span>
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Start a new resume?"
        description="This clears the copy saved on this device and resets everything you've entered. This can't be undone."
        confirmLabel="Clear and start over"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          try {
            clearResumeData();
          } catch {
            showToast("Couldn't clear the saved copy on this device.");
          }
          setHasSavedCopy(false);
          resetStore();
          setConfirming(false);
        }}
      />
    </header>
  );
}

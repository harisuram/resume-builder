"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { importResumeFromFile, ResumeFileError, type ImportProgress } from "@/lib/resumeImport/fromFile";
import { ACCEPT_RESUME_FILES } from "@/lib/resumeImport/extractText";
import { resolvedHeadingLabel } from "@/lib/resumeImport/synonyms";
import type { ImportedResume } from "@/lib/resumeImport/normalize";
import { hasAnyResumeValue, useBuilderStore } from "@/lib/store";
import { saveResumeData } from "@/lib/storage";
import { showToast } from "@/lib/toast";

const PROGRESS_COPY: Record<ImportProgress, string> = {
  reading: "Opening the file",
  extracting: "Reading the text",
  parsing: "Matching sections",
  filling: "Filling your resume",
};

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3.5v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6M9 16.5h4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M5 12.5 9.5 17 19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ResumeImportProvider({
  children,
  onImported,
  onReviewSection,
}: {
  children?: ReactNode;
  onImported?: () => void;
  onReviewSection?: (key: ImportedResume["filled"][number]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const pendingFile = useRef<File | null>(null);
  const applyImportedResume = useBuilderStore((s) => s.applyImportedResume);
  const hasSavedCopy = useBuilderStore((s) => s.hasSavedCopy);
  const getResumeData = useBuilderStore((s) => s.getResumeData);

  const [dragging, setDragging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportedResume | null>(null);

  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;
  const onReviewSectionRef = useRef(onReviewSection);
  onReviewSectionRef.current = onReviewSection;

  const runImport = useCallback(
    async (file: File) => {
      setConfirming(false);
      setResult(null);
      setFileName(file.name);
      setProgress("reading");
      try {
        const imported = await importResumeFromFile(file, setProgress);
        applyImportedResume(imported);
        if (hasSavedCopy) {
          try {
            saveResumeData(useBuilderStore.getState().getResumeData());
          } catch {
            showToast("Imported, but couldn't update the copy saved on this device.");
          }
        }
        setResult(imported);
        onImportedRef.current?.();
      } catch (err) {
        const message =
          err instanceof ResumeFileError || err instanceof Error
            ? err.message
            : "Couldn't import that resume. Try another file.";
        showToast(message);
      } finally {
        setProgress(null);
        pendingFile.current = null;
      }
    },
    [applyImportedResume, hasSavedCopy],
  );

  const queueFile = useCallback(
    (file: File) => {
      if (progress) return;
      if (hasAnyResumeValue(getResumeData())) {
        pendingFile.current = file;
        setConfirming(true);
        return;
      }
      void runImport(file);
    },
    [getResumeData, progress, runImport],
  );

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    function hasFiles(event: DragEvent) {
      return event.dataTransfer?.types.includes("Files") ?? false;
    }
    function onEnter(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    }
    function onOver(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }
    function onLeave(event: DragEvent) {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    }
    function onDrop(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) queueFile(file);
    }
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [queueFile]);

  return (
    <>
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_RESUME_FILES}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) queueFile(file);
          event.target.value = "";
        }}
      />
      <ConfirmDialog
        open={confirming}
        title="Replace the current draft with this file?"
        description="We'll fill every section we can read from the resume. Empty sections will be skipped — you can turn them back on in the list."
        confirmLabel="Replace and import"
        cancelLabel="Keep what I have"
        confirmVariant="primary"
        onConfirm={() => {
          const file = pendingFile.current;
          if (file) void runImport(file);
          else setConfirming(false);
        }}
        onCancel={() => {
          pendingFile.current = null;
          setConfirming(false);
        }}
      />
      {dragging && !progress && typeof document !== "undefined"
        ? createPortal(
            <div
              className="no-print fixed inset-0 z-[65] flex items-end justify-center bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] p-4 backdrop-blur-[3px] sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Drop resume to import"
            >
              <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-surface)] px-5 py-8 text-center shadow-card">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
                  <DocumentIcon className="h-6 w-6" />
                </span>
                <p className="mt-4 font-display text-[18px] font-semibold tracking-tight text-[var(--color-ink)]">
                  Drop to fill this resume
                </p>
                <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
                  PDF, Word, or text — headings like Work History or Technical Skills are mapped automatically.
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
      {progress && typeof document !== "undefined"
        ? createPortal(
            <div
              className="no-print fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
              role="status"
              aria-live="polite"
              aria-label={PROGRESS_COPY[progress]}
            >
              <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
                  <div className="min-w-0">
                    <p className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                      {PROGRESS_COPY[progress]}
                    </p>
                    {fileName ? (
                      <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-soft)]">{fileName}</p>
                    ) : null}
                  </div>
                </div>
                <ol className="mt-4 space-y-1.5 text-[12.5px] text-[var(--color-ink-soft)]">
                  {(["extracting", "parsing", "filling"] as ImportProgress[]).map((step) => {
                    const order: ImportProgress[] = ["reading", "extracting", "parsing", "filling"];
                    const current = order.indexOf(progress);
                    const here = order.indexOf(step);
                    const done = here < current;
                    const active = step === progress;
                    return (
                      <li key={step} className={active ? "font-medium text-[var(--color-ink)]" : ""}>
                        {done ? "Done · " : active ? "Now · " : ""}
                        {PROGRESS_COPY[step]}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>,
            document.body,
          )
        : null}
      {result && !progress && typeof document !== "undefined"
        ? createPortal(
            <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[66] px-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-md">
              <div className="pointer-events-auto">
                <ResumeImportResult
                  result={result}
                  fileName={fileName}
                  onDismiss={() => setResult(null)}
                  onAgain={openPicker}
                  onReview={(key) => onReviewSectionRef.current?.(key)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function ResumeImportResult({
  result,
  fileName,
  onDismiss,
  onAgain,
  onReview,
}: {
  result: ImportedResume;
  fileName: string | null;
  onDismiss: () => void;
  onAgain: () => void;
  onReview?: (key: ImportedResume["filled"][number]) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-card sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
          <CheckIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
            Filled {result.filled.length} {result.filled.length === 1 ? "section" : "sections"}
            {fileName ? ` from ${fileName}` : ""}
          </p>
          <p className="mt-1 text-[12.5px] text-[var(--color-ink-soft)]">
            Empty sections were skipped — turn them back on in the list if you need them. Tap a section to review it.
          </p>
          {result.filled.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {result.filled.map((key) => {
                const label = resolvedHeadingLabel(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => onReview?.(key)}
                      className="min-h-8 rounded-full bg-[var(--color-accent-tint)] px-3 py-1 text-[11.5px] font-medium text-[var(--color-accent)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onAgain}>
              Import another
            </Button>
            <Button type="button" variant="ghost" size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

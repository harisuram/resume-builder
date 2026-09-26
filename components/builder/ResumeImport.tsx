"use client";

import {
  createContext,
  useCallback,
  useContext,
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
import { persistCurrentResume } from "@/lib/persistResume";
import { hasAnyResumeValue, useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";

/** Lets any control inside the builder open the file picker. */
interface ResumeImportApi {
  openPicker: () => void;
  busy: boolean;
}

const ResumeImportContext = createContext<ResumeImportApi | null>(null);

export function useResumeImport(): ResumeImportApi | null {
  return useContext(ResumeImportContext);
}

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
  prompt = false,
  onPromptClose,
  initialFile = null,
}: {
  children?: ReactNode;
  onImported?: () => void;
  onReviewSection?: (key: ImportedResume["filled"][number]) => void;
  /** Ask straight away whether to start from a file (from the home page's
   * "Import my resume"). The picker still opens only on a click: browsers
   * don't allow it without one. */
  prompt?: boolean;
  onPromptClose?: () => void;
  /** A file already chosen (on the home page) — imported as soon as the
   * builder is up, with the usual replace-draft check. */
  initialFile?: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const pendingFile = useRef<File | null>(null);
  const applyImportedResume = useBuilderStore((s) => s.applyImportedResume);
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
        persistCurrentResume("Imported, but couldn't update the copy saved on this device.");
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
    [applyImportedResume],
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

  const handledInitial = useRef<File | null>(null);
  useEffect(() => {
    if (!initialFile || handledInitial.current === initialFile) return;
    handledInitial.current = initialFile;
    queueFile(initialFile);
  }, [initialFile, queueFile]);

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

  const api: ResumeImportApi = { openPicker, busy: Boolean(progress) };

  return (
    <ResumeImportContext.Provider value={api}>
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
        open={prompt && !confirming && !progress}
        title="Start from your own resume"
        description="Choose a PDF, Word (.docx), or text file. We'll fill in every section we can read, even when your headings say things like Work History or Career Objective. You can also drop the file anywhere on this page."
        confirmLabel="Choose a file"
        cancelLabel="Start from scratch"
        confirmVariant="primary"
        onConfirm={() => {
          openPicker();
          onPromptClose?.();
        }}
        onCancel={() => onPromptClose?.()}
      />
      <ConfirmDialog
        open={confirming}
        title="Replace the current draft with this file?"
        description="We'll fill every section we can read from the resume. Sections the file doesn't have stay on, empty and ready to fill in."
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
    </ResumeImportContext.Provider>
  );
}

/** How long the import summary stays up before it closes itself. */
export const IMPORT_RESULT_MS = 10_000;

/** Counts down `ms`, pausing while `paused` — hover or keyboard focus on the
 * card, so nobody loses it mid-read. Returns the fraction left (1 → 0). */
function useAutoDismiss(ms: number, paused: boolean, onDone: () => void): number {
  const [left, setLeft] = useState(ms);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const from = left;
    const tick = window.setInterval(() => {
      const next = Math.max(0, from - (Date.now() - started));
      setLeft(next);
      if (next === 0) {
        window.clearInterval(tick);
        onDoneRef.current();
      }
    }, 100);
    return () => window.clearInterval(tick);
    // `left` is read only as the starting point when the timer (re)starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, ms]);
  return left / ms;
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
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const left = useAutoDismiss(IMPORT_RESULT_MS, hovered || focused, onDismiss);
  const seconds = Math.ceil(left * (IMPORT_RESULT_MS / 1000));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Resume imported"
      data-import-result
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className="import-result-card relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/35 bg-[var(--color-surface)] shadow-[0_24px_60px_-18px_color-mix(in_srgb,var(--color-ink)_45%,transparent),0_2px_6px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] ring-1 ring-[var(--color-ink)]/5"
    >
      <div className="h-1 w-full bg-[var(--color-accent-tint)]" aria-hidden="true">
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-100 ease-linear"
          style={{ width: `${left * 100}%` }}
          data-import-result-timer
        />
      </div>
      <div className="flex items-start gap-3 px-4 pb-4 pt-3.5 sm:px-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-cta">
          <CheckIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-[15.5px] font-semibold leading-snug tracking-tight text-[var(--color-ink)]">
              Filled {result.filled.length} {result.filled.length === 1 ? "section" : "sections"}
              {fileName ? (
                <span className="block truncate text-[12.5px] font-medium text-[var(--color-ink-soft)]">from {fileName}</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close import summary"
              className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-faint)] transition hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--color-ink-soft)]">
            Tap a section to check it. Sections the file didn’t have are still on, empty and ready to fill in.
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
                      className="min-h-8 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-tint)] px-3 py-1 text-[12px] font-semibold text-[var(--color-accent)] transition hover:border-[var(--color-accent)]/60 hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-3.5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onAgain}>
              Import another
            </Button>
            <p className="text-center text-[11px] text-[var(--color-ink-faint)] sm:text-right" aria-hidden="true">
              {hovered || focused ? "Paused" : `Closes in ${seconds}s`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Header control: opens the file picker. The same import also runs when a
 * file is dropped anywhere on the builder. */
export function ImportResumeButton() {
  const api = useResumeImport();
  if (!api) return null;
  return (
    // The accent fill sets it apart from the plain "Start new resume" beside
    // it: starting from an existing resume is the quickest way in.
    <Button
      variant="primary"
      size="sm"
      onClick={api.openPicker}
      disabled={api.busy}
      aria-label="Import resume"
      title="Fill the builder from a PDF, Word or text resume"
      data-tour="resume-import"
    >
      <DocumentIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline" aria-hidden="true">
        Import resume
      </span>
      <span className="sm:hidden" aria-hidden="true">
        Import
      </span>
    </Button>
  );
}

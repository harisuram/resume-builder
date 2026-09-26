"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ACCEPT_RESUME_FILES, validateResumeFile } from "@/lib/resumeImport/extractText";
import { setPendingImport } from "@/lib/resumeImport/pendingImport";

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M12 17v-6m0 0-2.5 2.5M12 11l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Already have a resume?" — the whole card opens the file picker (or takes
 * a dropped file); once a file is chosen the builder opens and imports it. */
export function HomeImportCallout() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [opening, setOpening] = useState(false);

  function take(file: File | undefined) {
    if (!file) return;
    try {
      validateResumeFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Use a PDF, Word (.docx), or text file.");
      return;
    }
    setError(null);
    setOpening(true);
    setPendingImport(file);
    router.push("/builder?import=1");
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    take(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="animate-fade-up-delay mt-6 w-full min-w-0 max-w-xl">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={opening}
        aria-describedby={error ? "home-import-error" : undefined}
        className={`group flex w-full min-w-0 cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-5 py-4 text-left transition duration-200 ease-out hover:-translate-y-px hover:border-[var(--color-accent)]/70 hover:bg-[var(--color-accent-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:cursor-progress sm:flex-row sm:gap-4 ${
          dragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)]"
            : "border-[var(--color-accent)]/45 bg-[var(--color-accent-tint)]/60"
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-accent)] shadow-card">
          <UploadIcon />
        </span>
        <span className="min-w-0 flex-1 text-center sm:text-left">
          <span className="block text-[14px] font-semibold text-[var(--color-ink)]">Already have a resume?</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-ink-soft)]">
            {dragging ? "Drop it here to start." : "Upload your PDF or Word file."}
          </span>
        </span>
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent)] shadow-card ring-1 ring-[var(--color-accent)]/30 transition group-hover:ring-[var(--color-accent)]/60"
          aria-hidden="true"
        >
          {opening ? "Opening…" : "Import my resume"}
        </span>
        <span className="sr-only">Import my resume</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_RESUME_FILES}
        className="hidden"
        data-testid="home-import-input"
        onChange={(event) => {
          take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error ? (
        <p id="home-import-error" role="alert" className="mt-2 text-center text-[12.5px] font-medium text-[var(--color-undo)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

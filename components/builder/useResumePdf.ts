"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LetterContent } from "@/lib/coverLetter";
import type { ResumeData } from "@/lib/types";

/** `templateId` is the template `blob` was rendered with, so a preview can
 * tell when the pages it has are for a template the user has since left. */
export type ResumePdfState =
  | { status: "idle" | "rendering"; blob: Blob | null; templateId: string | null; error: null }
  | { status: "ready"; blob: Blob; templateId: string; error: null }
  | { status: "error"; blob: Blob | null; templateId: string | null; error: Error };

/** Quiet period after the last edit before re-rendering — a keystroke-by-
 * keystroke render would re-lay the whole document on every letter. */
export const PDF_RENDER_DEBOUNCE_MS = 350;

/** What one render draws: the resume, or a cover letter in its template. */
interface PdfInput {
  data: ResumeData;
  letter?: LetterContent;
}

async function render({ data, letter }: PdfInput): Promise<Blob> {
  // Loaded on demand (next/dist/docs: lazy-loading → external libraries), so
  // react-pdf and its layout engine never ship in the builder's first load.
  const { renderResumePdfOffThread } = await import("@/components/pdf/renderInWorker");
  return renderResumePdfOffThread(data, letter);
}

/** Keeps a PDF of `data` rendered in the background. `latestBlob()` resolves
 * to the PDF of the data as it is right now — the download uses it, so the
 * saved file is always the same bytes as a preview of the current edits.
 * With `letter` (memoized by the caller) it renders that cover letter in the
 * resume's template instead. */
export function useResumePdf(
  data: ResumeData,
  enabled: boolean,
  debounceMs = PDF_RENDER_DEBOUNCE_MS,
  letter?: LetterContent,
) {
  const input = useMemo<PdfInput>(() => ({ data, letter }), [data, letter]);
  const [state, setState] = useState<ResumePdfState>({ status: "idle", blob: null, templateId: null, error: null });
  // Each render is tagged with the data it was made from. Only the newest
  // one may publish, so a slow render finishing after a faster, newer one
  // can't overwrite the preview with stale content.
  const latest = useRef<{ input: PdfInput; promise: Promise<Blob> } | null>(null);

  const start = useCallback((next: PdfInput) => {
    const promise = render(next);
    latest.current = { input: next, promise };
    setState((prev) => ({ status: "rendering", blob: prev.blob, templateId: prev.templateId, error: null }));
    promise.then(
      (blob) => {
        if (latest.current?.promise === promise) {
          setState({ status: "ready", blob, templateId: next.data.templateId, error: null });
        }
      },
      (error: unknown) => {
        // Surfaced for debugging; the UI shows a generic failure message.
        console.error("Resume PDF render failed", error);
        if (latest.current?.promise === promise) {
          setState((prev) => ({
            status: "error",
            blob: prev.blob,
            templateId: prev.templateId,
            error: error instanceof Error ? error : new Error(String(error)),
          }));
        }
      },
    );
    return promise;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // The quiet period is for typing. A template switch is one deliberate
    // click — render it straight away rather than add to the wait.
    const previous = latest.current?.input.data;
    const immediate = !previous || previous.templateId !== input.data.templateId;
    const timer = window.setTimeout(() => {
      // A download may already have started this exact render (latestBlob).
      if (latest.current?.input !== input) start(input);
    }, immediate ? 0 : debounceMs);
    return () => window.clearTimeout(timer);
  }, [input, enabled, start, debounceMs]);

  const latestBlob = useCallback((): Promise<Blob> => {
    if (latest.current?.input === input) return latest.current.promise;
    return start(input);
  }, [input, start]);

  return { ...state, latestBlob };
}

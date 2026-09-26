"use client";

import { useEffect, useRef, useState } from "react";
import { TemplateSkeleton } from "@/components/site/TemplateSkeleton";
import { getTheme } from "@/components/templates/shared/theme";
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from "@/lib/page";
import type { SectionKey } from "@/lib/types";
import type { ResumePdfState } from "./useResumePdf";

type PdfJs = typeof import("pdfjs-dist");

async function loadPdfJs(): Promise<PdfJs> {
  const pdfjs = await import("pdfjs-dist");
  // Same worker the resume import already uses (scripts/copy-pdf-worker.mjs
  // copies it from the installed pdfjs-dist, so the versions always match).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

/** A placeholder sheet in the layout of `templateId`, scaled to the pane —
 * shown while that template's first PDF is still rendering. */
function SkeletonSheet({
  templateId,
  sections,
  additionalTitle,
  width,
}: {
  templateId: string;
  sections?: SectionKey[];
  additionalTitle?: string;
  width: number;
}) {
  const scale = width > 0 ? width / PAGE_WIDTH_PX : 0;
  return (
    <div
      data-pdf-skeleton={templateId}
      aria-hidden="true"
      className="relative overflow-hidden rounded-sm bg-white shadow-card"
      style={{ height: PAGE_HEIGHT_PX * scale }}
    >
      <div className="origin-top-left" style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})` }}>
        <TemplateSkeleton
          theme={getTheme(templateId)}
          sections={sections}
          additionalTitle={additionalTitle}
          framed={false}
          animate
          fullPage
        />
      </div>
    </div>
  );
}

/** Draws the rendered PDF itself — not an HTML approximation of it — one
 * canvas per page. Whatever page breaks appear here are the ones in the file
 * the download button saves.
 *
 * Pass `templateId` (the template the user has picked) and, until a PDF of
 * that template is on screen, a skeleton of its layout stands in: switching
 * templates takes a moment to render, and the old template's pages would
 * otherwise sit there looking like the new choice didn't take. Edits within a
 * template keep the current pages up with "Updating…" instead. */
export function PdfEnginePreview({
  pdf,
  templateId,
  sections,
  additionalTitle,
}: {
  pdf: ResumePdfState;
  templateId?: string;
  /** Sections for the skeleton to sketch — the resume's own. */
  sections?: SectionKey[];
  additionalTitle?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  // Which blob the canvases currently show — the status only reports a page
  // count once that blob's pages are actually on screen.
  const [drawn, setDrawn] = useState<{ blob: Blob; pages: number; templateId: string | null } | null>(null);
  const [width, setWidth] = useState(0);
  const [drawError, setDrawError] = useState(false);

  useEffect(() => {
    // Measured on the always-visible frame: the page host is hidden while a
    // skeleton stands in, and a hidden box measures zero.
    const host = frameRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      // Whole pixels only: sub-pixel jitter would otherwise redraw every page.
      setWidth((prev) => {
        const next = Math.floor(entry.contentRect.width);
        return next === prev ? prev : next;
      });
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!pdf.blob || !host || width <= 0) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    let src: string | undefined;

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const bytes = new Uint8Array(await pdf.blob!.arrayBuffer());
        const task = pdfjs.getDocument({ data: bytes, isEvalSupported: false });
        destroy = () => void task.destroy();
        const doc = await task.promise;
        const ratio = window.devicePixelRatio || 1;
        const canvases: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.setAttribute("data-pdf-page", String(n));
          canvas.setAttribute("aria-label", `Page ${n} of ${doc.numPages}`);
          canvas.setAttribute("role", "img");
          canvas.className = "block rounded-sm bg-white shadow-card";
          const canvasContext = canvas.getContext("2d");
          if (!canvasContext) throw new Error("Canvas unavailable");
          await page.render({ canvasContext, viewport }).promise;
          if (cancelled) return;
          canvases.push(canvas);
        }
        if (cancelled) return;
        // Swap all pages in at once so the preview never shows half old and
        // half new pages while a render is in flight.
        host.replaceChildren(...canvases);
        // The file these pages were drawn from, so tests (and anyone
        // debugging) can read the exact PDF behind the preview.
        if (typeof URL.createObjectURL === "function") {
          src = URL.createObjectURL(pdf.blob!);
          host.setAttribute("data-pdf-src", src);
        }
        setDrawn({ blob: pdf.blob!, pages: doc.numPages, templateId: pdf.templateId });
        setDrawError(false);
      } catch {
        if (!cancelled) setDrawError(true);
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
      if (src) URL.revokeObjectURL(src);
    };
  }, [pdf.blob, pdf.templateId, width]);

  const current = drawn !== null && drawn.blob === pdf.blob && pdf.status === "ready";
  const failed = pdf.status === "error" || drawError;
  // Nothing on screen yet, or what's there is a template the user has left.
  const skeleton = templateId !== undefined && !failed && (drawn === null || drawn.templateId !== templateId);
  const status = failed
    ? "Couldn't build the PDF preview."
    : skeleton
      ? `Loading ${getTheme(templateId!).name}…`
      : current
        ? `${drawn.pages} ${drawn.pages === 1 ? "page" : "pages"}`
        : drawn
          ? "Updating…"
          : "Building PDF…";

  return (
    <div ref={frameRef} className="flex flex-col gap-3" data-testid="pdf-engine-preview">
      <p className="no-print text-[11.5px] text-[var(--color-ink-faint)]" role="status" aria-live="polite">
        {status}
      </p>
      {skeleton && (
        <SkeletonSheet templateId={templateId!} sections={sections} additionalTitle={additionalTitle} width={width} />
      )}
      <div ref={hostRef} className="flex flex-col gap-4" hidden={skeleton} aria-busy={!current} />
    </div>
  );
}

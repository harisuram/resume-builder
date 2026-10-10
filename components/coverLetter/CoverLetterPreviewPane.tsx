"use client";

import { useState } from "react";
import { getTheme } from "@/components/templates/shared/theme";
import { PdfEnginePreview } from "@/components/builder/PdfEnginePreview";
import { LIVE_PDF_DEBOUNCE_MS } from "@/components/builder/PreviewPane";
import { TemplatePicker } from "@/components/builder/TemplatePicker";
import type { ResumePdfState } from "@/components/builder/useResumePdf";
import { setLetterTemplate, useLetterPdf, useLetterTemplate } from "./useLetterPdf";

/** A letter's skeleton: the template's header over one block of text. */
const LETTER_SKELETON = ["summary"] as const;

/** "Matches your resume" or, once the letter has its own look, a one-click
 * way back to the resume's template. */
export function TemplateMatchNote() {
  const { matchesResume, resumeTemplateId } = useLetterTemplate();
  if (matchesResume) {
    return (
      <p className="text-[11.5px] leading-snug text-[var(--color-ink-faint)]">
        Matches your resume&rsquo;s template. Pick another to give the letter its own look.
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] leading-snug text-[var(--color-ink-faint)]">
      <span>Different from your resume.</span>
      <button
        type="button"
        onClick={() => setLetterTemplate(resumeTemplateId)}
        className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
      >
        Match my resume ({getTheme(resumeTemplateId).name})
      </button>
    </p>
  );
}

/** The cover letter's twin of PreviewPane: the same live-preview chrome and
 * template dropdown, drawing the letter PDF the download saves. */
export function CoverLetterPreviewPane({
  printable = false,
  pickerMobileOnly = false,
  pdf: sharedPdf,
}: {
  printable?: boolean;
  /** Hide the dropdown from md up — the download step has the thumbnail rail. */
  pickerMobileOnly?: boolean;
  pdf?: ResumePdfState;
}) {
  const { templateId } = useLetterTemplate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const ownPdf = useLetterPdf(!sharedPdf, LIVE_PDF_DEBOUNCE_MS);
  const pdf = sharedPdf ?? ownPdf;
  const nestedScroll = !printable;

  return (
    <div className={`print-unclip flex flex-col gap-4 ${nestedScroll ? "h-full min-h-0" : ""}`}>
      <div className="no-print flex shrink-0 flex-col gap-2 border-b border-[var(--color-border)] pb-3">
        <div className="hidden min-w-0 items-center justify-between gap-3 md:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)] py-1 pl-2.5 pr-3 shadow-sm">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Live preview
            </span>
          </span>
          <span className="truncate text-[11px] text-[var(--color-ink-faint)]">Updates as you type</span>
        </div>
        <div className={pickerMobileOnly ? "md:hidden" : undefined}>
          <TemplatePicker value={templateId} onChange={setLetterTemplate} open={pickerOpen} onOpenChange={setPickerOpen} />
        </div>
        <TemplateMatchNote />
      </div>

      <div
        className={`print-unclip pb-4 ${nestedScroll ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" : ""}`}
      >
        <PdfEnginePreview pdf={pdf} templateId={templateId} sections={[...LETTER_SKELETON]} />
      </div>
    </div>
  );
}

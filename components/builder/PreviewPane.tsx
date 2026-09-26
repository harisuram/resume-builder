"use client";

import { useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { getTheme } from "@/components/templates/shared/theme";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { getRenderableSections, hasAddedSection, hasSummary } from "@/lib/resume";
import { useBuilderStore, useResumeData } from "@/lib/store";
import { EmptyResumePreview } from "./EmptyResumePreview";
import { PdfEnginePreview } from "./PdfEnginePreview";
import { TemplatePicker } from "./TemplatePicker";
import { useResumePdf, type ResumePdfState } from "./useResumePdf";

/** Quiet period before the live preview re-renders its PDF. Longer than the
 * export step's: react-pdf lays the document out on the main thread, so a
 * render that starts mid-sentence would stall the next keystrokes. */
// Layout runs in a Web Worker, so a render no longer freezes typing and the
// preview can follow edits sooner.
export const LIVE_PDF_DEBOUNCE_MS = 350;

export function PreviewPane({
  printable = false,
  showAd,
  pickerMobileOnly = false,
  pdf: sharedPdf,
}: {
  printable?: boolean;
  /** Defaults to on for the live column, off for print/export. The mobile
   * sheet also turns this off so the résumé can use the full height. */
  showAd?: boolean;
  /** Hide the dropdown from md up — the export step shows a thumbnail rail
   * beside the preview there instead. */
  pickerMobileOnly?: boolean;
  /** A PDF render the caller already keeps (the export step, whose download
   * saves that same render). Without one the pane renders its own. */
  pdf?: ResumePdfState;
}) {
  const templateId = useBuilderStore((s) => s.templateId);
  const setTemplateId = useBuilderStore((s) => s.setTemplateId);
  const data = useResumeData();
  const theme = getTheme(templateId);
  const empty = !hasAddedSection(data);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The preview is the PDF the download saves, for every template — an HTML
  // approximation drew page lines the real file didn't always keep.
  const ownPdf = useResumePdf(data, !sharedPdf && !empty, LIVE_PDF_DEBOUNCE_MS);
  const pdf = sharedPdf ?? ownPdf;
  // The side-by-side builder column is height-capped, so the resume has to
  // scroll inside this pane. The export step is the opposite: the whole
  // page (controls + preview) is one scroller, and a nested `h-full` /
  // overflow-y-auto here trapped the wheel over the resume.
  const nestedScroll = !printable;
  const renderAd = showAd ?? !printable;

  return (
    <div className={`print-unclip flex flex-col gap-4 ${nestedScroll ? "h-full min-h-0" : ""}`}>
      <div className="no-print flex shrink-0 flex-col gap-2 border-b border-[var(--color-border)] pb-3">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex min-w-0 items-center justify-between gap-3">
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
            <TemplatePicker
              value={templateId}
              onChange={setTemplateId}
              emphasized={empty}
              open={pickerOpen}
              onOpenChange={setPickerOpen}
            />
          </div>
        </div>
        {empty && (
          <p className="text-[11px] leading-snug text-[var(--color-ink-soft)]">
            This is a sample of <span className="font-medium text-[var(--color-ink)]">{theme.name}</span>. Use{" "}
            {pickerMobileOnly ? (
              <>
                <span className="md:hidden">
                  <span className="font-medium text-[var(--color-accent)]">Change template</span> to try
                </span>
                <span className="hidden md:inline">the templates on the right to try</span>
              </>
            ) : (
              <>
                <span className="font-medium text-[var(--color-accent)]">Change template</span> to try
              </>
            )}{" "}
            another look before you add entries.
          </p>
        )}
      </div>

      <div
        data-tour="page-separator"
        className={`print-unclip pb-4 ${nestedScroll ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" : ""}`}
      >
        {empty && (
          <div className="no-print">
            <EmptyResumePreview data={data} onChangeTemplate={() => setPickerOpen(true)} />
          </div>
        )}
        {!empty && (
          <PdfEnginePreview
            pdf={pdf}
            templateId={templateId}
            sections={[...(hasSummary(data) ? (["summary"] as const) : []), ...getRenderableSections(data)]}
            additionalTitle={data.sections.additional?.heading}
          />
        )}
        {/* Never on the export/print step — kept well clear of the Download
            button so there's nothing here to accidentally click through to. */}
        {renderAd && (
          <AdSlot
            slot={ADSENSE_SLOTS.builderPreview}
            name="Builder preview"
            className="mt-6 flex flex-col items-center gap-1"
          />
        )}
      </div>
    </div>
  );
}

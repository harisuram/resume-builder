"use client";

import { useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { getTheme } from "@/components/templates/shared/theme";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { hasAddedSection } from "@/lib/resume";
import { useBuilderStore, useResumeData } from "@/lib/store";
import { EmptyResumePreview } from "./EmptyResumePreview";
import { TemplatePicker } from "./TemplatePicker";
import { ResumePreviewFrame } from "./ResumePreviewFrame";

export function PreviewPane({
  printable = false,
  showAd,
}: {
  printable?: boolean;
  /** Defaults to on for the live column, off for print/export. The mobile
   * sheet also turns this off so the résumé can use the full height. */
  showAd?: boolean;
}) {
  const templateId = useBuilderStore((s) => s.templateId);
  const setTemplateId = useBuilderStore((s) => s.setTemplateId);
  const data = useResumeData();
  const theme = getTheme(templateId);
  const empty = !hasAddedSection(data);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The side-by-side builder column is height-capped, so the resume has to
  // scroll inside this pane. The export step is the opposite: the whole
  // page (controls + preview) is one scroller, and a nested `h-full` /
  // overflow-y-auto here trapped the wheel over the resume.
  const nestedScroll = !printable;
  const renderAd = showAd ?? !printable;

  return (
    <div className={`print-unclip flex flex-col gap-4 ${nestedScroll ? "h-full min-h-0" : ""}`}>
      <div className="no-print flex shrink-0 flex-col gap-2 border-b border-[var(--color-border)] pb-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[var(--color-ink)]">{theme.name}</p>
            <p className="truncate text-[11px] leading-tight text-[var(--color-ink-faint)]">{theme.description}</p>
          </div>
          <TemplatePicker
            value={templateId}
            onChange={setTemplateId}
            emphasized={empty}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
          />
        </div>
        {empty && (
          <p className="text-[11px] leading-snug text-[var(--color-ink-soft)]">
            This is a sample of <span className="font-medium text-[var(--color-ink)]">{theme.name}</span>. Use{" "}
            <span className="font-medium text-[var(--color-accent)]">Change template</span> to try another look
            before you add entries.
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
        {(!empty || printable) && (
          <div className={empty ? "h-0 overflow-hidden print-unclip" : undefined} aria-hidden={empty || undefined}>
            <ResumePreviewFrame data={data} printable={printable} />          </div>
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

"use client";

import { AdSlot } from "@/components/ads/AdSlot";
import { getTheme } from "@/components/templates/shared/theme";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { useBuilderStore, useResumeData } from "@/lib/store";
import { TemplatePicker } from "./TemplatePicker";
import { ResumePreviewFrame } from "./ResumePreviewFrame";

export function PreviewPane({ printable = false }: { printable?: boolean }) {
  const templateId = useBuilderStore((s) => s.templateId);
  const setTemplateId = useBuilderStore((s) => s.setTemplateId);
  const toggleSectionPageBreak = useBuilderStore((s) => s.toggleSectionPageBreak);
  const toggleItemPageBreak = useBuilderStore((s) => s.toggleItemPageBreak);
  const data = useResumeData();
  const theme = getTheme(templateId);
  // The side-by-side builder column is height-capped, so the resume has to
  // scroll inside this pane. The export step is the opposite: the whole
  // page (controls + preview) is one scroller, and a nested `h-full` /
  // overflow-y-auto here trapped the wheel over the resume.
  const nestedScroll = !printable;

  return (
    <div className={`print-unclip flex flex-col gap-4 ${nestedScroll ? "h-full min-h-0" : ""}`}>
      <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full transition-colors duration-150"
            style={{ background: theme.accent }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[var(--color-ink)]">{theme.name}</p>
            <p className="truncate text-[11px] leading-tight text-[var(--color-ink-faint)]">{theme.description}</p>
          </div>
        </div>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
      </div>

      <div
        className={`print-unclip pb-4 ${nestedScroll ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" : ""}`}
      >
        <ResumePreviewFrame
          data={data}
          printable={printable}
          onToggleSectionBreak={toggleSectionPageBreak}
          onToggleItemBreak={toggleItemPageBreak}
        />
        {/* Never on the export/print step — kept well clear of the Download
            button so there's nothing here to accidentally click through to. */}
        {!printable && (
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

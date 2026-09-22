"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getTemplateComponent } from "@/components/templates/registry";
import { isMultiColumnTemplate, type TemplateTheme } from "@/components/templates/shared/theme";
import { PAGE_WIDTH_PX } from "@/lib/page";
import { PRINT_LAYOUT_SIM_CLASS } from "@/lib/pagination/printLayout";
import { sampleResumeForTemplate } from "@/lib/sampleResume";

/** Layout width the sample resume is drawn at before it is scaled down. */
export const PREVIEW_PAPER_WIDTH = PAGE_WIDTH_PX;

export function ScaledTemplatePreview({
  theme,
  paperWidth = PREVIEW_PAPER_WIDTH,
  compact: _compact = false,
  animate: _animate = false,
  fullPage: _fullPage = false,
  framed = true,
  fillParent = false,
}: {
  theme: TemplateTheme;
  paperWidth?: number;
  /** Kept for call-site compatibility; live sample text ignores bone layout knobs. */
  compact?: boolean;
  animate?: boolean;
  fullPage?: boolean;
  framed?: boolean;
  /** Fill the parent box and clip (gallery thumbnails). Otherwise grow to
   * the scaled page height so a modal can scroll the full sheet. */
  fillParent?: boolean;
}) {
  const sample = useMemo(() => sampleResumeForTemplate(theme.id), [theme.id]);
  const Template = getTemplateComponent(theme.id);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(fillParent ? 0 : 1);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;

    function measure() {
      const width = viewport!.clientWidth;
      const nextScale = width > 0 ? Math.min(1, width / paperWidth) : fillParent ? 0 : 1;
      setScale((prev) => (prev === nextScale ? prev : nextScale));
      if (!fillParent) {
        const nextHeight = page!.offsetHeight * nextScale;
        setHeight((prev) => (Math.abs(prev - nextHeight) < 0.5 ? prev : nextHeight));
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(page);
    return () => observer.disconnect();
  }, [theme.id, paperWidth, fillParent]);

  const scaled = scale > 0 && scale < 0.999;
  const pageStyle = scaled
    ? { width: paperWidth, transform: `scale(${scale})` }
    : fillParent && scale === 0
      ? { width: paperWidth, visibility: "hidden" as const }
      : { width: "100%" };

  /* Sidebar/two-column templates size their columns as a real table, the way
   * print does. Off-print the stylesheet falls back to flex, which the
   * colgroup then squeezes into the 34% rail column — a sample rendered
   * a third of a page wide with the rest blank. The builder's sheets opt into
   * the print model for these; the marketing previews have to as well. */
  const stageClass = isMultiColumnTemplate(theme.id) ? `resume-scale-stage ${PRINT_LAYOUT_SIM_CLASS}` : "";

  const page = (
    <div
      ref={pageRef}
      className={`origin-top-left ${stageClass} ${framed ? "overflow-hidden rounded-sm border border-[var(--color-border)] shadow-card" : ""}`}
      data-sample-resume={theme.id}
      style={pageStyle}
    >
      {/* Decorative preview, not the document itself — the candidate name
          renders as `p`, not `h1`, so a gallery of these never produces more
          than the page's own single `<h1>`. */}
      <Template data={sample} headingLevel="p" />
    </div>
  );

  if (fillParent) {
    return (
      <div ref={viewportRef} className="absolute inset-0 overflow-hidden">
        {page}
      </div>
    );
  }

  return (
    <div ref={viewportRef} className="w-full">
      <div className="relative overflow-hidden" style={height > 0 && scaled ? { height } : undefined}>
        {page}
      </div>
    </div>
  );
}

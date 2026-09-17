"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { TemplateTheme } from "@/components/templates/shared/theme";
import { TemplateSkeleton } from "./TemplateSkeleton";

/** Layout width the skeleton is drawn at before it is scaled down. Narrow
 * phones otherwise squash the sidebar until headings like EDUCATION clip. */
export const PREVIEW_PAPER_WIDTH = 520;

export function ScaledTemplatePreview({
  theme,
  paperWidth = PREVIEW_PAPER_WIDTH,
  compact = false,
  animate = false,
  fullPage = false,
  framed = true,
  fillParent = false,
}: {
  theme: TemplateTheme;
  paperWidth?: number;
  compact?: boolean;
  animate?: boolean;
  fullPage?: boolean;
  framed?: boolean;
  /** Fill the parent box and clip (gallery thumbnails). Otherwise grow to
   * the scaled page height so a modal can scroll the full sheet. */
  fillParent?: boolean;
}) {
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

  const page = (
    <div ref={pageRef} className="origin-top-left" style={pageStyle}>
      <TemplateSkeleton
        theme={theme}
        compact={compact}
        animate={animate}
        fullPage={fullPage}
        framed={framed}
      />
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

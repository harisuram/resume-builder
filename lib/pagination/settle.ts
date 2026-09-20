import {
  PAGE_HEIGHT_PX as PAGE_HEIGHT,
  contentHeightPx,
  heightForPrintSurface,
} from "@/lib/page";
import { clearAllPageGaps } from "./gaps";

export type SettleResult = {
  naturalHeight: number;
  /** Content bottom used for page-guide lines — ignores empty snapped sheets. */
  guideLimit: number;
  stageHeight: number;
  scale: number;
};

/**
 * Measure the resume stage for preview guides and print park.
 * Content flows naturally — no Move/Undo spacers or forced page cuts.
 * Fit surface height to real content (never round up into a blank trailing
 * sheet). Preview sheet rail-fill + print page gradient cover leftover
 * bands on each A4 without inventing empty pages.
 */
export function settlePageBreaks(
  stage: HTMLElement,
  scale: number,
  options: { printable?: boolean } = {},
): SettleResult {
  void options;
  const breakEls = Array.from(stage.querySelectorAll<HTMLElement>("[data-section-key], [data-item-key]"));
  clearAllPageGaps(stage, breakEls);

  let contentBottom = 0;
  const paged = stage.querySelectorAll<HTMLElement>(".resume-sidebar-page, .resume-split-page");
  if (paged.length > 0) {
    for (const page of paged) {
      contentBottom = Math.max(contentBottom, contentHeightPx(page));
    }
  } else {
    contentBottom = contentHeightPx(stage);
  }

  for (const page of paged) {
    page.style.height = "";
    page.style.minHeight = "";
    const content = contentHeightPx(page);
    // Fit content only — never round up into a blank trailing sheet. The
    // last sheet's leftover rail is painted by `.resume-rail-print-fill`,
    // which print repeats per sheet, so no height math is needed for it.
    const fitted = heightForPrintSurface(content);
    const snapped = `${fitted}px`;
    page.style.minHeight = snapped;
    page.style.height = snapped;
  }

  const naturalHeight = stage.offsetHeight;
  const stageHeight = naturalHeight * scale;
  // Page count follows real content — not a snapped empty A4 tail.
  const guideLimit = Math.max(
    PAGE_HEIGHT,
    Math.min(naturalHeight, contentBottom > 1 ? contentBottom : naturalHeight),
  );

  return { naturalHeight, guideLimit, stageHeight, scale };
}

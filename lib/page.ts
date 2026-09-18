/** Design-pixel width the preview and print stylesheet both lay the resume
 * out at. Print pins `#resume-print-root` to this width (see app/globals.css)
 * so wrapping and columns can't drift between the two. */
export const PAGE_WIDTH_PX = 760;

/** Height of one A4 page at 96dpi with `@page { margin: 0 }` — the PDF
 * print box. Preview guides use the same number so a "page 2" in the
 * preview is page 2 in the download.
 * 297mm × 96px/in ÷ 25.4mm/in. */
export const PAGE_HEIGHT_PX = Math.round((297 / 25.4) * 96);

/** Top inset on page 2+ so a heading isn't flush with the paper edge.
 * Matches `p-8` on the main column. Page 1 already has the template's
 * own padding; later sheets get this from ResumePreviewFrame instead. */
export const PAGE_INSET_PX = 32;

/** Y of the first line of content on a 0-based sheet. */
export function pageContentY(pageIndex: number, pageHeight = PAGE_HEIGHT_PX, inset = PAGE_INSET_PX): number {
  if (pageIndex <= 0) return 0;
  return pageIndex * pageHeight + inset;
}

/** Paper edge of the next sheet after `top`. Does not include PAGE_INSET_PX
 * — that inset is applied as `var(--page-inset)` so print can zero it on
 * sidebar/split templates (those clone cell padding onto every fragment). */
export function nextPageBoundaryY(top: number, eager = false, pageHeight = PAGE_HEIGHT_PX): number {
  const cutoff = eager ? top + 0.5 : top - 0.5;
  return Math.max(1, Math.ceil(cutoff / pageHeight)) * pageHeight;
}

/** Where a block that must start on a later sheet should land. `eager`
 * matches the avoid-break nudge (push if it even slightly crosses). */
export function nextPageContentY(
  top: number,
  eager = false,
  pageHeight = PAGE_HEIGHT_PX,
  inset = PAGE_INSET_PX,
): number {
  return nextPageBoundaryY(top, eager, pageHeight) + inset;
}

/** Inline margin that skips to the next paper edge, then adds the page-2
 * inset via `--page-inset` so preview and print can disagree on the inset
 * without rewriting pixel skips. */
export function pageStartMarginCss(skipPx: number, inset = PAGE_INSET_PX): string {
  const skip = Math.max(0, skipPx);
  if (skip < 0.5) return `var(--page-inset, ${inset}px)`;
  return `calc(${skip}px + var(--page-inset, ${inset}px))`;
}

/** Smallest height that is a whole number of A4 pages and still fits
 * `contentPx`. Used so a sidebar rail's background covers the leftover
 * band on the last sheet instead of stopping at the last line of text. */
export function heightToPageMultiple(contentPx: number, pageHeight = PAGE_HEIGHT_PX): number {
  if (contentPx <= 0) return pageHeight;
  return Math.max(1, Math.ceil(contentPx / pageHeight)) * pageHeight;
}

/** Bottom of real resume content inside `surface` (header / sections / items).
 * Prefer this over a column's scrollHeight — stretched flex/table cells and a
 * previously snapped page height invent blank trailing sheets (Inkwell PDFs
 * downloading 3 pages for 2 pages of content). */
export function contentHeightPx(surface: HTMLElement): number {
  let max = 0;
  for (const el of surface.querySelectorAll<HTMLElement>(
    ".resume-dark-header, [data-section-key], [data-item-key]",
  )) {
    let top = 0;
    let node: HTMLElement | null = el;
    while (node && node !== surface) {
      top += node.offsetTop;
      const parent = node.offsetParent as HTMLElement | null;
      if (!parent || parent === node || !surface.contains(parent)) break;
      node = parent;
    }
    max = Math.max(max, top + el.offsetHeight);
  }
  if (max < 1) {
    return Math.max(surface.scrollHeight, surface.offsetHeight, PAGE_HEIGHT_PX);
  }
  // Main/rail cells use p-8 / p-6 padding below the last block.
  return max + 32;
}

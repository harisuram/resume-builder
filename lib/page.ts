/** Design-pixel width the preview and print stylesheet both lay the resume
 * out at. Print pins `#resume-print-root` to this width (see app/globals.css)
 * so wrapping and columns can't drift between the two. */
export const PAGE_WIDTH_PX = 760;

/** Height of one printed A4 page, in the CSS pixels the print root is laid
 * out in. Chrome does not scale the 760px-wide root up to A4 width — it
 * lays it out 1:1 against the page box — so a sheet holds 297mm at 96dpi,
 * not `width × (297/210)`.
 *
 * Measured rather than assumed: position markers every 5px down a real
 * print root, print it, and read which marker lands on which PDF page.
 * Sheets came out 1122.5px apart, against the 1075 this used to assume —
 * a ~48px error per page that compounds, so the preview broke earlier
 * than the PDF and the two disagreed on both cuts and page count. (The
 * earlier 1075 was tuned for the Move/Undo break spacers, which no longer
 * exist; the drift it was compensating for went with them.) */
export const PAGE_HEIGHT_PX = Math.round((297 / 25.4) * 96);

/** Sidebar content side inset — 2% of page width. */
export const PAGE_PAD_X_PX = Math.round(PAGE_WIDTH_PX * 0.02);

/** Sidebar content bottom inset — 4% of page height. */
export const PAGE_PAD_Y_PX = Math.round(PAGE_HEIGHT_PX * 0.04);

/** Top inset on page 2+ so a heading isn't flush with the paper edge.
 * Page 1 is flush; later sheets get this from `--page-inset` / sheet chrome. */
export const PAGE_INSET_PX = Math.round(PAGE_HEIGHT_PX * 0.05);

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
  // Absorb trailing column padding and sub-pixel noise so we don't invent
  // a blank trailing sheet when content visually fits.
  const remainder = contentPx % pageHeight;
  if (remainder > 0 && remainder <= PAGE_PAD_Y_PX + 16) contentPx -= remainder;
  if (contentPx <= 0) return pageHeight;
  return Math.max(1, Math.ceil(contentPx / pageHeight)) * pageHeight;
}

/** Height for the printable surface: fit content, never round up into an
 * empty next sheet. Print CSS paints the rail on each fragment; forcing a
 * whole-page snap here is what put a blank page at the end of the PDF
 * while the live preview looked fine. */
export function heightForPrintSurface(contentPx: number, pageHeight = PAGE_HEIGHT_PX): number {
  if (contentPx <= 0) return pageHeight;
  const remainder = contentPx % pageHeight;
  if (remainder > 0 && remainder <= PAGE_PAD_Y_PX + 16) contentPx -= remainder;
  return Math.max(pageHeight, contentPx);
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
  // Match sidebar column bottom padding (4% of page height).
  return max + PAGE_PAD_Y_PX;
}

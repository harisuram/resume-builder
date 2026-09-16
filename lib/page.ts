/** Design-pixel width the preview and print stylesheet both lay the resume
 * out at. Print pins `#resume-print-root` to this width (see app/globals.css)
 * so wrapping and columns can't drift between the two. */
export const PAGE_WIDTH_PX = 760;

/** Height of one A4 page at 96dpi with `@page { margin: 0 }` — the PDF
 * print box. Preview guides use the same number so a "page 2" in the
 * preview is page 2 in the download.
 * 297mm × 96px/in ÷ 25.4mm/in. */
export const PAGE_HEIGHT_PX = Math.round((297 / 25.4) * 96);

/** Smallest height that is a whole number of A4 pages and still fits
 * `contentPx`. Used so a sidebar rail's background covers the leftover
 * band on the last sheet instead of stopping at the last line of text. */
export function heightToPageMultiple(contentPx: number, pageHeight = PAGE_HEIGHT_PX): number {
  if (contentPx <= 0) return pageHeight;
  return Math.max(1, Math.ceil(contentPx / pageHeight)) * pageHeight;
}

/** The page surface's own offsetHeight ignores a column that overflowed
 * out of a flex/table fragment. Print and preview both need the tallest
 * descendant so the rail/split can be stretched to that height. */
export function contentHeightPx(surface: HTMLElement): number {
  let max = Math.max(surface.scrollHeight, surface.offsetHeight);
  for (const el of surface.querySelectorAll<HTMLElement>(
    ".resume-main-column, .resume-sidebar-rail, .resume-split-wide, .resume-split-narrow",
  )) {
    max = Math.max(max, el.scrollHeight, el.offsetHeight);
  }
  return max;
}

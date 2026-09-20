/**
 * Reads a printed resume PDF back and reports, sheet by sheet, how much
 * vertical space is left empty. This is the only way to see the breaks the
 * PDF actually took: jsdom has no pagination, and the DOM under print
 * emulation is still one continuous 760px column.
 */

/** CSS px per PDF point. Chromium lays the print root out at 96dpi. */
const PX_PER_PT = 96 / 72;

export function pxFromPt(pt: number): number {
  return pt * PX_PER_PT;
}

export interface TextBox {
  /** Left/right edge in CSS px from the sheet's left edge. */
  left: number;
  right: number;
  /** Top/bottom in CSS px from the sheet's top edge. */
  top: number;
  bottom: number;
}

export interface PdfPage {
  /** 1-based, the way a reader counts pages. */
  number: number;
  widthPx: number;
  heightPx: number;
  boxes: TextBox[];
}

/** Text runs whose glyphs are all whitespace carry a box but no ink; counting
 * them would hide a gap behind a stray trailing space. */
function hasInk(text: string): boolean {
  return text.trim().length > 0;
}

export async function readPdfPages(data: Uint8Array): Promise<PdfPage[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // No worker thread in Node — the fake worker runs in-process and is plenty
  // for pulling text positions out of a handful of pages.
  // Node hands us a Buffer; pdf.js refuses anything that isn't a plain
  // Uint8Array, and it detaches whatever it is given, so copy.
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const doc = await pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  const pages: PdfPage[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const heightPt = viewport.height;
    const content = await page.getTextContent();
    const boxes: TextBox[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !hasInk(item.str)) continue;
      // transform = [a, b, c, d, e, f]; (e, f) is the baseline origin in PDF
      // user space, which counts up from the bottom-left of the sheet.
      const [, , , , x, baselineY] = item.transform;
      const ascent = item.height || 0;
      boxes.push({
        left: pxFromPt(x),
        right: pxFromPt(x + (item.width || 0)),
        top: pxFromPt(heightPt - (baselineY + ascent)),
        bottom: pxFromPt(heightPt - baselineY),
      });
    }
    pages.push({
      number: n,
      widthPx: pxFromPt(viewport.width),
      heightPx: pxFromPt(heightPt),
      boxes,
    });
    page.cleanup();
  }
  await doc.destroy();
  return pages;
}

export interface Region {
  name: string;
  /** Inclusive px window on the sheet's x axis; boxes outside it are ignored. */
  left: number;
  right: number;
}

export interface RegionGap {
  region: string;
  /** Empty px below the last line of text in this region. */
  bottomGapPx: number;
  /** Empty px above the first line of text in this region. */
  topGapPx: number;
  /** False when the region holds no text at all on this sheet. */
  hasText: boolean;
}

export interface PageGaps {
  number: number;
  heightPx: number;
  /** Whole sheet, every column together. */
  bottomGapPx: number;
  topGapPx: number;
  hasText: boolean;
  regions: RegionGap[];
}

function gapsFor(page: PdfPage, boxes: TextBox[]): { bottomGapPx: number; topGapPx: number; hasText: boolean } {
  if (boxes.length === 0) {
    return { bottomGapPx: page.heightPx, topGapPx: page.heightPx, hasText: false };
  }
  let lowest = 0;
  let highest = page.heightPx;
  for (const box of boxes) {
    if (box.bottom > lowest) lowest = box.bottom;
    if (box.top < highest) highest = box.top;
  }
  return {
    bottomGapPx: Math.max(0, page.heightPx - lowest),
    topGapPx: Math.max(0, highest),
    hasText: true,
  };
}

/** A text run counts as inside a region when its midpoint is — a glyph run
 * that starts a hair left of the column edge shouldn't jump columns. */
function inRegion(box: TextBox, region: Region): boolean {
  const mid = (box.left + box.right) / 2;
  return mid >= region.left && mid <= region.right;
}

export function measureGaps(pages: PdfPage[], regions: Region[] = []): PageGaps[] {
  return pages.map((page) => {
    const whole = gapsFor(page, page.boxes);
    return {
      number: page.number,
      heightPx: page.heightPx,
      ...whole,
      regions: regions.map((region) => ({
        region: region.name,
        ...gapsFor(
          page,
          page.boxes.filter((box) => inRegion(box, region)),
        ),
      })),
    };
  });
}

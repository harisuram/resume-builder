import { PAGE_HEIGHT_PX as PAGE_HEIGHT, PAGE_WIDTH_PX as PAGE_WIDTH } from "@/lib/page";

/**
 * Where the browser actually breaks the resume, rather than where arithmetic
 * predicts it will.
 *
 * The preview used to place cuts at multiples of the page budget and then nudge
 * them off anything print refuses to split. That tracks the PDF closely but not
 * exactly — the two agreed to within ~70px over a long resume, which is enough
 * to disagree by a whole sheet at the end. Chromium fragments columns and pages
 * with one engine, so laying a clone of the resume into columns the size of a
 * sheet and reading which column each line lands in gives the real cuts.
 *
 * Only for the families whose sheets are all the same height (single column and
 * labeled). Columns are uniform by definition, so a layout whose first sheet
 * holds more — the table families, which reserve their bands with a repeating
 * thead — cannot be measured this way and stays on the arithmetic model.
 */

/** Columns narrower than this never appear; guards a divide-by-zero. */
const MIN_COLUMN_WIDTH = 1;

export interface FragmentProbeOptions {
  /** Usable height of one sheet: PAGE_HEIGHT minus the reserved bands. */
  pageBudgetPx: number;
  /** Upper bound on sheets, so a pathological layout cannot spin. */
  maxPages?: number;
}

/** The stage slice one sheet shows: its own first line to its own last. */
export interface SheetRange {
  start: number;
  end: number;
}

interface LineBox {
  top: number;
  bottom: number;
  /** Viewport X, which is what saysic column a line landed in. */
  left: number;
}

/** Every line box in `root`, relative to it, in document order. One entry per
 * rendered row — a wrapped paragraph contributes several, and they can land in
 * different columns, so each carries its own position. */
function lineTops(root: HTMLElement, originTop: number): LineBox[] {
  const out: LineBox[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walk.nextNode())) {
    const text = node as Text;
    if (!(text.nodeValue ?? "").trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(text);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.height > 0)
        out.push({ top: rect.top - originTop, bottom: rect.bottom - originTop, left: rect.left });
    }
  }
  return out;
}

/**
 * Lays `source` out in sheet-sized columns and returns the Y on `source` at
 * which each sheet after the first begins. Returns `null` when the probe can't
 * be trusted — no layout (jsdom), an empty resume, or a column count that
 * disagrees with the measured content — so the caller can fall back.
 */
export function measureFragmentCuts(
  source: HTMLElement,
  { pageBudgetPx, maxPages = 60 }: FragmentProbeOptions,
): SheetRange[] | null {
  if (typeof document === "undefined" || pageBudgetPx < MIN_COLUMN_WIDTH) return null;
  // jsdom has Range but not its geometry, and a test that stubs the stage's
  // box would otherwise get this far and throw. No line boxes, no oracle.
  if (typeof document.createRange !== "function") return null;
  if (typeof document.createRange().getClientRects !== "function") return null;
  const sourceRect = source.getBoundingClientRect();
  // Nothing laid out means nothing to fragment.
  if (sourceRect.width < 1 || sourceRect.height < 1) return null;

  const sourceLines = lineTops(source, sourceRect.top);
  if (sourceLines.length === 0) return null;
  // The stage is scaled to fit its pane; the probe is not, so undo it.
  const scale = sourceRect.width / (source.offsetWidth || PAGE_WIDTH);
  if (!(scale > 0)) return null;

  const pages = Math.min(maxPages, Math.max(1, Math.ceil(source.offsetHeight / pageBudgetPx) + 2));
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.className = "resume-fragment-probe";
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "pointer-events:none",
    "visibility:hidden",
    "z-index:-1",
    `width:${PAGE_WIDTH * pages}px`,
    `height:${pageBudgetPx}px`,
    `column-width:${PAGE_WIDTH}px`,
    "column-gap:0",
    "column-fill:auto",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  // The stage is an absolutely positioned, transformed, transparent box parked
  // behind the sheets. Out-of-flow boxes do not fragment — left as-is the clone
  // sits whole in the first column and the probe reports a single page — and a
  // transform would skew every rect it measures.
  clone.style.position = "static";
  clone.style.transform = "none";
  clone.style.opacity = "1";
  clone.style.zIndex = "auto";
  clone.style.left = "auto";
  clone.style.top = "auto";
  clone.style.width = `${PAGE_WIDTH}px`;
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const hostRect = host.getBoundingClientRect();
    const cloneLines = lineTops(clone, hostRect.top);
    // The clone must lay out the same lines as the source, or the two cannot
    // be indexed against each other.
    if (cloneLines.length !== sourceLines.length) return null;

    // First and last line of each column, as Ys on the source. Taken as the
    // extremes rather than by DOM order: a two-column template emits the whole
    // narrow column before the wide one, so DOM order runs down the page twice
    // and the line that first lands in a new column is not necessarily the
    // highest one on that sheet.
    const top = new Map<number, number>();
    const bottom = new Map<number, number>();
    for (let i = 0; i < cloneLines.length; i++) {
      const index = Math.floor((cloneLines[i].left - hostRect.left) / PAGE_WIDTH);
      if (index < 0) continue;
      // Source Ys are in stage pixels; the probe is unscaled, so divide.
      const lineTop = sourceLines[i].top / scale;
      const lineBottom = sourceLines[i].bottom / scale;
      const t = top.get(index);
      const b = bottom.get(index);
      if (t === undefined || lineTop < t) top.set(index, lineTop);
      if (b === undefined || lineBottom > b) bottom.set(index, lineBottom);
    }

    const ranges: SheetRange[] = [];
    let previousEnd = -1;
    for (const index of Array.from(top.keys()).sort((a, b) => a - b)) {
      // A sheet ends at the bottom of its own last line, not at the top of the
      // next sheet's first one. Those differ — a fragment drops the margin
      // above its first line, and the two cells of a two-column template break
      // at one page edge while their rows sit at different heights — and
      // treating them as one number is what painted half a row of glyphs at a
      // sheet edge. Carrying both means each sheet shows exactly its own lines.
      const from = index === 0 ? 0 : Math.floor(top.get(index)!);
      const to = Math.ceil(bottom.get(index)!);
      // Monotonic, or sheets would repeat content.
      if (to <= previousEnd || to <= from) return null;
      ranges.push({ start: from, end: to });
      previousEnd = to;
    }
    if (ranges.length < 2) return null;
    return ranges;
  } finally {
    host.remove();
  }
}

/** Sheet ranges, or null when the probe could not be trusted. */
export function fragmentRanges(
  source: HTMLElement,
  options: FragmentProbeOptions,
): SheetRange[] | null {
  return measureFragmentCuts(source, options);
}

export { PAGE_HEIGHT };

/**
 * How much empty space a printed sheet is allowed to carry before the gap
 * counts as a pagination bug rather than ordinary typesetting.
 *
 * Content flows continuously into the print root (lib/pagination/settle.ts
 * clears every forced spacer), so a sheet only ends early when the print
 * engine refuses to split the next run of content: a `.break-inside-avoid`
 * entry, or a section heading glued to the entry after it by
 * `break-after-avoid`. The tallest such run is therefore the largest gap
 * the layout can honestly explain — anything past that is space no block
 * asked for.
 */

/** Sheets shorter than this mean the fixture stopped being a long resume. */
export const MIN_PAGES = 10;

/** One body line plus the margin under a block: the rounding a real break
 * carries even when it lands exactly where it should. */
const LINE_SLACK_PX = 36;

/** No interior sheet may waste more than this share of its height, however
 * tall the blocks are. Without it, one runaway unbreakable block would
 * raise its own budget and hide the hole it punches in the page. */
const HARD_BOTTOM_RATIO = 0.3;

/** Content on sheet 2+ starts at the paper edge, give or take the 4% band
 * the sidebar templates reserve with a repeating table header. */
const TOP_RATIO = 0.1;

/** A block this tall cannot help stranding space somewhere — it is the
 * cause of gaps rather than an excuse for them. */
const ATOMIC_RATIO = 0.55;

export interface GapBudget {
  pageHeightPx: number;
  /** Allowed empty px below the last line of an interior sheet. */
  maxBottomGapPx: number;
  /** Allowed empty px above the first line of sheet 2+. */
  maxTopGapPx: number;
  /** Allowed height for a single unbreakable run of content. */
  maxAtomicPx: number;
}

/**
 * `reservedBottomPx` is the band the layout deliberately holds back above the
 * paper edge — the sidebar family's repeating table footer, or the
 * `@page resume-flow` bottom margin. Gaps are measured from the paper edge,
 * so without it that reserved band reads as stranded whitespace on every
 * single sheet and the budget is short by exactly its height.
 */
export function gapBudget(
  pageHeightPx: number,
  tallestAtomicPx: number,
  reservedBottomPx = 0,
): GapBudget {
  const usableHeightPx = Math.max(1, pageHeightPx - reservedBottomPx);
  return {
    pageHeightPx,
    maxBottomGapPx:
      reservedBottomPx +
      Math.min(usableHeightPx * HARD_BOTTOM_RATIO, tallestAtomicPx + LINE_SLACK_PX),
    maxTopGapPx: pageHeightPx * TOP_RATIO,
    maxAtomicPx: pageHeightPx * ATOMIC_RATIO,
  };
}

/** Gaps are easier to judge in paper units than in CSS px. */
export function mm(px: number): string {
  return `${((px / 96) * 25.4).toFixed(0)}mm`;
}

export function describePx(px: number): string {
  return `${Math.round(px)}px (${mm(px)})`;
}

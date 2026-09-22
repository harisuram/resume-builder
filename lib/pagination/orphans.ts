import { PAGE_HEIGHT_PX as PAGE_HEIGHT, PAGE_PAD_Y_PX } from "@/lib/page";
import { inRailColumn, offsetTopIn } from "./geometry";

/** Only move a title when it sits near the page edge. Pulling mid-page
 * section starts left a stub first sheet and a huge blank before page 2. */
export const ORPHAN_TITLE_ZONE_PX = 160;

/** Pull the cut up to a block top when the hard edge would slice through
 * a line/bullet — capped so we don’t empty most of the sheet. */
export const BLOCK_SNAP_ZONE_PX = 220;

/** Trailing stub shorter than this is merged into the previous sheet. */
const TRAILING_STUB_PX = PAGE_PAD_Y_PX + 24;

/** Tallest line box we treat as a single glyph row when falling back to
 * element `getClientRects()`. Taller rects are whole multi-line blocks —
 * snapping to their top emptied half a sheet (Accountant jumped a page). */
const SINGLE_LINE_MAX_PX = 28;

/** Stand-in line height when no line box can be measured (jsdom, or a
 * heading whose body is still empty). Only decides whether a lone title is
 * treated as having room for one line under it, so it is deliberately
 * generous rather than tuned per template. */
const FALLBACK_LINE_PX = 20;

/** Exactly what print refuses to break. `@media print` resets
 * `break-inside` to `auto` on `li` and `p`, and experience/project cards
 * are left fragmentable so tall roles fill the sheet instead of jumping
 * whole to the next page. Item cards that still carry `break-inside-avoid`
 * (education, certs, …) and section headings move together, so the cut has
 * to move with them or preview and PDF disagree about which page a card is
 * on. `[data-item-key]` alone is not enough — experience entries keep that
 * attribute while remaining splitable. */
const BLOCK_SNAP_SEL = ".break-inside-avoid, h1, h2, h3, .break-after-avoid";

/** Fixed A4 cuts, snapped so we don’t slice mid-glyph / mid-bullet, and so a
 * section title near the edge isn’t left alone above the cut.
 *
 * `repeatingTopInsetPx` / `repeatingBottomInsetPx` are the bands a sidebar
 * repeats via table thead/tfoot. Measure hides thead (print cancels it), so
 * page 1 only reserves the bottom band; every later sheet loses both.
 * Measured against real output by printing position markers and reading
 * which marker landed on which PDF page. */
export function computePageOffsets(
  stage: HTMLElement,
  contentBottom: number,
  scale: number,
  repeatingTopInsetPx = 0,
  repeatingBottomInsetPx = 0,
): number[] {
  // Absorb trailing column-pad slack so we don’t invent an empty last sheet.
  let end = Math.max(contentBottom, 1);
  const rem = end % PAGE_HEIGHT;
  if (rem > 0 && rem <= TRAILING_STUB_PX) end -= rem;
  if (end <= PAGE_HEIGHT + 2) return [0, Math.max(end, 1)];

  const topInset = Math.max(0, repeatingTopInsetPx);
  const bottomInset = Math.max(0, repeatingBottomInsetPx);
  const laterPageBudget = Math.max(1, PAGE_HEIGHT - topInset - bottomInset);
  const offsets = [0];
  // Page 1: measure hides thead (print cancels it with a negative margin), so
  // content Y starts at 0 — only the repeating tfoot is reserved. Later
  // sheets lose both the top and bottom bands.
  let target = PAGE_HEIGHT - bottomInset;
  while (target < end - 2) {
    const prev = offsets[offsets.length - 1];
    let next = resolveCut(stage, target, scale);
    if (next <= prev + 20) next = Math.min(target, end);
    if (next <= prev + 20) next = Math.min(prev + laterPageBudget, end);
    offsets.push(next);
    target = next + laterPageBudget;
  }
  if (offsets[offsets.length - 1] < end - 1) offsets.push(end);

  // Collapse a nearly-empty trailing sheet into the previous one.
  while (offsets.length >= 3) {
    const last = offsets[offsets.length - 1]!;
    const prev = offsets[offsets.length - 2]!;
    if (last - prev > TRAILING_STUB_PX) break;
    offsets.pop();
    offsets[offsets.length - 1] = last;
  }
  return offsets;
}

/** Settle a cut: move it off anything print won't split, re-check the new
 * position once, then make sure it isn't slicing a line of text.
 *
 * Print pushes one block down; it never pushes the block before it as well,
 * so a second pass is the limit — re-checking without one walked the cut
 * back most of a sheet and left a page holding a single section. */
function resolveCut(stage: HTMLElement, target: number, scale: number): number {
  const floor = target - PAGE_HEIGHT;
  let candidate = target;
  for (let i = 0; i < 2; i++) {
    const next = Math.min(
      avoidSplitBlocks(stage, candidate, scale),
      avoidOrphanSectionTitle(stage, candidate, scale),
    );
    if (next >= candidate - 0.5) break;
    if (next < floor) break;
    candidate = next;
  }
  // Always, not just for a cut nothing moved: the two columns share one
  // cut, so a cut placed at a main-column card's top can still run through
  // a line of rail text. The snap only ever moves the cut up, so it can't
  // undo a block move — it just refuses to slice a line on either side.
  return snapToLineBoundary(stage, candidate, scale);
}

/** If a block print won't split straddles `y`, move the cut to its top.
 * Bounded by the block's own height rather than a fixed zone: print moves a
 * whole card however tall it is, and a card taller than the old zone was
 * skipped here, so the preview split what the PDF moved. A block taller
 * than a sheet is the exception — print has to split that one. */
export function avoidSplitBlocks(stage: HTMLElement, y: number, scale: number): number {
  let breakAt = y;
  for (const el of stage.querySelectorAll<HTMLElement>(BLOCK_SNAP_SEL)) {
    // Rail and main share one cut. Moving the cut for a rail card would
    // open a hole in the main column (and the PDF's table row doesn't
    // paginate the rail on its own), so only main-column blocks steer it.
    if (inRailColumn(el)) continue;
    const top = offsetTopIn(el, stage, scale);
    const height = el.offsetHeight;
    const bottom = top + height;
    if (top >= y - 0.5 || bottom <= y + 0.5) continue;
    if (height >= PAGE_HEIGHT) continue;
    breakAt = Math.min(breakAt, top);
  }
  return breakAt;
}

/** Print splits text between lines, never mid-line. If the cut runs
 * through a line box, move it to that line's top so the whole line goes to
 * the next sheet and no half-height row of glyphs straddles the edge.
 *
 * Line boxes belong to text, not elements — a bullet keeps its text in a
 * node beside its marker span — so this walks text nodes, then falls back
 * to element `getClientRects()` for role titles / headings. Needs real
 * layout, so it is a no-op under jsdom, where every rect measures zero. */
export function snapToLineBoundary(stage: HTMLElement, y: number, scale: number): number {
  const doc = stage.ownerDocument;
  if (!doc || typeof doc.createTreeWalker !== "function") return y;
  const rootTop = stage.getBoundingClientRect().top;
  const k = scale || 1;
  let breakAt = y;

  const consider = (top: number, bottom: number) => {
    // Any overlap with the cut plane — including a hairline into the glyph
    // cell — must pull the cut up. The old ±0.5 dead zone left mid-letter
    // slices when a line started just under the cut.
    if (bottom - top < 0.5) return;
    if (top < y && bottom > y) breakAt = Math.min(breakAt, top);
  };

  const walker = doc.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const pRect = parent.getBoundingClientRect();
    // Loose reject: skip nodes whose parent box is entirely above/below.
    if ((pRect.bottom - rootTop) / k <= y || (pRect.top - rootTop) / k >= y) continue;

    const range = doc.createRange();
    try {
      range.selectNodeContents(node);
    } catch {
      try {
        range.selectNode(node);
      } catch {
        continue;
      }
    }
    const rects = typeof range.getClientRects === "function" ? Array.from(range.getClientRects()) : [];
    for (const rect of rects) {
      consider((rect.top - rootTop) / k, (rect.bottom - rootTop) / k);
    }
  }

  // Fallback: single-line element boxes only (role titles, heading chips).
  // A multi-line `<li>`/`<p>` often returns one tall rect — snapping to that
  // top pulled the cut up half a page and left the gap the PDF never had.
  for (const el of stage.querySelectorAll<HTMLElement>("p, li, h1, h2, h3, .break-after-avoid")) {
    const rects = typeof el.getClientRects === "function" ? Array.from(el.getClientRects()) : [];
    for (const rect of rects) {
      const top = (rect.top - rootTop) / k;
      const bottom = (rect.bottom - rootTop) / k;
      if (bottom - top > SINGLE_LINE_MAX_PX) continue;
      consider(top, bottom);
    }
  }

  // Floor so the overflow crop can’t keep a fractional pixel of the next line.
  return Math.floor(breakAt);
}

/** If a section title sits just above `y` while the section continues past
 * `y`, move the page start to that title (title + body travel together). */
export function avoidOrphanSectionTitle(stage: HTMLElement, y: number, scale: number): number {
  let breakAt = y;
  for (const section of stage.querySelectorAll<HTMLElement>("[data-section-key]")) {
    // Same shared-cut rule as avoidSplitBlocks: a rail title must not pull
    // the whole sheet up or Soft Skills (etc.) jumps a page earlier than the
    // PDF, which fragments the table row as one unit.
    if (inRailColumn(section)) continue;
    const top = offsetTopIn(section, stage, scale);
    const bottom = top + section.offsetHeight;
    if (top >= y - 0.5 || bottom <= y + 0.5) continue;

    const heading = sectionHeadingEl(section);
    if (!heading) continue;
    const hTop = offsetTopIn(heading, stage, scale);
    const hBottom = hTop + heading.offsetHeight;

    // Print's `break-after: avoid-page` only forbids a break *immediately*
    // after the heading — it is satisfied the moment one line box follows the
    // title on the same sheet. Measure that, not the whole first entry: the
    // old pair test (title + entire entry) and the old proximity test (title
    // anywhere within ORPHAN_TITLE_ZONE_PX of the cut) both pushed a section
    // to the next sheet while the PDF kept its heading, role line and first
    // bullet line on the page before.
    const keepBottom = headingKeepBottom(stage, heading, hBottom, scale);
    if (hTop < y - 0.5 && keepBottom > y + 0.5 && hTop >= y - ORPHAN_TITLE_ZONE_PX * 2 && hTop >= top - 0.5) {
      breakAt = Math.min(breakAt, hTop);
    }
  }
  return breakAt;
}

/** Bottom of the content print refuses to separate from `heading`.
 *
 * Normally one line: `@media print` sets `li`/`p` to `break-inside: auto`
 * with `orphans/widows: 1`, so Chromium splits the first entry and keeps
 * only its first line up with the title.
 *
 * The exception is an entry print cannot split — a card still carrying
 * `break-inside-avoid` (education, certifications, patents, languages).
 * That moves whole, so the heading either clears it or travels with it. */
function headingKeepBottom(stage: HTMLElement, heading: HTMLElement, hBottom: number, scale: number): number {
  const entry = firstBodyEntry(heading);
  if (!entry) return hBottom + FALLBACK_LINE_PX;

  const entryBottom = offsetTopIn(entry, stage, scale) + entry.offsetHeight;
  if (typeof entry.matches === "function" && entry.matches(".break-inside-avoid")) {
    return Math.max(hBottom, entryBottom);
  }

  const line = firstLineBottom(entry, stage, scale);
  if (line !== null) return Math.max(hBottom, line);
  // No measurable line box (jsdom, or an entry with no text yet): assume one
  // line so a title with nothing under it still moves off the edge.
  return Math.max(hBottom + FALLBACK_LINE_PX, entryBottom);
}

/** Bottom of the topmost line box inside `el`, in stage coordinates.
 * Line boxes belong to text, not elements, so this walks text nodes the way
 * `snapToLineBoundary` does. Returns null where there is no real layout. */
function firstLineBottom(el: HTMLElement, stage: HTMLElement, scale: number): number | null {
  const doc = stage.ownerDocument;
  if (!doc || typeof doc.createTreeWalker !== "function") return null;
  const rootTop = stage.getBoundingClientRect().top;
  const k = scale || 1;
  let best: number | null = null;

  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    const range = doc.createRange();
    try {
      range.selectNodeContents(node);
    } catch {
      continue;
    }
    const rects = typeof range.getClientRects === "function" ? Array.from(range.getClientRects()) : [];
    for (const rect of rects) {
      if (rect.height < 0.5) continue;
      const bottom = (rect.bottom - rootTop) / k;
      if (best === null || bottom < best) best = bottom;
    }
  }
  return best;
}

/** The first entry under a heading — the list's first card, not the list. */
function firstBodyEntry(heading: HTMLElement): HTMLElement | null {
  const body = heading.nextElementSibling as HTMLElement | null;
  if (!body) return null;
  return (body.querySelector<HTMLElement>("[data-item-key]") ?? (body.firstElementChild as HTMLElement | null)) ?? body;
}

function sectionHeadingEl(section: HTMLElement): HTMLElement | null {
  return (
    section.querySelector<HTMLElement>(":scope > .break-after-avoid") ||
    section.querySelector<HTMLElement>(":scope > h3") ||
    section.querySelector<HTMLElement>("h3") ||
    section.querySelector<HTMLElement>(".break-after-avoid")
  );
}

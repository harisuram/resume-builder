import { PAGE_HEIGHT_PX as PAGE_HEIGHT, PAGE_PAD_Y_PX } from "@/lib/page";
import { offsetTopIn } from "./geometry";

/** Only move a title when it sits near the page edge. Pulling mid-page
 * section starts left a stub first sheet and a huge blank before page 2. */
export const ORPHAN_TITLE_ZONE_PX = 160;

/** Pull the cut up to a block top when the hard edge would slice through
 * a line/bullet — capped so we don’t empty most of the sheet. */
export const BLOCK_SNAP_ZONE_PX = 220;

/** Trailing stub shorter than this is merged into the previous sheet. */
const TRAILING_STUB_PX = PAGE_PAD_Y_PX + 24;

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
 * `repeatingTopInsetPx` is the band a sidebar repeats at the top of every
 * printed sheet. Page 1 clears that much extra flow, because the columns
 * table is pulled up by exactly that much to cancel the band there; every
 * later sheet loses it off the top instead. Measured against real output
 * by printing position markers and reading which marker landed on which
 * PDF page. */
export function computePageOffsets(
  stage: HTMLElement,
  contentBottom: number,
  scale: number,
  repeatingTopInsetPx = 0,
): number[] {
  // Absorb trailing column-pad slack so we don’t invent an empty last sheet.
  let end = Math.max(contentBottom, 1);
  const rem = end % PAGE_HEIGHT;
  if (rem > 0 && rem <= TRAILING_STUB_PX) end -= rem;
  if (end <= PAGE_HEIGHT + 2) return [0, Math.max(end, 1)];

  const inset = Math.max(0, repeatingTopInsetPx);
  const laterPageBudget = Math.max(1, PAGE_HEIGHT - inset);
  const offsets = [0];
  let target = PAGE_HEIGHT + inset;
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
 * node beside its marker span — so this walks text nodes. Needs real
 * layout, so it is a no-op under jsdom, where every rect measures zero. */
export function snapToLineBoundary(stage: HTMLElement, y: number, scale: number): number {
  const doc = stage.ownerDocument;
  if (!doc || typeof doc.createTreeWalker !== "function") return y;
  const rootTop = stage.getBoundingClientRect().top;
  const k = scale || 1;
  let breakAt = y;

  const walker = doc.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const pRect = parent.getBoundingClientRect();
    if ((pRect.bottom - rootTop) / k <= y - 0.5 || (pRect.top - rootTop) / k >= y + 0.5) continue;

    const range = doc.createRange();
    try {
      range.selectNode(node);
    } catch {
      continue;
    }
    const rects = typeof range.getClientRects === "function" ? Array.from(range.getClientRects()) : [];
    for (const rect of rects) {
      if (rect.height < 1) continue;
      const top = (rect.top - rootTop) / k;
      const bottom = (rect.bottom - rootTop) / k;
      // Only a line the cut actually runs through matters, and the fix is
      // to put the cut at that line's top so the whole line moves to the
      // next sheet. (Looking for a line *ending* above the cut finds
      // nothing: a straddling line ends below it by definition.)
      if (top < y - 0.5 && bottom > y + 0.5) breakAt = Math.min(breakAt, top);
    }
  }
  return breakAt;
}

/** If a section title sits just above `y` while the section continues past
 * `y`, move the page start to that title (title + body travel together). */
export function avoidOrphanSectionTitle(stage: HTMLElement, y: number, scale: number): number {
  let breakAt = y;
  for (const section of stage.querySelectorAll<HTMLElement>("[data-section-key]")) {
    const top = offsetTopIn(section, stage, scale);
    const bottom = top + section.offsetHeight;
    if (top >= y - 0.5 || bottom <= y + 0.5) continue;

    const heading = sectionHeadingEl(section);
    if (!heading) continue;
    const hTop = offsetTopIn(heading, stage, scale);
    const hBottom = hTop + heading.offsetHeight;

    // Print's `break-after: avoid-page` won't leave a heading as the last
    // box on a sheet: it pushes the heading down unless the heading and the
    // entry after it both clear the edge. Measure that same pair here —
    // only the first entry, not the whole list, or a long section drags the
    // cut up whenever its heading is anywhere near the edge.
    const firstEntry = firstBodyEntry(heading);
    if (firstEntry) {
      const keepBottom = hBottom + firstEntry.offsetHeight;
      if (hTop < y - 0.5 && keepBottom > y + 0.5 && hTop >= y - ORPHAN_TITLE_ZONE_PX * 2 && hTop >= top - 0.5) {
        breakAt = Math.min(breakAt, hTop);
        continue;
      }
    }

    // Title near the cut (not mid-page); cut falls after it while the section
    // still has content below — title would be separated onto its own stub.
    if (hTop < y - 0.5 && hTop >= y - ORPHAN_TITLE_ZONE_PX && hTop >= top - 0.5 && bottom > y + 0.5) {
      if (hBottom <= y + 1 || hBottom > y) {
        breakAt = Math.min(breakAt, hTop);
      }
    }
  }
  return breakAt;
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

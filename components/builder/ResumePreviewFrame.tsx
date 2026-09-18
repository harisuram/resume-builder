"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { getTemplateComponent } from "@/components/templates/registry";
import { experienceTitle } from "@/components/templates/shared/atoms";
import { getSectionMeta } from "@/lib/persona";
import {
  PAGE_HEIGHT_PX as PAGE_HEIGHT,
  PAGE_INSET_PX as PAGE_INSET,
  PAGE_WIDTH_PX as PAGE_WIDTH,
  contentHeightPx,
  heightToPageMultiple,
  nextPageBoundaryY,
  pageStartMarginCss,
} from "@/lib/page";
import { itemBreakKey, parseItemBreakKey } from "@/lib/resume";
import type { ResumeData, SectionKey } from "@/lib/types";

function sectionLabel(key: SectionKey): string {
  if (key === "experience" || key === "internships" || key === "partTime") return experienceTitle(key);
  return getSectionMeta(key).label;
}

interface LineMarker {
  section: SectionKey;
  /** Set when the marker acts on a single list entry rather than the whole
   * section — its position in that section's list. */
  index?: number;
  /** On-screen (already scaled) vertical position. */
  y: number;
  label: string;
}

/** Both the section wrappers and the individual list entries inside them
 * carry break metadata; this reads whichever one an element is. */
function markerFor(el: HTMLElement): Omit<LineMarker, "y"> | null {
  const itemKey = el.getAttribute("data-item-key");
  if (itemKey) {
    const parsed = parseItemBreakKey(itemKey);
    if (!parsed) return null;
    const rawLabel = el.getAttribute("data-item-label")?.trim() ?? "";
    return {
      section: parsed.section,
      index: parsed.index,
      label: rawLabel || `${sectionLabel(parsed.section)} ${parsed.index + 1}`,
    };
  }
  const section = el.getAttribute("data-section-key") as SectionKey | null;
  if (!section) return null;
  return { section, label: sectionLabel(section) };
}

function markerId(marker: Pick<LineMarker, "section" | "index">): string {
  return marker.index === undefined ? marker.section : itemBreakKey(marker.section, marker.index);
}

/** Which of two overlapping offers to make at the same page boundary.
 * A later list entry wins over its enclosing section, so earlier items
 * that already fit stay put. The first entry is the exception: moving it
 * alone would leave the section title stranded, so the whole section
 * (heading included) moves — same rule for projects, experience, and
 * every other list. */
function offerRank(marker: Pick<LineMarker, "index">): number {
  return marker.index !== undefined && marker.index > 0 ? 1 : 0;
}

/** Y of `el` on the preview stage. Prefer the layout box so sidebar/split
 * tables (display:flex on screen, display:table in print) still report the
 * right page. jsdom has no layout, so tests that stub offsetTop keep working. */
function offsetTopIn(el: HTMLElement, root: HTMLElement, scale = 1): number {
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (rootRect.width > 1 && elRect.height > 1) {
    return (elRect.top - rootRect.top) / (scale || 1);
  }
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    top += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent || parent === node) break;
    node = parent;
  }
  return top;
}

/** Sidebar / asymmetric rails don't paginate as their own sheet. Pushing a
 * rail section (Education, Skills, …) with margin-top opens a hole in the
 * colored column and draws the page-break guide over the name. */
function inRailColumn(el: HTMLElement): boolean {
  return Boolean(el.closest("[data-resume-column='rail']"));
}

function markersEqual(a: LineMarker[], b: LineMarker[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((left, i) => {
    const right = b[i];
    return left.section === right.section && left.index === right.index && left.label === right.label && Math.abs(left.y - right.y) < 0.5;
  });
}

function writeMarginTop(el: HTMLElement, value: string) {
  // `important` so print's sibling gap rules (`> * + * { margin-top: 1rem
  // !important }`) cannot squash a simulated page start. Print keeps these
  // gaps: `break-before: page` is ignored inside the absolutely positioned
  // `#resume-print-root`, which is why wiping them made the PDF ignore the
  // page-separator control.
  if (!value) {
    if (el.style.marginTop) el.style.removeProperty("margin-top");
    return;
  }
  if (el.style.marginTop === value && el.style.getPropertyPriority("margin-top") === "important") return;
  el.style.setProperty("margin-top", value, "important");
}

function straddlesPage(top: number, height: number, pageHeight = PAGE_HEIGHT): boolean {
  if (height < 1) return false;
  const bottom = top + height;
  return Math.floor(top / pageHeight) !== Math.floor((bottom - 0.5) / pageHeight);
}

/** Drop a simulated page-start margin when the block already fits on the
 * page natural flow puts it on — e.g. after moving A to page 2, a later
 * "start on page 3" break is often leftover empty space and should pack up. */
function packRedundantMargin(
  el: HTMLElement,
  stage: HTMLElement,
  scale: number,
  reapply: () => void,
): boolean {
  if (!el.style.marginTop) return false;
  writeMarginTop(el, "");
  const top = offsetTopIn(el, stage, scale);
  const height = el.offsetHeight;
  if (!straddlesPage(top, height)) return true;
  reapply();
  return false;
}

/** Page-break pills. Padding/type is larger below `md` so a thumb can hit
 * "move to next page" on the mobile sheet without changing desktop density. */
const PAGE_GUIDE_PILL =
  "max-w-[70%] shrink-0 truncate rounded-full px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide min-h-9 md:min-h-0 md:px-2 md:py-0.5 md:text-[9px]";

/**
 * The single rendering surface shared by the live preview and the export
 * path — never a second export-only copy, so a download can't visually
 * drift from what was previewed. `printable` tags the DOM node the print
 * stylesheet targets; only the export step's instance sets it. Print CSS
 * (globals.css) neutralizes the scaling below so the printed page uses its
 * natural width instead.
 */
export function ResumePreviewFrame({
  data,
  printable = false,
  onToggleSectionBreak,
  onToggleItemBreak,
}: {
  data: ResumeData;
  printable?: boolean;
  /** Called with a section's key when the user asks to move it to the next
   * page, or to undo a page break they'd previously forced. Omit to render
   * the page-break guides as plain, non-interactive information only. */
  onToggleSectionBreak?: (key: SectionKey) => void;
  /** The same, for a single list entry within a section. Omitted separately
   * from onToggleSectionBreak so an entry-level offer is only ever shown
   * where it can actually be acted on. */
  onToggleItemBreak?: (key: SectionKey, index: number) => void;
}) {
  // Looked up from a registry built once at module scope (components/templates/registry.tsx),
  // so this is a stable reference per templateId, not a fresh component per render.
  const Template = getTemplateComponent(data.templateId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const onToggleSectionBreakRef = useRef(onToggleSectionBreak);
  const onToggleItemBreakRef = useRef(onToggleItemBreak);
  onToggleSectionBreakRef.current = onToggleSectionBreak;
  onToggleItemBreakRef.current = onToggleItemBreak;
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [splits, setSplits] = useState<LineMarker[]>([]);
  const [forced, setForced] = useState<LineMarker[]>([]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;

    // Observe the viewport's *width* only. This effect writes the viewport
    // height (scaled page stack) and mutates the stage (page snapping,
    // avoid-break margins). Watching those — or remasuring on height-only
    // resizes — re-enters measure, clears margins, and glitters. Soft skills
    // (or any last section) is enough extra height to trip a scrollbar;
    // download never runs this path so it stays stable.
    let lastWidth = Number.NaN;

    function measure(reason: "data" | "resize") {
      const containerWidth = viewport!.clientWidth;
      if (reason === "resize" && containerWidth === lastWidth) return;
      lastWidth = containerWidth;
      const nextScale = containerWidth > 0 ? Math.min(containerWidth / PAGE_WIDTH, 1) : 1;

      // Sections and the individual entries inside them, in document order —
      // both are breakable, and a break on either shifts everything below it.
      const breakEls = Array.from(stage!.querySelectorAll<HTMLElement>("[data-section-key], [data-item-key]"));

      // Undo any previous simulation before recomputing from scratch —
      // otherwise a section un-forced since the last pass would keep
      // whatever margin was last applied to it.
      for (const el of breakEls) writeMarginTop(el, "");

      // Push a forced section down to the next A4 paper edge. PAGE_INSET is
      // layered on via `--page-inset` (JS margins only — print must not also
      // clone cell padding-top or it invents a blank trailing sheet).
      for (const el of breakEls) {
        if (el.getAttribute("data-force-break") !== "true") continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const extra = nextPageBoundaryY(top) - top;
        if (extra > 0.5) writeMarginTop(el, pageStartMarginCss(extra));
        else if (Math.floor(top / PAGE_HEIGHT) >= 1) writeMarginTop(el, pageStartMarginCss(0));
      }

      // After an earlier "move to page N", later forced breaks are often
      // leftover: the block already fits on the previous sheet. Drop those
      // margins and clear them from the store so page 3 packs onto page 2.
      // Keep breaks that only add the page-2 inset, or that would fall back
      // onto page 1 (the user's intentional "start on page 2").
      const redundantForced: Omit<LineMarker, "y">[] = [];
      for (const el of [...breakEls].reverse()) {
        if (el.getAttribute("data-force-break") !== "true") continue;
        if (inRailColumn(el)) continue;
        if (!el.style.marginTop) continue;
        const topBefore = offsetTopIn(el, stage!, nextScale);
        const pageBefore = Math.floor(topBefore / PAGE_HEIGHT);
        const packed = packRedundantMargin(el, stage!, nextScale, () => {
          const top = offsetTopIn(el, stage!, nextScale);
          const extra = nextPageBoundaryY(top) - top;
          if (extra > 0.5) writeMarginTop(el, pageStartMarginCss(extra));
          else if (Math.floor(top / PAGE_HEIGHT) >= 1) writeMarginTop(el, pageStartMarginCss(0));
        });
        if (!packed) continue;
        const topAfter = offsetTopIn(el, stage!, nextScale);
        const pageAfter = Math.floor(topAfter / PAGE_HEIGHT);
        if (pageAfter >= pageBefore || pageAfter < 1) {
          const extra = nextPageBoundaryY(topAfter) - topAfter;
          if (extra > 0.5) writeMarginTop(el, pageStartMarginCss(extra));
          else if (pageAfter >= 1) writeMarginTop(el, pageStartMarginCss(0));
          continue;
        }
        const marker = markerFor(el);
        if (marker) redundantForced.push(marker);
      }

      // Detect splits before the avoid-break nudge below. That nudge is
      // print-fidelity only: once an entry has been pushed onto the next
      // sheet it no longer straddles, and the enclosing section would be
      // offered instead — moving every earlier project that already fit.
      const nextSplits = new Map<number, LineMarker>();
      const nextForced: LineMarker[] = [];
      for (const el of breakEls) {
        const marker = markerFor(el);
        if (!marker) continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const bottom = top + el.offsetHeight;
        if (el.getAttribute("data-force-break") === "true" && el.style.marginTop) {
          nextForced.push({ ...marker, y: top * nextScale });
          continue;
        }
        // Guards a degenerate zero-height element (bottom === top, e.g. an
        // unmeasured node) from being misread as split: floor() of a
        // negative `bottom - 0.5` rounds further down than floor(top),
        // making the two sides of the comparison disagree even though
        // there's no real content spanning anything.
        if (bottom - top < 1) continue;
        if (Math.floor(top / PAGE_HEIGHT) === Math.floor((bottom - 0.5) / PAGE_HEIGHT)) continue;
        const boundary = Math.ceil(top / PAGE_HEIGHT);
        const current = nextSplits.get(boundary);
        if (current && offerRank(current) >= offerRank(marker)) continue;
        nextSplits.set(boundary, { ...marker, y: boundary * PAGE_HEIGHT * nextScale });
      }

      // Print also honors `break-inside: avoid` on list entries. Without
      // this, the preview still draws a split through an entry that the PDF
      // will have already moved onto the next sheet.
      const avoidBreakEls = Array.from(stage!.querySelectorAll<HTMLElement>(".break-inside-avoid"));
      for (const el of avoidBreakEls) {
        if (el.getAttribute("data-force-break") === "true" && el.style.marginTop) continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const height = el.offsetHeight;
        if (height < 1 || height >= PAGE_HEIGHT) continue;
        if (!straddlesPage(top, height)) continue;
        const extra = nextPageBoundaryY(top, true) - top;
        if (extra > 0.5) writeMarginTop(el, pageStartMarginCss(extra));
      }

      // Same pack pass for avoid-break nudges: if a later move freed room on
      // page 2, pull the nudged entry back instead of leaving it on page 3.
      for (const el of [...avoidBreakEls].reverse()) {
        if (el.getAttribute("data-force-break") === "true" && el.style.marginTop) continue;
        if (inRailColumn(el)) continue;
        packRedundantMargin(el, stage!, nextScale, () => {
          const top = offsetTopIn(el, stage!, nextScale);
          const height = el.offsetHeight;
          if (height < 1 || height >= PAGE_HEIGHT || !straddlesPage(top, height)) return;
          const extra = nextPageBoundaryY(top, true) - top;
          if (extra > 0.5) writeMarginTop(el, pageStartMarginCss(extra));
        });
      }

      // A section that merely *starts* on a later sheet (previous block ended
      // at the page edge) never straddles and was never forced, so the two
      // loops above leave it flush with the paper. Give it the same inset —
      // including rail columns, where a 32px pad is inside the colored strip,
      // not a hole on page 1.
      for (const el of breakEls) {
        if (el.style.marginTop) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const page = Math.floor(top / PAGE_HEIGHT);
        if (page < 1) continue;
        const offset = top - page * PAGE_HEIGHT;
        if (offset >= PAGE_INSET - 0.5) continue;
        writeMarginTop(el, pageStartMarginCss(0));
      }

      // Sidebar / split templates paint a page-tall rail or column. The
      // surface's offsetHeight is often one A4 page even when the main
      // column has overflowed onto page 2. Clear any previous snap before
      // measuring — otherwise a one-time overshoot (page-2 inset, avoid-break
      // gap) locks the height at an extra blank sheet forever, and Inkwell /
      // other sidebar PDFs download 3 pages for 2 pages of content.
      const paged = stage!.querySelectorAll<HTMLElement>(".resume-sidebar-page, .resume-split-page");
      for (const page of paged) {
        page.style.height = "";
        page.style.minHeight = "";
        const snapped = `${heightToPageMultiple(contentHeightPx(page))}px`;
        page.style.minHeight = snapped;
        page.style.height = snapped;
      }

      // offsetHeight is the stage's natural layout height at PAGE_WIDTH —
      // transforms are paint-only, so it's unaffected by the scale itself.
      const nextNaturalHeight = stage!.offsetHeight;
      const nextStageHeight = nextNaturalHeight * nextScale;
      const splitList = [...nextSplits.values()];

      setScale((prev) => (prev === nextScale ? prev : nextScale));
      setStageHeight((prev) => (Math.abs(prev - nextStageHeight) < 0.5 ? prev : nextStageHeight));
      setNaturalHeight((prev) => (Math.abs(prev - nextNaturalHeight) < 0.5 ? prev : nextNaturalHeight));
      setSplits((prev) => (markersEqual(prev, splitList) ? prev : splitList));
      setForced((prev) => (markersEqual(prev, nextForced) ? prev : nextForced));

      if (redundantForced.length > 0) {
        for (const marker of redundantForced) {
          if (marker.index === undefined) onToggleSectionBreakRef.current?.(marker.section);
          else onToggleItemBreakRef.current?.(marker.section, marker.index);
        }
      }
    }

    measure("data");
    const observer = new ResizeObserver(() => measure("resize"));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [data, printable]);

  // Where a new printed page starts, in on-screen (scaled) pixels — purely
  // informational overlay so someone can see a resume has spilled onto a
  // second page before they ever open the print dialog.
  const pageBreaks: number[] = [];
  for (let i = 1; i * PAGE_HEIGHT < naturalHeight; i++) {
    pageBreaks.push(i * PAGE_HEIGHT * scale);
  }

  /** A marker is actionable only if the caller wired up the toggle for the
   * granularity it targets — the export step wires neither and gets plain
   * labels throughout. */
  function toggleFor(marker: LineMarker): (() => void) | null {
    if (marker.index === undefined) {
      return onToggleSectionBreak ? () => onToggleSectionBreak(marker.section) : null;
    }
    const index = marker.index;
    return onToggleItemBreak ? () => onToggleItemBreak(marker.section, index) : null;
  }

  function forcedMarker(f: LineMarker, y: number) {
    const text = `"${f.label}" starts a new page`;
    const toggle = toggleFor(f);
    return {
      id: `forced-${markerId(f)}`,
      y,
      // Forcing a section down leaves the rest of the previous page blank,
      // so the row drops into that gap rather than onto the boundary, where
      // it struck a line through the section heading directly below it.
      above: true,
      faint: true,
      label: toggle ? (
        <button
          type="button"
          onClick={toggle}
          title={`${text} — click to undo`}
          className={`pointer-events-auto border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] transition duration-150 hover:text-[var(--color-accent)] ${PAGE_GUIDE_PILL}`}
        >
          {text} &mdash; Undo
        </button>
      ) : (
        <span className={`border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] ${PAGE_GUIDE_PILL}`}>
          {text}
        </span>
      ),
    };
  }

  // Forcing a section onto a new page lands it PAGE_INSET below the paper
  // edge, so Undo sits in that gap. Pair it with the boundary marker rather
  // than drawing a second row 32px down.
  const insetScreen = PAGE_INSET * scale;
  const markers = pageBreaks.map((y, i) => {
    const page = i + 2;
    const forcedHere = forced.find((f) => f.y + 0.5 >= y && f.y <= y + insetScreen + 0.5);
    if (forcedHere) return forcedMarker(forcedHere, y);
    const split = splits.find((s) => Math.abs(s.y - y) < 0.5);
    const toggle = split ? toggleFor(split) : null;
    return {
      id: `page-${page}`,
      y,
      // An organic break falls mid-content, so there's no gap to sit in —
      // the row stays centered on the boundary it describes.
      above: false,
      faint: false,
      label:
        split && toggle ? (
          <button
            type="button"
            onClick={toggle}
            title={`Move "${split.label}" to page ${page}`}
            className={`pointer-events-auto bg-[var(--color-accent)] text-[var(--color-accent-ink)] transition duration-150 hover:brightness-110 ${PAGE_GUIDE_PILL}`}
          >
            Move &ldquo;{split.label}&rdquo; to page {page}
          </button>
        ) : (
          <span className={`bg-[var(--color-accent)] text-[var(--color-accent-ink)] ${PAGE_GUIDE_PILL}`}>
            {split ? `"${split.label}" splits here` : `Page ${page} starts here`}
          </span>
        ),
    };
  });

  // Something forced to the very top of page 1 needed no push and so has no
  // boundary to pair with — nothing was broken, so it gets no marker.
  for (const f of forced) {
    if (f.y <= 0.5) continue;
    if (markers.some((m) => f.y + 0.5 >= m.y && f.y <= m.y + insetScreen + 0.5)) continue;
    markers.push(forcedMarker(f, f.y));
  }

  return (
    <div
      ref={viewportRef}
      className="resume-scale-viewport relative mx-auto w-full max-w-[760px] overflow-hidden"
      style={{ height: stageHeight || undefined }}
    >
      <div
        ref={stageRef}
        className="resume-scale-stage relative origin-top-left rounded-sm border border-[var(--color-border)] shadow-card"
        style={{
          width: PAGE_WIDTH,
          transform: `scale(${scale})`,
          // Same inset for preview and export so page-2 top padding is the
          // JS margin (kept in the PDF). Print no longer clones cell
          // padding-top — that was inventing a blank trailing sheet.
          ["--page-inset" as string]: `${PAGE_INSET}px`,
        }}
      >
        <div id={printable ? "resume-print-root" : undefined}>
          {/* eslint-disable-next-line react-hooks/static-components -- stable registry lookup, see comment above */}
          <Template data={data} />
        </div>
      </div>

      {/* Page-break guides — only worth showing once there's more than one
          page, and never part of the print/export output itself. */}
      {markers.length > 0 && (
        <div className="no-print pointer-events-none absolute inset-0">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={`absolute inset-x-0 flex items-center gap-2 ${marker.above ? "-translate-y-full" : ""}`}
              style={{ top: marker.y }}
            >
              <div
                className={`h-0 flex-1 border-t border-dashed ${
                  marker.faint ? "border-[var(--color-ink-faint)]" : "border-[var(--color-accent)]"
                }`}
              />
              {marker.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

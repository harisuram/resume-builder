"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { getTemplateComponent } from "@/components/templates/registry";
import { experienceTitle } from "@/components/templates/shared/atoms";
import { getTheme } from "@/components/templates/shared/theme";
import { getSectionMeta } from "@/lib/persona";
import { PAGE_HEIGHT_PX as PAGE_HEIGHT, PAGE_WIDTH_PX as PAGE_WIDTH, contentHeightPx, heightToPageMultiple } from "@/lib/page";
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

/** Sum offsetTop through offsetParent so a section inside a table cell still
 * reports its Y on the preview stage. jsdom's offsetParent is null, so tests
 * that stub offsetTop on the node itself keep working. */
function offsetTopIn(el: HTMLElement, root: HTMLElement): number {
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
  if (el.style.marginTop !== value) el.style.marginTop = value;
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
  const theme = getTheme(data.templateId);
  const guideLeft =
    theme.layout === "sidebar" && (theme.sidebarSide ?? "left") === "left" ? "calc(34% + 8px)" : undefined;
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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

      // Simulate on screen what `break-before: page` (applied in the print
      // stylesheet to the same [data-force-break] elements) will really do
      // at print time: push a forced section down to the top of its next
      // page. Processed in document order so an earlier push correctly
      // shifts the measured position of everything below it.
      for (const el of breakEls) {
        if (el.getAttribute("data-force-break") !== "true") continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!);
        const target = Math.ceil((top - 0.5) / PAGE_HEIGHT) * PAGE_HEIGHT;
        const extra = target - top;
        if (extra > 0.5) writeMarginTop(el, `${extra}px`);
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
        const top = offsetTopIn(el, stage!);
        const bottom = top + el.offsetHeight;
        if (el.getAttribute("data-force-break") === "true") {
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
      for (const el of stage!.querySelectorAll<HTMLElement>(".break-inside-avoid")) {
        if (el.getAttribute("data-force-break") === "true") continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!);
        const height = el.offsetHeight;
        if (height < 1 || height >= PAGE_HEIGHT) continue;
        const bottom = top + height;
        if (Math.floor(top / PAGE_HEIGHT) === Math.floor((bottom - 0.5) / PAGE_HEIGHT)) continue;
        const target = Math.ceil((top + 0.5) / PAGE_HEIGHT) * PAGE_HEIGHT;
        const extra = target - top;
        if (extra > 0.5) writeMarginTop(el, `${extra}px`);
      }

      // Sidebar / split templates paint a page-tall rail or column. The
      // surface's offsetHeight is often one A4 page even when the main
      // column has overflowed onto page 2. Measure that overflowing
      // column, snap to whole pages, and set both min-height and height
      // so the 34% gradient (and any 100%-tall children) fill the leftover
      // band. The snapped value is always >= content, so nothing clips.
      const paged = stage!.querySelectorAll<HTMLElement>(".resume-sidebar-page, .resume-split-page");
      for (const page of paged) {
        const snapped = `${heightToPageMultiple(contentHeightPx(page))}px`;
        if (page.style.height !== snapped) {
          page.style.minHeight = snapped;
          page.style.height = snapped;
        }
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
    }

    measure("data");
    const observer = new ResizeObserver(() => measure("resize"));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [data]);

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

  // Forcing a section onto a new page pushes its top to exactly a page
  // boundary, so its Undo control and that boundary's own "Page N starts
  // here" label describe the same line — drawn as two separate rows they
  // landed at identical coordinates, stacking two dashed rules and two pills
  // on top of each other. Pairing them up front keeps one row per boundary.
  const markers = pageBreaks.map((y, i) => {
    const page = i + 2;
    const forcedHere = forced.find((f) => Math.abs(f.y - y) < 0.5);
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
    if (markers.some((m) => Math.abs(m.y - f.y) < 0.5)) continue;
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
        style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}
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
          <div
            className="absolute top-2 rounded-full bg-[var(--color-ink)]/70 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white"
            style={{ left: guideLeft ?? 8 }}
          >
            Page 1
          </div>
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

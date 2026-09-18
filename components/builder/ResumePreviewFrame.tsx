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

function getGapSpacer(el: HTMLElement): HTMLElement | null {
  const prev = el.previousElementSibling as HTMLElement | null;
  return prev?.getAttribute("data-page-gap-spacer") === "true" ? prev : null;
}

/** Concrete px height for a page-gap spacer. Prefer resolved pixels over
 * `calc(... + var(--page-inset))` so print/table layout cannot drop the gap
 * when custom properties fail to resolve on the spacer. */
function pageGapHeightCss(skipPx: number): string {
  return `${Math.max(0, skipPx) + PAGE_INSET}px`;
}

function writePageGap(el: HTMLElement, value: string, kind: "break" | "inset" = "break") {
  // Spacer sibling (not margin/padding on the section):
  // - margin-top collapses at print fragment boundaries → PDF ignored the cut
  // - padding-top kept offsetTop on the old page → Undo + "Page N" twin guides
  // Preview: a block with height pushes the section to the paper edge.
  // Print: `data-page-gap-kind="break"` becomes a real CSS page break (see
  // globals.css); inset-only spacers keep a small top pad on the next sheet.
  let spacer = getGapSpacer(el);
  if (!value) {
    spacer?.remove();
    if (el.style.paddingTop) el.style.removeProperty("padding-top");
    if (el.style.marginTop) el.style.removeProperty("margin-top");
    return;
  }
  if (!spacer) {
    spacer = document.createElement("div");
    spacer.setAttribute("data-page-gap-spacer", "true");
    spacer.setAttribute("aria-hidden", "true");
    el.parentElement?.insertBefore(spacer, el);
  }
  spacer.setAttribute("data-page-gap-kind", kind);
  el.style.setProperty("margin-top", "0px", "important");
  if (el.style.paddingTop) el.style.removeProperty("padding-top");
  spacer.style.cssText =
    "display:block;width:100%;height:" +
    value +
    ";min-height:" +
    value +
    ";margin:0;padding:0;border:0;overflow:hidden;pointer-events:none;flex-shrink:0;";
}

function hasPageGap(el: HTMLElement): boolean {
  return Boolean(getGapSpacer(el));
}

/** Print switches sidebar/split columns from flex to table. Spacers sized
 * against the flex preview are too short in the PDF, so Projects still
 * started at the bottom of page 1. Force the print display model, remesure,
 * then restore after printing. */
const PRINT_LAYOUT: { sel: string; display: string }[] = [
  { sel: ".resume-sidebar-columns, .resume-split-columns", display: "table" },
  { sel: ".resume-sidebar-page-pad, .resume-split-page-pad", display: "table-header-group" },
  { sel: ".resume-sidebar-columns tbody, .resume-split-columns tbody", display: "table-row-group" },
  { sel: ".resume-sidebar-columns tr, .resume-split-columns tr", display: "table-row" },
  {
    sel: ".resume-sidebar-rail, .resume-main-column, .resume-sidebar-pad-rail, .resume-sidebar-pad-main, .resume-split-narrow, .resume-split-wide, .resume-split-pad-narrow, .resume-split-pad-wide",
    display: "table-cell",
  },
  { sel: ".resume-page-body", display: "block" },
  { sel: ".resume-split-narrow > div, .resume-split-wide > div", display: "block" },
];

function setPrintLayoutSimulation(stage: HTMLElement, on: boolean) {
  for (const { sel, display } of PRINT_LAYOUT) {
    for (const el of stage.querySelectorAll<HTMLElement>(sel)) {
      if (on) {
        if (el.dataset.printDisp === undefined) {
          el.dataset.printDisp = el.style.getPropertyValue("display");
          el.dataset.printDispPri = el.style.getPropertyPriority("display");
        }
        el.style.setProperty("display", display, "important");
      } else if (el.dataset.printDisp !== undefined) {
        const prev = el.dataset.printDisp;
        const pri = el.dataset.printDispPri ?? "";
        delete el.dataset.printDisp;
        delete el.dataset.printDispPri;
        if (prev) el.style.setProperty("display", prev, pri || undefined);
        else el.style.removeProperty("display");
      }
    }
  }
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
  if (!hasPageGap(el)) return false;
  writePageGap(el, "");
  const top = offsetTopIn(el, stage, scale);
  const height = el.offsetHeight;
  if (!straddlesPage(top, height)) return true;
  reapply();
  return false;
}

/** Page-break pills. Padding/type is larger below `md` so a thumb can hit
 * "move to next page" on the mobile sheet without changing desktop density.
 * No truncate — labels like "Move … to page N" must stay fully readable. */
const PAGE_GUIDE_PILL =
  "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide min-h-9 md:min-h-0 md:px-2 md:py-0.5 md:text-[9px]";

/** Shared Move / Undo control — colors come from CSS vars so the pill can
 * morph accent ↔ burgundy instead of remounting. Both labels stay in the
 * layout (one invisible) so width — and the centered arrow — don't shift. */
function PageSplitControl({
  mode,
  offerLabel,
  undoLabel,
  title,
  ariaLabel,
  onClick,
  arrowAbove,
}: {
  mode: "offer" | "undo";
  offerLabel: string;
  undoLabel: string;
  title: string;
  ariaLabel: string;
  onClick: () => void;
  arrowAbove?: boolean;
}) {
  const label = mode === "offer" ? offerLabel : undoLabel;
  return (
    <div className={`pointer-events-auto relative z-10 shrink-0 page-split-control page-split-control--${mode}`}>
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`page-split-pill hover:brightness-110 ${PAGE_GUIDE_PILL}`}
      >
        <span className="page-split-pill-sizer" aria-hidden="true">
          <span>{offerLabel}</span>
          <span>{undoLabel}</span>
        </span>
        <span key={mode} className="page-split-pill-label">
          {label}
        </span>
      </button>
      {/* Outer shell owns left:50% centering; inner button only bounces on Y
          so a mode change can't interpolate translateX and slide the arrow. */}
      <div
        className={`page-split-arrow-anchor absolute left-1/2 -translate-x-1/2 ${
          arrowAbove ? "bottom-full mb-1" : "top-full mt-1"
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          title={title}
          aria-label={ariaLabel}
          className="page-split-arrow flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white/90 hover:brightness-110"
        >
          <PageSplitArrowIcon
            direction={mode === "undo" ? "up" : "down"}
            className="page-split-arrow-icon h-3 w-3"
          />
        </button>
      </div>
    </div>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  );
}

function PageSplitArrowIcon({ className, direction = "down" }: { className?: string; direction?: "down" | "up" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`${className ?? ""} ${direction === "up" ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M7.25 2.25a.75.75 0 0 1 1.5 0v7.19l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V2.25Z" />
    </svg>
  );
}

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
      for (const el of breakEls) writePageGap(el, "");

      // Push a forced section down to the next A4 paper edge. PAGE_INSET is
      // layered on via `--page-inset` (JS margins only — print must not also
      // clone cell padding-top or it invents a blank trailing sheet).
      for (const el of breakEls) {
        if (el.getAttribute("data-force-break") !== "true") continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const extra = nextPageBoundaryY(top) - top;
        if (extra > 0.5) writePageGap(el, pageGapHeightCss(extra), "break");
        else if (Math.floor(top / PAGE_HEIGHT) >= 1) writePageGap(el, pageGapHeightCss(0), "inset");
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
        if (!hasPageGap(el)) continue;
        const topBefore = offsetTopIn(el, stage!, nextScale);
        const pageBefore = Math.floor(topBefore / PAGE_HEIGHT);
        const packed = packRedundantMargin(el, stage!, nextScale, () => {
          const top = offsetTopIn(el, stage!, nextScale);
          const extra = nextPageBoundaryY(top) - top;
          if (extra > 0.5) writePageGap(el, pageGapHeightCss(extra), "break");
          else if (Math.floor(top / PAGE_HEIGHT) >= 1) writePageGap(el, pageGapHeightCss(0), "inset");
        });
        if (!packed) continue;
        const topAfter = offsetTopIn(el, stage!, nextScale);
        const pageAfter = Math.floor(topAfter / PAGE_HEIGHT);
        if (pageAfter >= pageBefore || pageAfter < 1) {
          const extra = nextPageBoundaryY(topAfter) - topAfter;
          if (extra > 0.5) writePageGap(el, pageGapHeightCss(extra), "break");
          else if (pageAfter >= 1) writePageGap(el, pageGapHeightCss(0), "inset");
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
        // Forced wins over split detection. Require only the attribute —
        // pack may have cleared the page gap this pass, and an item inside a
        // forced section must not also offer "Move …" on the same edge.
        if (el.getAttribute("data-force-break") === "true") {
          if (hasPageGap(el)) nextForced.push({ ...marker, y: top * nextScale });
          continue;
        }
        if (el.closest("[data-force-break='true']")) continue;
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
        if (el.getAttribute("data-force-break") === "true" && hasPageGap(el)) continue;
        if (inRailColumn(el)) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const height = el.offsetHeight;
        if (height < 1 || height >= PAGE_HEIGHT) continue;
        if (!straddlesPage(top, height)) continue;
        const extra = nextPageBoundaryY(top, true) - top;
        if (extra > 0.5) writePageGap(el, pageGapHeightCss(extra), "break");
      }

      // Same pack pass for avoid-break nudges: if a later move freed room on
      // page 2, pull the nudged entry back instead of leaving it on page 3.
      for (const el of [...avoidBreakEls].reverse()) {
        if (el.getAttribute("data-force-break") === "true" && hasPageGap(el)) continue;
        if (inRailColumn(el)) continue;
        packRedundantMargin(el, stage!, nextScale, () => {
          const top = offsetTopIn(el, stage!, nextScale);
          const height = el.offsetHeight;
          if (height < 1 || height >= PAGE_HEIGHT || !straddlesPage(top, height)) return;
          const extra = nextPageBoundaryY(top, true) - top;
          if (extra > 0.5) writePageGap(el, pageGapHeightCss(extra), "break");
        });
      }

      // A section that merely *starts* on a later sheet (previous block ended
      // at the page edge) never straddles and was never forced, so the two
      // loops above leave it flush with the paper. Give it the same inset —
      // including rail columns, where a 32px pad is inside the colored strip,
      // not a hole on page 1.
      for (const el of breakEls) {
        if (hasPageGap(el)) continue;
        const top = offsetTopIn(el, stage!, nextScale);
        const page = Math.floor(top / PAGE_HEIGHT);
        if (page < 1) continue;
        const offset = top - page * PAGE_HEIGHT;
        if (offset >= PAGE_INSET - 0.5) continue;
        writePageGap(el, pageGapHeightCss(0), "inset");
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

      // Only the live (non-print) frame may clear leftover breaks from the
      // store. The export frame shares the same toggles — packing there would
      // silently drop the user's separator before window.print().
      if (!printable && redundantForced.length > 0) {
        for (const marker of redundantForced) {
          if (marker.index === undefined) onToggleSectionBreakRef.current?.(marker.section);
          else onToggleItemBreakRef.current?.(marker.section, marker.index);
        }
      }
    }

    measure("data");
    const observer = new ResizeObserver(() => measure("resize"));
    observer.observe(viewport);

    // Print: park the export viewport on document.body so we can hide every
    // other body child with display:none (no visibility:hidden gap, no
    // absolute #resume-print-root). CSS page breaks on gap spacers then work
    // in the PDF the same way the preview dashed line does.
    let parked: { parent: Node; next: ChildNode | null } | null = null;
    const parkForPrint = () => {
      if (!printable || parked) return;
      parked = { parent: viewport!.parentNode!, next: viewport!.nextSibling };
      document.body.appendChild(viewport!);
      setPrintLayoutSimulation(stage!, true);
      measure("data");
      // Force layout so Chromium's print snapshot sees the updated spacers.
      void viewport!.offsetHeight;
    };
    const unparkAfterPrint = () => {
      if (!printable) return;
      setPrintLayoutSimulation(stage!, false);
      if (parked) {
        parked.parent.insertBefore(viewport!, parked.next);
        parked = null;
      }
      measure("data");
    };
    const onBeforePrint = () => parkForPrint();
    const onAfterPrint = () => unparkAfterPrint();
    const onPreparePrint = () => parkForPrint();
    const onEndPrint = () => unparkAfterPrint();
    if (printable) {
      window.addEventListener("beforeprint", onBeforePrint);
      window.addEventListener("afterprint", onAfterPrint);
      window.addEventListener("resume:prepare-print", onPreparePrint);
      window.addEventListener("resume:end-print", onEndPrint);
    }
    return () => {
      observer.disconnect();
      if (printable) {
        window.removeEventListener("beforeprint", onBeforePrint);
        window.removeEventListener("afterprint", onAfterPrint);
        window.removeEventListener("resume:prepare-print", onPreparePrint);
        window.removeEventListener("resume:end-print", onEndPrint);
        unparkAfterPrint();
      }
    };
  }, [data, printable]);

  // Where a new printed page starts, in on-screen (scaled) pixels — purely
  // informational overlay so someone can see a resume has spilled onto a
  // second page before they ever open the print dialog. Ignore ~2px of
  // stage chrome so a 2-page snap doesn't invent a phantom page-3 guide.
  const pageBreaks: number[] = [];
  for (let i = 1; i * PAGE_HEIGHT < naturalHeight - 2; i++) {
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

  function forcedMarker(f: LineMarker, y: number, atBoundary: boolean, stableId?: string, page = 2) {
    const undoLabel = `"${f.label}" starts a new page — Undo`;
    const offerLabel = `Move “${f.label}” to page ${page}`;
    const text = `"${f.label}" starts a new page`;
    const toggle = toggleFor(f);
    const undoable = Boolean(toggle);
    // On the paper edge, sit on the cut like Move. Only float into the blank
    // gap when the guide is pinned to the section's own top (unpaired).
    const above = !(undoable && atBoundary);
    return {
      // Keep page-N when paired so Move ↔ Undo remounts as the same row and
      // CSS can morph the colors instead of popping a new pill.
      id: stableId ?? `forced-${markerId(f)}-${Math.round(y)}`,
      y,
      above,
      faint: !undoable,
      actionable: false,
      undoable,
      label: undoable ? (
        <PageSplitControl
          mode="undo"
          offerLabel={offerLabel}
          undoLabel={undoLabel}
          title={`${text} — click to undo`}
          ariaLabel={`Undo page break for ${f.label}`}
          onClick={toggle!}
          arrowAbove={!above}
        />
      ) : (
        <span className={`border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] ${PAGE_GUIDE_PILL}`}>
          {text}
        </span>
      ),
    };
  }

  // Forcing a section onto a new page lands it PAGE_INSET below the paper
  // edge, so Undo sits in that gap. Pair it with the boundary marker rather
  // than drawing a second row ~32px down. Also pair when the forced top is
  // slightly *above* the boundary (subpixel / packing) or within a page of
  // it after a large spacer — never leave "Page N" beside Undo.
  const insetScreen = PAGE_INSET * scale;
  const mergePx = Math.max(insetScreen + Math.max(24, insetScreen), PAGE_HEIGHT * scale * 0.15);
  function nearGuide(a: number, b: number) {
    return Math.abs(a - b) <= mergePx;
  }
  function forcedPairsWithBoundary(f: { y: number }, boundaryY: number) {
    // Forced content sits on or just below the paper edge after the spacer.
    return f.y + mergePx >= boundaryY && f.y <= boundaryY + mergePx;
  }

  const pairedForced = new Set<string>();
  const markers = pageBreaks.map((y, i) => {
    const page = i + 2;
    const forcedHere = forced.find((f) => forcedPairsWithBoundary(f, y));
    if (forcedHere) {
      pairedForced.add(markerId(forcedHere));
      return forcedMarker(forcedHere, y, true, `page-${page}`, page);
    }
    const split = splits.find((s) => Math.abs(s.y - y) < 0.5);
    const toggle = split ? toggleFor(split) : null;
    const actionable = Boolean(split && toggle);
    return {
      id: `page-${page}`,
      y,
      // An organic break falls mid-content, so there's no gap to sit in —
      // the row stays centered on the boundary it describes.
      above: false,
      faint: false,
      actionable,
      undoable: false,
      label: actionable ? (
        <PageSplitControl
          mode="offer"
          offerLabel={`Move “${split!.label}” to page ${page}`}
          undoLabel={`"${split!.label}" starts a new page — Undo`}
          title={`Move "${split!.label}" to page ${page}`}
          ariaLabel={`Move ${split!.label} to page ${page}`}
          onClick={toggle!}
        />
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
    if (pairedForced.has(markerId(f))) continue;
    // Drop any page-guide twin in the inset band before adding Undo.
    for (let i = markers.length - 1; i >= 0; i--) {
      if (nearGuide(markers[i].y, f.y) || forcedPairsWithBoundary(f, markers[i].y)) {
        markers.splice(i, 1);
      }
    }
    markers.push(forcedMarker(f, f.y, false));
  }

  // Last pass: collapse any remaining near-duplicates (refresh subpixel
  // noise). Prefer forced, then actionable Move, over a plain "Page N".
  markers.sort((a, b) => a.y - b.y);
  for (let i = markers.length - 1; i > 0; i--) {
    if (!nearGuide(markers[i].y, markers[i - 1].y)) continue;
    const score = (m: (typeof markers)[number]) => (m.undoable ? 2 : m.actionable ? 1 : 0);
    const drop = score(markers[i]) >= score(markers[i - 1]) ? i - 1 : i;
    markers.splice(drop, 1);
  }

  return (
    <div
      ref={viewportRef}
      data-print-viewport={printable ? "true" : undefined}
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
          {markers.map((marker) => {
            const emphasis = marker.actionable ? "offer" : marker.undoable ? "undo" : marker.faint ? "faint" : "plain";
            return (
              <div
                key={marker.id}
                className={`page-split-guide pointer-events-none absolute inset-x-0 ${
                  emphasis === "offer" || emphasis === "undo" ? `z-10 page-split-guide--${emphasis}` : ""
                } ${emphasis === "faint" ? "page-split-guide--faint" : ""} ${
                  emphasis === "plain" ? "page-split-guide--plain" : ""
                }`}
                style={{ top: marker.y }}
              >
                {/* One rule, pinned to the paper edge — never translated with
                    the label, or a forced break drew a twin line in the gap. */}
                <div className="page-split-rule pointer-events-none absolute inset-x-0 top-0 border-t-2 border-dashed" />
                <div
                  className={`page-split-cluster absolute right-0 flex items-center gap-1.5 ${
                    marker.above ? "-translate-y-[calc(100%+2px)]" : "-translate-y-1/2"
                  }`}
                >
                  <span className="flex shrink-0 items-center bg-white px-0.5">
                    <ScissorsIcon className="page-split-scissors h-3.5 w-3.5" />
                  </span>
                  {marker.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

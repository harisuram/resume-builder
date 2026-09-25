"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { getTemplateComponent } from "@/components/templates/registry";
import { getTheme, headerColor, isMultiColumnTemplate, railBackground } from "@/components/templates/shared/theme";
import {
  PAGE_HEIGHT_PX as PAGE_HEIGHT,
  PAGE_INSET_PX as PAGE_INSET,
  PAGE_PAD_Y_PX,
  PAGE_WIDTH_PX as PAGE_WIDTH,
} from "@/lib/page";
import {
  isMultiColumnSurface,
  PRINT_LAYOUT_SIM_CLASS,
  computePageOffsets,
  fragmentRanges,
  setPrintLayoutSimulation,
  settlePageBreaks,
  type SheetRange,
} from "@/lib/pagination";
import type { ResumeData } from "@/lib/types";

/** Screen-only gap between stacked paper sheets (px, after scale). */
const PAGE_STACK_GAP_PX = 16;

/**
 * The single rendering surface shared by the live preview and the export
 * path — never a second export-only copy, so a download can't visually
 * drift from what was previewed. `printable` tags the DOM node the print
 * stylesheet targets; only the export step's instance sets it.
 *
 * On screen, multi-page resumes render as stacked paper sheets. Cuts snap to
 * block boundaries so lines aren’t sliced through the middle. Print still
 * uses one continuous `#resume-print-root` (the measure source).
 *
 * Twin/sidebar keep print-layout-sim on while mounted so preview and PDF
 * share one column model.
 */
export function ResumePreviewFrame({
  data,
  printable = false,
}: {
  data: ResumeData;
  printable?: boolean;
}) {
  const Template = getTemplateComponent(data.templateId);
  const theme = getTheme(data.templateId);
  const sidebarSheet = theme.layout === "sidebar";
  /* Sheets that all hold the same amount of content can be measured against a
     real column-fragmentation pass, because columns are uniform by definition.
     Two column qualifies even though its band sits below the name header
     rather than at the paper edge: the repeating thead costs the same 56px on
     sheet 1 either way. A sidebar does not — its sheet-1 inset is column
     padding the stage already counts as content, so sheet 1 carries more than
     the rest — and keeps the arithmetic model, which tracks its PDFs. */
  const uniformSheets = theme.layout !== "sidebar";
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(0);
  const [pageRanges, setPageRanges] = useState<SheetRange[]>([{ start: 0, end: PAGE_HEIGHT }]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;

    const multiColumn = isMultiColumnSurface(stage);
    if (multiColumn) setPrintLayoutSimulation(stage, true);

    let lastWidth = Number.NaN;

    function syncVisualStages() {
      if (!multiColumn || !stackRef.current) return;
      for (const el of stackRef.current.querySelectorAll<HTMLElement>("[data-page-visual-stage]")) {
        setPrintLayoutSimulation(el, true);
      }
    }

    function measure(reason: "data" | "resize") {
      const containerWidth = viewport!.clientWidth;
      if (reason === "resize" && containerWidth === lastWidth) return;
      lastWidth = containerWidth;
      const nextScale = containerWidth > 0 ? Math.min(containerWidth / PAGE_WIDTH, 1) : 1;

      stage!.style.transform = `scale(${nextScale})`;

      const settled = settlePageBreaks(stage!, nextScale, { printable });
      const extent = settled.guideLimit > 1 ? settled.guideLimit : settled.naturalHeight;
      // Every family holds the same band back at both paper edges of every
      // sheet: a sidebar repeats a table header and footer, everything else
      // clones the print root's padding. Sheet 1 is the exception for a
      // sidebar — its top inset is the template's own column padding, which
      // the stage already measures as content.
      const inset = sidebarSheet ? PAGE_PAD_Y_PX : PAGE_INSET;
      // Every sheet of a block-flow template is the same height, so the
      // browser's own fragmenter can be asked where the cuts fall (columns and
      // pages share one engine). The table families reserve their bands with a
      // repeating thead, which makes sheet 1 taller than the rest and has no
      // equivalent in a column box — they keep the arithmetic model, which
      // already tracks their PDFs.
      const measured = uniformSheets
        ? fragmentRanges(stage!, { pageBudgetPx: PAGE_HEIGHT - inset - inset })
        : null;
      const ranges =
        measured ??
        offsetsToRanges(
          computePageOffsets(stage!, extent, nextScale, inset, inset, sidebarSheet ? 0 : inset),
        );

      setScale((prev) => (prev === settled.scale ? prev : settled.scale));
      setStageHeight((prev) => (Math.abs(prev - settled.stageHeight) < 0.5 ? prev : settled.stageHeight));
      setPageRanges((prev) => (rangesEqual(prev, ranges) ? prev : ranges));
      syncVisualStages();
    }

    measure("data");
    const observer = new ResizeObserver(() => measure("resize"));
    observer.observe(viewport);

    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure("data");
      });
    }

    let parked: { parent: Node; next: ChildNode | null } | null = null;
    const parkForPrint = () => {
      if (!printable || parked) return;
      parked = { parent: viewport!.parentNode!, next: viewport!.nextSibling };
      document.body.appendChild(viewport!);
      setPrintLayoutSimulation(stage!, true);
      measure("data");
      void viewport!.offsetHeight;
    };
    const unparkAfterPrint = () => {
      if (!printable) return;
      if (parked) {
        parked.parent.insertBefore(viewport!, parked.next);
        parked = null;
      }
      if (!multiColumn) setPrintLayoutSimulation(stage!, false);
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
      cancelled = true;
      observer.disconnect();
      if (printable) {
        window.removeEventListener("beforeprint", onBeforePrint);
        window.removeEventListener("afterprint", onAfterPrint);
        window.removeEventListener("resume:prepare-print", onPreparePrint);
        window.removeEventListener("resume:end-print", onEndPrint);
        unparkAfterPrint();
      }
      if (multiColumn) setPrintLayoutSimulation(stage, false);
    };
    // sidebarSheet / uniformSheets are pure functions of data.templateId
    // (already a dep) — listed for exhaustive-deps, not because they can
    // change independently.
  }, [data, printable, sidebarSheet, uniformSheets]);

  const pageCount = Math.max(1, pageRanges.length);
  /* Matches what print holds back at the paper edges: the sidebar's repeating
     table header and footer, or the cloned print-root padding for the
     families that flow continuously. A screen-only pad here instead put an
     inset on the preview that the PDF never had. */
  const edgeInset = sidebarSheet ? PAGE_PAD_Y_PX : PAGE_INSET;
  /* A sidebar's sheet-1 top inset is its own column padding, drawn inside the
     content slice; every other family reserves the band on sheet 1 too. */
  const firstSheetTopBand = sidebarSheet ? 0 : edgeInset;
  /* A single-column colour band (Marquee, Copper) runs up to the paper edge —
     print pulls it into the root padding, so sheet 1's top band takes its
     colour here instead of showing a white strip above it. */
  const firstSheetBandColor = theme.darkHeader && !sidebarSheet ? headerColor(theme) : undefined;
  const railFill = sidebarRailFill(theme, scale);
  const stackHeight =
    pageCount < 1
      ? stageHeight
      : Array.from({ length: pageCount }, (_, i) => {
          const { start, end } = pageRanges[i] ?? { start: 0, end: PAGE_HEIGHT };
          const contentH = Math.max(end - start, 1);
          if (sidebarSheet) {
            // Top/bottom chrome bands only — never nest the slice in a full
            // PAGE_HEIGHT paper window. That double-counted the top inset on
            // page 2+ (band + leftover inside the paper) and left a large
            // empty gap under the content.
            const topInset = i > 0 ? edgeInset : firstSheetTopBand;
            const contentScreenH = Math.max(
              0,
              Math.floor(Math.min(contentH, PAGE_HEIGHT - topInset - edgeInset) * scale),
            );
            return Math.max(
              PAGE_HEIGHT * scale,
              contentScreenH + (topInset + edgeInset) * scale,
            );
          }
          return PAGE_HEIGHT * scale;
        }).reduce((a, b) => a + b, 0) +
        Math.max(0, pageCount - 1) * PAGE_STACK_GAP_PX;

  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (!stack || !isMultiColumnTemplate(data.templateId)) return;
    for (const el of stack.querySelectorAll<HTMLElement>("[data-page-visual-stage]")) {
      setPrintLayoutSimulation(el, true);
    }
  }, [data.templateId, pageCount, scale, pageRanges]);

  return (
    <div
      ref={viewportRef}
      data-print-viewport={printable ? "true" : undefined}
      className="resume-scale-viewport relative mx-auto w-full"
      style={{ maxWidth: PAGE_WIDTH, height: stackHeight || stageHeight || undefined }}
    >
      <div
        ref={stageRef}
        className="resume-scale-stage resume-print-source absolute left-0 top-0 -z-10 origin-top-left opacity-0"
        style={{
          width: PAGE_WIDTH,
          transform: `scale(${scale})`,
          ["--page-inset" as string]: `${PAGE_INSET}px`,
          ["--resume-page-inset" as string]: `${PAGE_INSET}px`,
        }}
        aria-hidden="true"
      >
        <div id={printable ? "resume-print-root" : undefined}>
          {/* eslint-disable-next-line react-hooks/static-components -- stable registry lookup */}
          <Template data={data} />
        </div>
      </div>

      <div
        ref={stackRef}
        className="no-print resume-page-stack flex w-full flex-col"
        style={{ gap: PAGE_STACK_GAP_PX }}
      >
        {Array.from({ length: pageCount }, (_, i) => {
          const { start, end } = pageRanges[i] ?? { start: 0, end: PAGE_HEIGHT };
          const contentH = Math.max(end - start, 1);
          // Sidebar: explicit top/bottom chrome bands matching print thead/tfoot.
          // Do not wrap the slice in a full PAGE_HEIGHT window — that left
          // (top+bottom) leftover under the content *on top of* the top band.
          const topInset = i > 0 ? edgeInset : firstSheetTopBand;
          const topBand = topInset * scale;
          const bottomBand = edgeInset * scale;
          // Never taller than the paper left between the bands. Two cuts are
          // the tops of consecutive sheets' first lines, and the gap between
          // them includes a block margin that print drops at the break — so the
          // span can read wider than the sheet, squeeze the bottom band, and
          // slice the last line in half. Floor the crop too, so a sub-pixel of
          // the next line can’t paint through the overflow edge.
          const contentScreenH = Math.max(
            0,
            Math.floor(Math.min(contentH, PAGE_HEIGHT - topInset - edgeInset) * scale),
          );
          const sheetScreenH = sidebarSheet
            ? Math.max(PAGE_HEIGHT * scale, contentScreenH + topBand + bottomBand)
            : PAGE_HEIGHT * scale;
          return (
            <div
              key={`sheet-${i}-${Math.round(start)}`}
              className="resume-page-sheet relative box-border w-full overflow-hidden rounded-sm border border-[var(--color-border)] shadow-card"
              style={{ height: sheetScreenH, backgroundColor: "#ffffff" }}
              data-page-sheet={i + 1}
            >
              {railFill ? (
                <div
                  aria-hidden
                  data-rail-fill="true"
                  className="pointer-events-none absolute inset-0"
                  style={railFill}
                />
              ) : null}
              <div className="relative z-[1] flex h-full w-full flex-col">
                {topBand > 0 ? (
                  <div
                    aria-hidden
                    data-page-top-band="true"
                    style={{
                      height: topBand,
                      flexShrink: 0,
                      backgroundColor: i === 0 ? firstSheetBandColor : undefined,
                    }}
                  />
                ) : null}
                <div className="relative w-full overflow-hidden" style={{ height: contentScreenH }}>
                  <div
                    data-page-visual-stage="true"
                    className={`resume-scale-stage origin-top-left ${
                      isMultiColumnTemplate(data.templateId) ? PRINT_LAYOUT_SIM_CLASS : ""
                    }`}
                    style={{
                      width: PAGE_WIDTH,
                      transform: `scale(${scale}) translateY(${-start}px)`,
                      ["--page-inset" as string]: `${PAGE_INSET}px`,
                      ["--resume-page-inset" as string]: `${PAGE_INSET}px`,
                    }}
                  >
                    {/* eslint-disable-next-line react-hooks/static-components -- stable registry lookup */}
                    <Template data={data} />
                  </div>
                </div>
                {bottomBand > 0 ? (
                  <div aria-hidden data-page-bottom-band="true" style={{ height: bottomBand, flexShrink: 0 }} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Edge-to-edge rail paint for stacked preview sheets (34% strip). The host
 * div also carries Tailwind's `inset-0` (top/right/bottom/left all 0) so the
 * band region is covered edge-to-edge; with an explicit width, leaving the
 * *other* horizontal side at its class value of 0 over-constrains the box
 * and the UA drops `right` in favor of `left` — a right rail would silently
 * paint on the left. Both sides need an explicit value here.
 *
 * Width is a resolved px number, not "34%": the real column is 34% of the
 * *unscaled* page-width template, shrunk by the `transform: scale()` on the
 * cropped stage. This div sits outside that transform, so "34%" of its own
 * (already-shrunk) box rounds to a different sub-pixel edge than the scaled
 * column does — visible as the rail looking a hair wider right at the
 * padding band, where this fill is all that's on screen. `PAGE_WIDTH * 0.34
 * * scale` mirrors the same scale factor the column's transform applies. */
function sidebarRailFill(theme: ReturnType<typeof getTheme>, scale: number): CSSProperties | null {
  if (theme.layout !== "sidebar") return null;
  const railBg = railBackground(theme);
  const right = theme.sidebarSide === "right";
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return {
    width: PAGE_WIDTH * 0.34 * safeScale,
    left: right ? "auto" : 0,
    right: right ? 0 : "auto",
    top: 0,
    bottom: 0,
    backgroundColor: railBg,
  };
}

/** `computePageOffsets` gives boundaries, where one sheet ends exactly where
 * the next begins. The oracle gives each sheet its own slice, so the fallback
 * is widened to the same shape. */
function offsetsToRanges(offsets: number[]): SheetRange[] {
  const ranges: SheetRange[] = [];
  for (let i = 0; i < offsets.length - 1; i++) {
    ranges.push({ start: offsets[i], end: offsets[i + 1] });
  }
  return ranges.length ? ranges : [{ start: 0, end: PAGE_HEIGHT }];
}

function rangesEqual(a: SheetRange[], b: SheetRange[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i].start - b[i].start) > 0.5) return false;
    if (Math.abs(a[i].end - b[i].end) > 0.5) return false;
  }
  return true;
}

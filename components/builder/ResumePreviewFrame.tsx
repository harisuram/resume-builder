"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { getTemplateComponent } from "@/components/templates/registry";
import { getTheme, tint } from "@/components/templates/shared/theme";
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
  setPrintLayoutSimulation,
  settlePageBreaks,
} from "@/lib/pagination";
import type { ResumeData } from "@/lib/types";

/** Screen-only gap between stacked paper sheets (px, after scale). */
const PAGE_STACK_GAP_PX = 16;
/** Breathing room inside each paper sheet for non-sidebar templates. */
const PAGE_EDGE_PAD_PX = 24;

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(0);
  const [pageOffsets, setPageOffsets] = useState<number[]>([0, PAGE_HEIGHT]);

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
      // A sidebar repeats a band at the top of every printed sheet; page 1
      // clears that much extra flow instead. Pass it so the preview's cuts
      // land where the PDF's do.
      const offsets = computePageOffsets(stage!, extent, nextScale, sidebarSheet ? PAGE_PAD_Y_PX : 0);

      setScale((prev) => (prev === settled.scale ? prev : settled.scale));
      setStageHeight((prev) => (Math.abs(prev - settled.stageHeight) < 0.5 ? prev : settled.stageHeight));
      setPageOffsets((prev) => (offsetsEqual(prev, offsets) ? prev : offsets));
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
    // sidebarSheet is a pure function of data.templateId (already a dep) —
    // listed for exhaustive-deps, not because it can change independently.
  }, [data, printable, sidebarSheet]);

  const pageCount = Math.max(1, pageOffsets.length - 1);
  const edgePad = sidebarSheet ? 0 : PAGE_EDGE_PAD_PX;
  const railFill = sidebarRailFill(theme, scale);
  const stackHeight =
    pageCount < 1
      ? stageHeight
      : Array.from({ length: pageCount }, (_, i) => {
          // Sidebar page 1 gets its 4% top inset from real .resume-col-pad
          // padding baked into the cropped render itself. Page 2+ can't
          // repeat that padding at an internal break, so this band stands
          // in for the same 4% the print thead reserves there.
          const topBand = sidebarSheet && i > 0 ? PAGE_PAD_Y_PX * scale : 0;
          const topPad = sidebarSheet ? 0 : i === 0 ? 0 : edgePad;
          const bottomPad = sidebarSheet ? 0 : edgePad;
          return PAGE_HEIGHT * scale + topBand + topPad + bottomPad;
        }).reduce((a, b) => a + b, 0) +
        Math.max(0, pageCount - 1) * PAGE_STACK_GAP_PX;

  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (!stack || !isMultiColumnTheme(data.templateId)) return;
    for (const el of stack.querySelectorAll<HTMLElement>("[data-page-visual-stage]")) {
      setPrintLayoutSimulation(el, true);
    }
  }, [data.templateId, pageCount, scale, pageOffsets]);

  return (
    <div
      ref={viewportRef}
      data-print-viewport={printable ? "true" : undefined}
      className="resume-scale-viewport relative mx-auto w-full max-w-[760px]"
      style={{ height: stackHeight || stageHeight || undefined }}
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
          const start = pageOffsets[i] ?? 0;
          const end = pageOffsets[i + 1] ?? start + PAGE_HEIGHT;
          const contentH = Math.max(end - start, 1);
          const paperScreenH = PAGE_HEIGHT * scale;
          const contentScreenH = Math.min(contentH, PAGE_HEIGHT) * scale;
          // Never use CSS padding for this synthetic band — padding sits
          // outside absolute rail-fill and paints a white “patch” band.
          // Real 4% padding does render inside the cropped Template itself
          // for page 1 (its true top edge), so only page 2+ needs this.
          const topBand = sidebarSheet && i > 0 ? PAGE_PAD_Y_PX * scale : 0;
          const topPad = sidebarSheet ? 0 : i === 0 ? 0 : edgePad;
          const bottomPad = sidebarSheet ? 0 : edgePad;
          const sheetScreenH = paperScreenH + topBand + topPad + bottomPad;
          return (
            <div
              key={`sheet-${i}-${Math.round(start)}`}
              className="resume-page-sheet relative box-border w-full overflow-hidden rounded-sm border border-[var(--color-border)] shadow-card"
              style={{
                height: sheetScreenH,
                paddingTop: topPad,
                paddingBottom: bottomPad,
                backgroundColor: "#ffffff",
              }}
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
                  <div aria-hidden data-page-top-band="true" style={{ height: topBand, flexShrink: 0 }} />
                ) : null}
                <div className="relative w-full overflow-hidden" style={{ height: paperScreenH }}>
                  <div className="relative w-full overflow-hidden" style={{ height: contentScreenH }}>
                    <div
                      data-page-visual-stage="true"
                      className={`resume-scale-stage origin-top-left ${
                        isMultiColumnTheme(data.templateId) ? PRINT_LAYOUT_SIM_CLASS : ""
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
                </div>
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
 * *unscaled* 760px template, shrunk by the `transform: scale()` on the
 * cropped stage. This div sits outside that transform, so "34%" of its own
 * (already-shrunk) box rounds to a different sub-pixel edge than the scaled
 * column does — visible as the rail looking a hair wider right at the
 * padding band, where this fill is all that's on screen. `PAGE_WIDTH * 0.34
 * * scale` mirrors the same scale factor the column's transform applies. */
function sidebarRailFill(theme: ReturnType<typeof getTheme>, scale: number): CSSProperties | null {
  if (theme.layout !== "sidebar") return null;
  const railBg = theme.sidebarStyle === "solid" ? theme.accent : tint(theme.accent, 8);
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

function isMultiColumnTheme(templateId: string): boolean {
  const layout = getTheme(templateId).layout;
  return layout === "sidebar" || layout === "asymmetric";
}

function offsetsEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 0.5) return false;
  }
  return true;
}

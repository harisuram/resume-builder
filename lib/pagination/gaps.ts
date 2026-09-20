import { PAGE_INSET_PX as PAGE_INSET } from "@/lib/page";

export function getGapSpacer(el: HTMLElement): HTMLElement | null {
  const prev = el.previousElementSibling as HTMLElement | null;
  return prev?.getAttribute("data-page-gap-spacer") === "true" ? prev : null;
}

export function hasPageGap(el: HTMLElement): boolean {
  return Boolean(getGapSpacer(el));
}

/** Concrete px height for a page-gap spacer. Prefer resolved pixels over
 * `calc(... + var(--page-inset))` so print/table layout cannot drop the gap
 * when custom properties fail to resolve on the spacer. */
export function pageGapHeightCss(skipPx: number): string {
  return `${Math.max(0, skipPx) + PAGE_INSET}px`;
}

/** Spacer sibling (not margin/padding on the section):
 * - margin-top collapses at print fragment boundaries → PDF ignored the cut
 * - padding-top kept offsetTop on the old page → Undo + twin guides
 * Preview: a block with height pushes the section to the paper edge.
 * Print: `data-page-gap-kind="break"` becomes a real CSS page break. */
export function writePageGap(el: HTMLElement, value: string, kind: "break" | "inset" = "break") {
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

export function clearAllPageGaps(stage: HTMLElement, breakEls: HTMLElement[]) {
  for (const el of breakEls) writePageGap(el, "");
  for (const el of stage.querySelectorAll<HTMLElement>(".break-inside-avoid")) {
    if (el.hasAttribute("data-item-key") || el.hasAttribute("data-section-key")) continue;
    writePageGap(el, "");
  }
}

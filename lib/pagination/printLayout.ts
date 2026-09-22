/** Print switches sidebar/split columns from flex to table. Spacers sized
 * against the flex preview are too short in the PDF, so content can still
 * start at the bottom of page 1. Force the print display model, remesure,
 * then restore after printing.
 *
 * Do NOT force thead/tfoot (`.resume-*-page-pad*`) on here. On screen,
 * `print-layout-sim` CSS hides them so page-1 measure matches the PDF
 * (print cancels thead with a negative margin; preview uses sheet chrome
 * instead). Inline `display: table-header-group !important` used to win
 * over that hide, shifting every Y by ~4% and cutting Soft Skills a page
 * early. Print re-enables the bands via `@media print` rules that beat
 * the sim hide. */
const PRINT_LAYOUT: { sel: string; display: string; verticalAlign?: string }[] = [
  { sel: ".resume-sidebar-columns, .resume-split-columns", display: "table" },
  { sel: ".resume-sidebar-columns tbody, .resume-split-columns tbody", display: "table-row-group" },
  { sel: ".resume-sidebar-columns tr, .resume-split-columns tr", display: "table-row" },
  {
    sel: ".resume-sidebar-rail, .resume-main-column, .resume-sidebar-pad-rail, .resume-sidebar-pad-main, .resume-split-narrow, .resume-split-wide, .resume-split-pad-narrow, .resume-split-pad-wide",
    display: "table-cell",
    verticalAlign: "top",
  },
  // Match print: block + sibling margin, not flex `gap-5` stacked on top of
  // the sim margin rule (that doubled section spacing and made preview
  // cuts land earlier than the PDF).
  { sel: ".resume-col-pad", display: "block" },
  { sel: ".resume-page-body", display: "block" },
  { sel: ".resume-split-narrow > div, .resume-split-wide > div", display: "block" },
];

/** Class toggled on the scale stage so print gap→margin rules apply during
 * remesure (not only inside @media print). Twin/asymmetric needed this or
 * download breaks landed on different entries than the preview guides. */
export const PRINT_LAYOUT_SIM_CLASS = "print-layout-sim";

export function setPrintLayoutSimulation(stage: HTMLElement, on: boolean) {
  if (on) stage.classList.add(PRINT_LAYOUT_SIM_CLASS);
  else stage.classList.remove(PRINT_LAYOUT_SIM_CLASS);

  for (const { sel, display, verticalAlign } of PRINT_LAYOUT) {
    for (const el of stage.querySelectorAll<HTMLElement>(sel)) {
      if (on) {
        if (el.dataset.printDisp === undefined) {
          el.dataset.printDisp = el.style.getPropertyValue("display");
          el.dataset.printDispPri = el.style.getPropertyPriority("display");
        }
        el.style.setProperty("display", display, "important");
        if (verticalAlign) {
          if (el.dataset.printVAlign === undefined) {
            el.dataset.printVAlign = el.style.getPropertyValue("vertical-align");
            el.dataset.printVAlignPri = el.style.getPropertyPriority("vertical-align");
          }
          el.style.setProperty("vertical-align", verticalAlign, "important");
        }
      } else if (el.dataset.printDisp !== undefined) {
        const prev = el.dataset.printDisp;
        const pri = el.dataset.printDispPri ?? "";
        delete el.dataset.printDisp;
        delete el.dataset.printDispPri;
        if (prev) el.style.setProperty("display", prev, pri || undefined);
        else el.style.removeProperty("display");
        if (el.dataset.printVAlign !== undefined) {
          const prevV = el.dataset.printVAlign;
          const priV = el.dataset.printVAlignPri ?? "";
          delete el.dataset.printVAlign;
          delete el.dataset.printVAlignPri;
          if (prevV) el.style.setProperty("vertical-align", prevV, priV || undefined);
          else el.style.removeProperty("vertical-align");
        }
      }
    }
  }
}

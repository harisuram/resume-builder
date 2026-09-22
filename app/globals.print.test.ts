import { readFileSync } from "fs";
import { join } from "path";
import { PAGE_WIDTH_PX } from "@/lib/page";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const PRINT_AT = css.indexOf("@media print {");
const screenBlock = css.slice(0, PRINT_AT);
const printBlock = css.slice(PRINT_AT);

describe("print stylesheet", () => {
  it("keeps the CSS --resume-page-width token in sync with PAGE_WIDTH_PX", () => {
    expect(PAGE_WIDTH_PX).toBe(794);
    expect(screenBlock).toContain(`--resume-page-width: ${PAGE_WIDTH_PX}px`);
  });

  it("pins the preview stage to the A4 design width instead of 100%", () => {
    // `width: 100%` collapsed to 0px in print because the visibility trick
    // zeroed the flex ancestors, which produced a blank PDF.
    expect(printBlock).toContain("width: var(--resume-page-width) !important");
    expect(screenBlock).toContain("--resume-page-width: 794px");
    expect(printBlock).not.toMatch(/\.resume-scale-stage\s*\{[^}]*width:\s*100%/);
  });

  it("zeroes @page margin so the browser cannot stamp date, title, or URL", () => {
    const pageBlock = css.slice(css.indexOf("@page"), PRINT_AT);
    expect(pageBlock).toMatch(/margin:\s*0;/);
    expect(pageBlock).not.toMatch(/margin:\s*12mm/);
    expect(pageBlock).toContain("content: none");
  });

  it("does not pad the print root — that leftover 12mm was a blank band at the top of the PDF", () => {
    const printRoot = css.slice(css.indexOf("#resume-print-root {"));
    expect(printRoot).toMatch(/padding:\s*0;/);
    expect(printRoot).not.toMatch(/padding:\s*12mm/);
  });

  it("unclips html/body and the builder overflow wrappers so the resume can paint", () => {
    expect(printBlock).toContain("overflow: visible !important");
    expect(printBlock).toContain(".print-unclip");
    expect(printBlock).toMatch(/html,\s*body\s*\{[^}]*height:\s*auto !important/);
  });

  it("cancels enter animations so Chromium cannot print the resume at opacity 0", () => {
    expect(printBlock).toMatch(/body \*\s*\{[^}]*animation:\s*none !important/);
    expect(printBlock).toMatch(/\.print-unclip\s*\{[^}]*opacity:\s*1 !important/);
  });

  it("gives sidebar templates a full A4 min-height so the rail paints to the bottom of the page", () => {
    expect(css).toMatch(/\.resume-sidebar-page\s*\{[^}]*min-height:\s*297mm/);
    expect(printBlock).toContain("min-height: 297mm");
  });

  it("paints the sidebar rail full-bleed via ::before on screen and gradient in print", () => {
    expect(screenBlock).toContain(".resume-sidebar-page::before");
    expect(printBlock).toContain("background-size: var(--resume-page-width) 100%");
    expect(printBlock).toContain("box-decoration-break: clone");
    expect(printBlock).toContain(".resume-split-page-pad");
    expect(printBlock).toContain(".resume-page-body");
    expect(printBlock).not.toContain(".resume-sidebar-print-fill");
    // The leftover last-page rail is a fixed strip repeated per sheet, but
    // its geometry must never be a percentage: a fixed box resolves
    // percentages against the sheet, which is wider than the print root
    // when they diverge, and paints a rail wider than the 34% column beneath it. Width
    // and left come from inline px in SidebarLayout instead.
    const railFillBlock = printBlock.slice(printBlock.indexOf(".resume-rail-print-fill {"));
    const railFillRules = railFillBlock.slice(0, railFillBlock.indexOf("}"));
    expect(railFillRules).toContain("position: fixed");
    expect(railFillRules).not.toMatch(/width:\s*\d+%/);
    expect(railFillRules).not.toMatch(/left:\s*\d+%/);
    const columnsBlock = printBlock.slice(printBlock.indexOf(".resume-sidebar-columns {"));
    expect(columnsBlock).toContain("background: none !important");
    expect(columnsBlock).toMatch(/height:\s*auto !important/);
    expect(columnsBlock).not.toMatch(/height:\s*100% !important/);
  });

  it("repeats sidebar top and bottom inset bands on every printed sheet", () => {
    expect(printBlock).toContain(".resume-sidebar-page-pad");
    expect(printBlock).toContain("table-header-group");
    expect(printBlock).toContain(".resume-sidebar-page-pad-foot");
    expect(printBlock).toContain("table-footer-group");
    // Sim hides these on screen; print must re-enable while prepare-print
    // still has print-layout-sim on the stage.
    expect(printBlock).toContain(
      ".resume-scale-stage.print-layout-sim .resume-sidebar-page-pad",
    );
    expect(printBlock).toContain(
      ".resume-scale-stage.print-layout-sim .resume-sidebar-page-pad-foot",
    );
  });

  it("flattens sidebar col-pad to block under print-layout-sim (no flex gap + margin)", () => {
    expect(screenBlock).toContain(".resume-scale-stage.print-layout-sim .resume-col-pad");
    expect(screenBlock).toMatch(
      /\.resume-scale-stage\.print-layout-sim \.resume-col-pad\s*\{[^}]*display:\s*block !important/,
    );
  });

  it("lets two-column templates fragment instead of dragging a whole column", () => {
    expect(printBlock).toContain(".resume-split-narrow > div");
    expect(printBlock).toContain("break-inside: auto");
    expect(printBlock).toContain(".resume-col-pad > * + *");
  });

  it("keeps the sidebar rail painted across every printed sheet", () => {
    expect(screenBlock).toContain(".resume-sidebar-page::before");
    expect(printBlock).toContain("background-size: var(--resume-page-width) 100%");
    expect(printBlock).toContain("background: var(--resume-rail-bg) !important");
  });

  it("lays Twin/asymmetric out as a table on screen so preview matches print breaks", () => {
    expect(screenBlock).toMatch(/\.resume-split-columns\s*\{[^}]*display:\s*table/);
    expect(screenBlock).toMatch(/\.resume-split-narrow\s*,\s*\n\s*\.resume-split-wide\s*\{[^}]*display:\s*table-cell/);
    expect(screenBlock).toContain(".resume-split-narrow > div > * + *");
    expect(screenBlock).toContain(".resume-scale-stage.print-layout-sim .resume-split-pad-narrow");
  });

  it("keeps right-rail sidebars on the right under print-layout-sim (not a second strip)", () => {
    expect(screenBlock).toMatch(
      /\.resume-scale-stage\.print-layout-sim \.resume-sidebar-columns--right\s*\{[^}]*direction:\s*rtl/,
    );
  });

  it("keeps Twin header→columns spacing in print (does not zero split margin-top)", () => {
    const start = printBlock.indexOf(".resume-split-columns {");
    const end = printBlock.indexOf("}", start);
    const rule = printBlock.slice(start, end + 1);
    expect(rule).toContain("display: table !important");
    expect(rule).not.toMatch(/margin-top:\s*0/);
  });

  it("prints natural content flow (no Move/Undo spacer page breaks)", () => {
    expect(printBlock).toContain("body > *:not([data-print-viewport])");
    expect(printBlock).toMatch(/#resume-print-root\s*\{[^}]*position:\s*static/);
    expect(printBlock).not.toMatch(/#resume-print-root\s*\{[^}]*position:\s*absolute/);
    expect(printBlock).toContain("#resume-print-root .break-after-avoid");
    expect(printBlock).toMatch(/break-after:\s*avoid-page/);
    expect(printBlock).toContain("#resume-print-root li");
    expect(printBlock).not.toContain("data-page-gap-spacer");
    expect(printBlock).not.toContain("data-force-break");
  });

  it("prints single-column bodies as blocks so they fragment like the preview", () => {
    expect(printBlock).toMatch(/\.resume-page-body\s*\{[^}]*display:\s*block !important/);
    expect(printBlock).toContain(".resume-dark-header");
    expect(printBlock).toContain('.resume-surface[data-layout="labeled"]');
  });

  it("clones sidebar/split columns as table cells and leaves page-2 inset to JS margins", () => {
    expect(printBlock).toContain("table-header-group");
    expect(printBlock).toContain("table-footer-group");
    expect(printBlock).toContain("border-collapse: collapse");
    // 5% top inset on page 2+ via thead; rail pad painted so it isn’t a white patch.
    expect(printBlock).toContain(".resume-sidebar-pad-rail");
    expect(printBlock).toMatch(/height:\s*var\(--resume-page-inset/);
    expect(printBlock).toMatch(/margin-top:\s*calc\(-1 \* var\(--resume-page-inset/);
    expect(printBlock).toMatch(/\.resume-sidebar-pad-rail\s*\{[^}]*background:\s*var\(--resume-rail-bg\)/);
    expect(printBlock).toMatch(/\.resume-sidebar-rail,\s*\n\s*\.resume-main-column\s*\{[^}]*padding:\s*0 !important/);
    expect(printBlock).toContain(".resume-col-pad");
    expect(printBlock).not.toMatch(/--page-inset:\s*0px/);
  });
});

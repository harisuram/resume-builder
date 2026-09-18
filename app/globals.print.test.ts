import { readFileSync } from "fs";
import { join } from "path";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

describe("print stylesheet", () => {
  it("pins the preview stage to the 760px design width instead of 100%", () => {
    // `width: 100%` collapsed to 0px in print because the visibility trick
    // zeroed the flex ancestors, which produced a blank PDF.
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain("width: 760px !important");
    expect(printBlock).not.toMatch(/\.resume-scale-stage\s*\{[^}]*width:\s*100%/);
  });

  it("zeroes @page margin so the browser cannot stamp date, title, or URL", () => {
    const pageBlock = css.slice(css.indexOf("@page"), css.indexOf("@media print"));
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
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain("overflow: visible !important");
    expect(printBlock).toContain(".print-unclip");
    expect(printBlock).toMatch(/html,\s*body\s*\{[^}]*height:\s*auto !important/);
  });

  it("cancels enter animations so Chromium cannot print the resume at opacity 0", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toMatch(/body \*\s*\{[^}]*animation:\s*none !important/);
    expect(printBlock).toMatch(/\.print-unclip\s*\{[^}]*opacity:\s*1 !important/);
  });

  it("gives sidebar templates a full A4 min-height so the rail paints to the bottom of the page", () => {
    expect(css).toMatch(/\.resume-sidebar-page\s*\{[^}]*min-height:\s*297mm/);
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain("min-height: 297mm");
  });

  it("paints the leftover last-page rail as 34% of the 760px page, not a second overlay", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain("background-size: 760px 100%");
    expect(printBlock).toContain("box-decoration-break: clone");
    expect(printBlock).toContain(".resume-split-page-pad");
    expect(printBlock).toContain(".resume-page-body");
    expect(printBlock).not.toContain(".resume-sidebar-print-fill");
    expect(printBlock).not.toContain("position: fixed");
    const columnsBlock = printBlock.slice(printBlock.indexOf(".resume-sidebar-columns {"));
    expect(columnsBlock).toContain("background: none !important");
    // height:100% + dark header overflowed into a blank third sheet.
    expect(columnsBlock).toMatch(/height:\s*auto !important/);
    expect(columnsBlock).not.toMatch(/height:\s*100% !important/);
  });

  it("lets a forced section inside a two-column template start a page instead of dragging its column", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain(".resume-split-narrow > div");
    expect(printBlock).toContain("break-inside: auto");
    expect(printBlock).toContain(".resume-sidebar-rail > * + *");
    expect(printBlock).toContain('[data-resume-column="rail"] [data-force-break="true"]');
  });

  it("keeps preview-simulated page-separator gaps in the PDF", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    // Print parks the viewport on body and turns break-kind spacers into
    // real CSS page breaks (absolute print root ignored break-before).
    expect(printBlock).toContain('body > *:not([data-print-viewport])');
    expect(printBlock).toMatch(/#resume-print-root\s*\{[^}]*position:\s*static/);
    expect(printBlock).not.toMatch(/#resume-print-root\s*\{[^}]*position:\s*absolute/);
    expect(printBlock).not.toMatch(/\[data-section-key\],\s*\[data-item-key\]\s*\{[^}]*margin-top:\s*0 !important/);
    expect(printBlock).toContain('[data-page-gap-spacer="true"]');
    expect(printBlock).toMatch(/data-page-gap-kind="break"[^{]*\{[^}]*break-after:\s*page/);
    expect(printBlock).toMatch(/\[data-force-break="true"\]\s*\{[^}]*margin-top:\s*0 !important/);
    expect(printBlock).toContain("#resume-print-root .break-inside-avoid");
  });

  it("prints single-column bodies as blocks so they fragment like the preview", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toMatch(/\.resume-page-body\s*\{[^}]*display:\s*block !important/);
    expect(printBlock).toContain(".resume-dark-header");
  });

  it("clones sidebar/split columns as table cells and leaves page-2 inset to JS margins", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain("table-header-group");
    expect(printBlock).toContain("border-collapse: separate");
    expect(printBlock).toContain(".resume-sidebar-pad-rail");
    expect(printBlock).toMatch(/\.resume-sidebar-pad-rail,\s*\n\s*\.resume-sidebar-pad-main\s*\{[^}]*height:\s*0/);
    // Cloning padding-top onto every fragment invented a blank trailing page
    // (gray rail stub) on Inkwell/Pacific downloads — page-2 inset is JS only.
    expect(printBlock).not.toMatch(/\.resume-sidebar-rail,\s*\n\s*\.resume-main-column\s*\{[^}]*padding-top:\s*32px/);
    expect(printBlock).toMatch(/\.resume-sidebar-rail,\s*\n\s*\.resume-main-column\s*\{[^}]*padding-top:\s*0 !important/);
    expect(printBlock).not.toMatch(/--page-inset:\s*0px/);
  });
});

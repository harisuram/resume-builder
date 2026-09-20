import {
  PAGE_HEIGHT_PX,
  PAGE_INSET_PX,
  PAGE_PAD_X_PX,
  PAGE_PAD_Y_PX,
  PAGE_WIDTH_PX,
  contentHeightPx,
  heightForPrintSurface,
  heightToPageMultiple,
  nextPageBoundaryY,
  nextPageContentY,
  pageContentY,
  pageStartMarginCss,
} from "./page";

describe("page geometry", () => {
  it("matches the print root width and the real printable A4 height", () => {
    expect(PAGE_WIDTH_PX).toBe(760);
    // Chrome lays the 760px print root out 1:1 against the page box rather
    // than scaling it to A4 width, so a sheet holds 297mm at 96dpi. Printing
    // position markers down a real print root put the page breaks 1122.5px
    // apart, confirming this over the old `width × (297/210)` (1075).
    expect(PAGE_HEIGHT_PX).toBe(Math.round((297 / 25.4) * 96));
    expect(PAGE_HEIGHT_PX).toBe(1123);
  });

  it("uses 5% top inset on page 2+ and 2%/4% side/bottom content padding", () => {
    expect(PAGE_PAD_X_PX).toBe(Math.round(PAGE_WIDTH_PX * 0.02));
    expect(PAGE_PAD_Y_PX).toBe(Math.round(PAGE_HEIGHT_PX * 0.04));
    expect(PAGE_INSET_PX).toBe(Math.round(PAGE_HEIGHT_PX * 0.05));
    expect(pageContentY(0)).toBe(0);
    expect(pageContentY(1)).toBe(PAGE_HEIGHT_PX + PAGE_INSET_PX);
    expect(nextPageBoundaryY(200)).toBe(PAGE_HEIGHT_PX);
    expect(nextPageContentY(200)).toBe(PAGE_HEIGHT_PX + PAGE_INSET_PX);
    expect(nextPageContentY(PAGE_HEIGHT_PX - 40, true)).toBe(PAGE_HEIGHT_PX + PAGE_INSET_PX);
    expect(pageStartMarginCss(0)).toBe(`var(--page-inset, ${PAGE_INSET_PX}px)`);
    expect(pageStartMarginCss(40)).toBe(`calc(40px + var(--page-inset, ${PAGE_INSET_PX}px))`);
  });

  it("rounds a content height up to a whole number of A4 pages", () => {
    expect(heightToPageMultiple(0)).toBe(PAGE_HEIGHT_PX);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX)).toBe(PAGE_HEIGHT_PX);
    const slack = PAGE_PAD_Y_PX + 16;
    expect(heightToPageMultiple(PAGE_HEIGHT_PX + 1)).toBe(PAGE_HEIGHT_PX);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX + PAGE_PAD_Y_PX)).toBe(PAGE_HEIGHT_PX);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX + slack)).toBe(PAGE_HEIGHT_PX);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX + slack + 1)).toBe(PAGE_HEIGHT_PX * 2);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX * 2 - 1)).toBe(PAGE_HEIGHT_PX * 2);
  });

  it("fits print surfaces to content without rounding up into a blank sheet", () => {
    expect(heightForPrintSurface(0)).toBe(PAGE_HEIGHT_PX);
    expect(heightForPrintSurface(PAGE_HEIGHT_PX + PAGE_PAD_Y_PX)).toBe(PAGE_HEIGHT_PX);
    expect(heightForPrintSurface(PAGE_HEIGHT_PX + 200)).toBe(PAGE_HEIGHT_PX + 200);
    expect(heightForPrintSurface(PAGE_HEIGHT_PX * 2 + 20)).toBe(PAGE_HEIGHT_PX * 2);
  });

  it("prefers the bottom of real sections over a stretched column's scrollHeight", () => {
    document.body.innerHTML = `<div id="page" class="resume-sidebar-page">
      <div class="resume-main-column" style="height: 5000px">
        <section data-section-key="summary" style="position:relative"></section>
      </div>
    </div>`;
    const page = document.getElementById("page")!;
    const main = page.querySelector<HTMLElement>(".resume-main-column")!;
    const summary = page.querySelector<HTMLElement>("[data-section-key='summary']")!;
    Object.defineProperty(page, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX * 3 });
    Object.defineProperty(page, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX * 3 });
    Object.defineProperty(main, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX * 3 });
    Object.defineProperty(main, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX * 3 });
    Object.defineProperty(summary, "offsetTop", { configurable: true, value: 200 });
    Object.defineProperty(summary, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX + 100 });
    Object.defineProperty(summary, "offsetParent", { configurable: true, get: () => main });
    Object.defineProperty(main, "offsetTop", { configurable: true, value: 0 });
    Object.defineProperty(main, "offsetParent", { configurable: true, get: () => page });
    expect(contentHeightPx(page)).toBe(200 + PAGE_HEIGHT_PX + 100 + PAGE_PAD_Y_PX);
    expect(heightToPageMultiple(contentHeightPx(page))).toBe(PAGE_HEIGHT_PX * 2);
  });
});

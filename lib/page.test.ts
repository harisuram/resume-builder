import {
  PAGE_HEIGHT_PX,
  PAGE_INSET_PX,
  PAGE_WIDTH_PX,
  contentHeightPx,
  heightToPageMultiple,
  nextPageBoundaryY,
  nextPageContentY,
  pageContentY,
  pageStartMarginCss,
} from "./page";

describe("page geometry", () => {
  it("matches the print root width and a zero-margin A4 height at 96dpi", () => {
    expect(PAGE_WIDTH_PX).toBe(760);
    expect(PAGE_HEIGHT_PX).toBe(Math.round((297 / 25.4) * 96));
  });

  it("keeps page 1 flush to the template padding and insets later sheets", () => {
    expect(PAGE_INSET_PX).toBe(32);
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
    expect(heightToPageMultiple(PAGE_HEIGHT_PX + 1)).toBe(PAGE_HEIGHT_PX * 2);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX * 2 - 1)).toBe(PAGE_HEIGHT_PX * 2);
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
    // 0 (main) + 200 (summary) + height + 32 padding ≈ one-and-a-bit pages, not 3.
    expect(contentHeightPx(page)).toBe(200 + PAGE_HEIGHT_PX + 100 + 32);
    expect(heightToPageMultiple(contentHeightPx(page))).toBe(PAGE_HEIGHT_PX * 2);
  });
});

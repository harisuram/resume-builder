import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX, contentHeightPx, heightToPageMultiple } from "./page";

describe("page geometry", () => {
  it("matches the print root width and a zero-margin A4 height at 96dpi", () => {
    expect(PAGE_WIDTH_PX).toBe(760);
    expect(PAGE_HEIGHT_PX).toBe(Math.round((297 / 25.4) * 96));
  });

  it("rounds a content height up to a whole number of A4 pages", () => {
    expect(heightToPageMultiple(0)).toBe(PAGE_HEIGHT_PX);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX)).toBe(PAGE_HEIGHT_PX);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX + 1)).toBe(PAGE_HEIGHT_PX * 2);
    expect(heightToPageMultiple(PAGE_HEIGHT_PX * 2 - 1)).toBe(PAGE_HEIGHT_PX * 2);
  });

  it("prefers an overflowing column's height over the surface's clipped offsetHeight", () => {
    document.body.innerHTML = `<div id="page" class="resume-sidebar-page"><div class="resume-main-column"></div></div>`;
    const page = document.getElementById("page")!;
    const main = page.querySelector<HTMLElement>(".resume-main-column")!;
    Object.defineProperty(page, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX });
    Object.defineProperty(page, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX });
    Object.defineProperty(main, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX + 400 });
    Object.defineProperty(main, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX + 400 });
    expect(contentHeightPx(page)).toBe(PAGE_HEIGHT_PX + 400);
    expect(heightToPageMultiple(contentHeightPx(page))).toBe(PAGE_HEIGHT_PX * 2);
  });
});

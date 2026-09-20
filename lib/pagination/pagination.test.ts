import { pageGapHeightCss, writePageGap, getGapSpacer, hasPageGap } from "./gaps";
import { straddlesPage, inRailColumn } from "./geometry";
import { promoteFirstEntryOffer } from "./markers";
import { avoidOrphanSectionTitle, avoidSplitBlocks, computePageOffsets } from "./orphans";
import { PRINT_LAYOUT_SIM_CLASS, setPrintLayoutSimulation } from "./printLayout";
import { isMultiColumnSurface } from "./surface";
import { PAGE_HEIGHT_PX, PAGE_INSET_PX, PAGE_PAD_Y_PX } from "@/lib/page";

describe("pagination gaps", () => {
  it("pageGapHeightCss adds the page inset in concrete pixels", () => {
    expect(pageGapHeightCss(100)).toBe(`${100 + PAGE_INSET_PX}px`);
    expect(pageGapHeightCss(0)).toBe(`${PAGE_INSET_PX}px`);
  });

  it("writePageGap inserts a break spacer sibling and clears it", () => {
    const parent = document.createElement("div");
    const el = document.createElement("section");
    parent.appendChild(el);
    writePageGap(el, pageGapHeightCss(40), "break");
    expect(hasPageGap(el)).toBe(true);
    expect(getGapSpacer(el)).toHaveAttribute("data-page-gap-kind", "break");
    writePageGap(el, "");
    expect(hasPageGap(el)).toBe(false);
  });
});

describe("pagination geometry", () => {
  it("straddlesPage detects a block that crosses a paper edge", () => {
    expect(straddlesPage(PAGE_HEIGHT_PX - 20, 40)).toBe(true);
    expect(straddlesPage(100, 40)).toBe(false);
  });

  it("inRailColumn detects rail descendants", () => {
    const rail = document.createElement("div");
    rail.setAttribute("data-resume-column", "rail");
    const child = document.createElement("section");
    rail.appendChild(child);
    document.body.appendChild(rail);
    expect(inRailColumn(child)).toBe(true);
    rail.remove();
  });
});

describe("multi-column surface detection", () => {
  it("detects sidebar and asymmetric page roots", () => {
    const stage = document.createElement("div");
    expect(isMultiColumnSurface(stage)).toBe(false);
    const page = document.createElement("div");
    page.className = "resume-sidebar-page";
    stage.appendChild(page);
    expect(isMultiColumnSurface(stage)).toBe(true);
  });
});

describe("print layout simulation", () => {
  it("forces Twin split columns to table display and tags the stage", () => {
    const stage = document.createElement("div");
    stage.className = "resume-scale-stage";
    const columns = document.createElement("table");
    columns.className = "resume-split-columns";
    const narrow = document.createElement("td");
    narrow.className = "resume-split-narrow";
    columns.appendChild(narrow);
    stage.appendChild(columns);
    document.body.appendChild(stage);

    setPrintLayoutSimulation(stage, true);
    expect(stage.classList.contains(PRINT_LAYOUT_SIM_CLASS)).toBe(true);
    expect(columns.style.getPropertyValue("display")).toBe("table");
    expect(narrow.style.getPropertyValue("display")).toBe("table-cell");

    setPrintLayoutSimulation(stage, false);
    expect(stage.classList.contains(PRINT_LAYOUT_SIM_CLASS)).toBe(false);
    expect(columns.style.getPropertyValue("display")).toBe("");
    stage.remove();
  });
});

describe("page height vs print box", () => {
  it("uses the real printable height so preview cuts land where the PDF breaks", () => {
    // Measured, not assumed: position markers printed down a real print
    // root landed 1122.5px apart. Chrome lays the 760px root out 1:1
    // against the page box rather than scaling it to A4 width, so a sheet
    // holds 297mm at 96dpi. The old `width × (297/210)` was ~48px short
    // per page, which compounded until preview and PDF disagreed.
    expect(PAGE_HEIGHT_PX).toBe(Math.round((297 / 25.4) * 96));
    expect(PAGE_HEIGHT_PX).not.toBe(Math.round(760 * (297 / 210)));
  });
});

describe("orphan section titles", () => {
  function stubBox(el: HTMLElement, top: number, height: number) {
    Object.defineProperty(el, "offsetHeight", { configurable: true, value: height });
    Object.defineProperty(el, "offsetTop", { configurable: true, value: top });
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        height,
        width: 100,
        left: 0,
        right: 100,
        x: 0,
        y: top,
        toJSON() {},
      }) as DOMRect;
  }

  function makeStage() {
    const stage = document.createElement("div");
    stubBox(stage, 0, PAGE_HEIGHT_PX * 2);
    stage.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: PAGE_HEIGHT_PX * 2,
        height: PAGE_HEIGHT_PX * 2,
        width: 760,
        left: 0,
        right: 760,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    return stage;
  }

  it("pulls a title only when it sits near the page edge", () => {
    const stage = makeStage();
    const main = document.createElement("td");
    main.setAttribute("data-resume-column", "main");
    const section = document.createElement("section");
    section.setAttribute("data-section-key", "projects");
    const heading = document.createElement("h3");
    heading.className = "break-after-avoid";
    section.appendChild(heading);
    section.appendChild(document.createElement("div"));
    main.appendChild(section);
    stage.appendChild(main);

    const titleTop = PAGE_HEIGHT_PX - 40;
    stubBox(section, titleTop, 400);
    stubBox(heading, titleTop, 24);

    expect(avoidOrphanSectionTitle(stage, PAGE_HEIGHT_PX, 1)).toBe(titleTop);
    expect(computePageOffsets(stage, PAGE_HEIGHT_PX * 2 + 80, 1)[1]).toBe(titleTop);
    stage.remove();
  });

  it("does not pull a mid-page section start (avoids stub first sheets)", () => {
    const stage = makeStage();
    const main = document.createElement("td");
    main.setAttribute("data-resume-column", "main");
    const section = document.createElement("section");
    section.setAttribute("data-section-key", "experience");
    const heading = document.createElement("h3");
    heading.className = "break-after-avoid";
    section.appendChild(heading);
    section.appendChild(document.createElement("div"));
    main.appendChild(section);
    stage.appendChild(main);

    const titleTop = PAGE_HEIGHT_PX - 400;
    stubBox(section, titleTop, 800);
    stubBox(heading, titleTop, 24);

    expect(avoidOrphanSectionTitle(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
    expect(computePageOffsets(stage, PAGE_HEIGHT_PX * 2 + 80, 1)[1]).toBe(PAGE_HEIGHT_PX);
    stage.remove();
  });

  it("also pulls a straddling sidebar rail title near the edge", () => {
    const stage = makeStage();
    const rail = document.createElement("td");
    rail.setAttribute("data-resume-column", "rail");
    const section = document.createElement("section");
    section.setAttribute("data-section-key", "skills");
    const heading = document.createElement("h3");
    heading.className = "break-after-avoid";
    section.appendChild(heading);
    section.appendChild(document.createElement("div"));
    rail.appendChild(section);
    stage.appendChild(rail);

    const titleTop = PAGE_HEIGHT_PX - 30;
    stubBox(section, titleTop, 200);
    stubBox(heading, titleTop, 20);

    expect(avoidOrphanSectionTitle(stage, PAGE_HEIGHT_PX, 1)).toBe(titleTop);
    stage.remove();
  });

  it("leaves a straddling bullet to split, the way print does", () => {
    const stage = makeStage();
    const li = document.createElement("li");
    stage.appendChild(li);
    stubBox(li, PAGE_HEIGHT_PX - 50, 80);

    // `@media print` resets `break-inside` to `auto` on li/p, so Chromium
    // splits them and fills the sheet. Pulling the cut back to the bullet's
    // top is what showed a blank band the PDF never had.
    expect(avoidSplitBlocks(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
    stage.remove();
  });

  it("leaves a straddling experience card to split, the way print does", () => {
    const stage = makeStage();
    const card = document.createElement("div");
    card.setAttribute("data-item-key", "experience:0");
    stage.appendChild(card);
    const cardTop = PAGE_HEIGHT_PX - 90;
    stubBox(card, cardTop, 280);

    // Experience/project entries are fragmentable so a tall role+bullets
    // block fills the sheet instead of jumping whole to the next page.
    expect(avoidSplitBlocks(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
    stage.remove();
  });

  it("moves the cut off an education card, which print keeps whole", () => {
    const stage = makeStage();
    const card = document.createElement("div");
    card.className = "break-inside-avoid";
    card.setAttribute("data-item-key", "education:0");
    stage.appendChild(card);
    const cardTop = PAGE_HEIGHT_PX - 90;
    stubBox(card, cardTop, 280);

    expect(avoidSplitBlocks(stage, PAGE_HEIGHT_PX, 1)).toBe(cardTop);
    stage.remove();
  });

  it("budgets a sidebar's repeating top band: page 1 clears it, later sheets lose it", () => {
    const stage = makeStage();
    const end = PAGE_HEIGHT_PX * 2 + 80;
    const flat = computePageOffsets(stage, end, 1);
    expect(flat[1]).toBe(PAGE_HEIGHT_PX);
    // The columns table is pulled up by the band it cancels on page 1, so
    // page 1 clears that much extra; every later sheet loses it off the top.
    const budgeted = computePageOffsets(stage, end, 1, PAGE_PAD_Y_PX);
    expect(budgeted[1]).toBe(PAGE_HEIGHT_PX + PAGE_PAD_Y_PX);
    expect(budgeted[2]).toBe(PAGE_HEIGHT_PX * 2);
  });

  it("does not snap a tall block that starts far above the cut", () => {
    const stage = makeStage();
    const li = document.createElement("li");
    stage.appendChild(li);
    stubBox(li, PAGE_HEIGHT_PX - 400, 500);

    expect(avoidSplitBlocks(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
    stage.remove();
  });

});

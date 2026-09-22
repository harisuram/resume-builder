import { pageGapHeightCss, writePageGap, getGapSpacer, hasPageGap } from "./gaps";
import { straddlesPage, inRailColumn } from "./geometry";
import { promoteFirstEntryOffer } from "./markers";
import { avoidOrphanSectionTitle, avoidSplitBlocks, computePageOffsets, snapToLineBoundary } from "./orphans";
import { PRINT_LAYOUT_SIM_CLASS, setPrintLayoutSimulation } from "./printLayout";
import { isMultiColumnSurface } from "./surface";
import { PAGE_HEIGHT_PX, PAGE_INSET_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";

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

  it("does not force sidebar thead/tfoot on — screen sim CSS hides them", () => {
    const stage = document.createElement("div");
    stage.className = "resume-scale-stage";
    const columns = document.createElement("table");
    columns.className = "resume-sidebar-columns";
    const head = document.createElement("thead");
    head.className = "resume-sidebar-page-pad";
    const foot = document.createElement("tfoot");
    foot.className = "resume-sidebar-page-pad-foot";
    const pad = document.createElement("div");
    pad.className = "resume-col-pad";
    columns.appendChild(head);
    columns.appendChild(foot);
    stage.appendChild(columns);
    stage.appendChild(pad);
    document.body.appendChild(stage);

    setPrintLayoutSimulation(stage, true);
    // Leave display to CSS (none on screen, table-* in @media print).
    expect(head.style.getPropertyValue("display")).toBe("");
    expect(foot.style.getPropertyValue("display")).toBe("");
    expect(pad.style.getPropertyValue("display")).toBe("block");
    stage.remove();
  });
});

describe("page height vs print box", () => {
  it("uses the real printable height so preview cuts land where the PDF breaks", () => {
    // Measured, not assumed: position markers printed down a real print
    // root landed 1122.5px apart. Width and height are both A4 @ 96dpi so
    // the print root fills the page box 1:1 (no leftover sheet width that
    // used to make PDF lines wrap differently from the preview).
    expect(PAGE_HEIGHT_PX).toBe(Math.round((297 / 25.4) * 96));
    expect(PAGE_WIDTH_PX).toBe(Math.round((210 / 25.4) * 96));
    expect(PAGE_HEIGHT_PX).toBe(Math.round(PAGE_WIDTH_PX * (297 / 210)));
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
        width: PAGE_WIDTH_PX,
        left: 0,
        right: PAGE_WIDTH_PX,
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

  it("does not pull a sidebar rail title — rail and main share one cut", () => {
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

    // Pulling for the rail opened a hole in the main column and made Soft
    // Skills (etc.) jump a page earlier than the PDF.
    expect(avoidOrphanSectionTitle(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
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

  /** jsdom has no line boxes, so stand in for `Range.getClientRects()`.
   * Keyed by the text node's parent element. */
  function stubLineBoxes(lines: Map<HTMLElement, { top: number; height: number }>) {
    const real = document.createRange.bind(document);
    document.createRange = () => {
      let owner: HTMLElement | null = null;
      return {
        selectNodeContents(node: Node) {
          owner = node.parentElement;
        },
        selectNode(node: Node) {
          owner = node.parentElement;
        },
        getClientRects() {
          const box = owner ? lines.get(owner) : undefined;
          if (!box) return [];
          return [{ top: box.top, bottom: box.top + box.height, height: box.height } as DOMRect];
        },
      } as unknown as Range;
    };
    return () => {
      document.createRange = real;
    };
  }

  /** Section shaped like the one that exposed the preview/PDF disagreement:
   * PART-TIME WORK, then an Account Manager card far taller than the space
   * left on the sheet. */
  function makeHeadedSection({ headingTop, entryTop, entryH, unbreakable = false }: {
    headingTop: number;
    entryTop: number;
    entryH: number;
    unbreakable?: boolean;
  }) {
    const stage = makeStage();
    const main = document.createElement("td");
    main.setAttribute("data-resume-column", "main");
    const section = document.createElement("section");
    section.setAttribute("data-section-key", "partTime");
    const heading = document.createElement("div");
    heading.className = "break-after-avoid";
    const body = document.createElement("div");
    const entry = document.createElement("div");
    entry.setAttribute("data-item-key", "partTime:0");
    if (unbreakable) entry.classList.add("break-inside-avoid");
    const role = document.createElement("p");
    role.textContent = "Account Manager";
    entry.appendChild(role);
    body.appendChild(entry);
    section.appendChild(heading);
    section.appendChild(body);
    main.appendChild(section);
    stage.appendChild(main);

    stubBox(section, headingTop, 22 + entryH);
    stubBox(heading, headingTop, 22);
    stubBox(entry, entryTop, entryH);
    return { stage, role };
  }

  it("keeps a heading whose first entry can split — print only holds one line", () => {
    const y = PAGE_HEIGHT_PX;
    const { stage, role } = makeHeadedSection({
      headingTop: y - 61,
      entryTop: y - 31,
      entryH: 300,
    });
    // The role line clears the cut, so print leaves the title where it is and
    // splits the card. Requiring the whole 300px entry to fit is what pushed
    // PART-TIME WORK to the next sheet in the preview only.
    const restore = stubLineBoxes(new Map([[role, { top: y - 31, height: 20 }]]));
    try {
      expect(avoidOrphanSectionTitle(stage, y, 1)).toBe(y);
    } finally {
      restore();
      stage.remove();
    }
  });

  it("moves a heading when not even one line of the entry clears the cut", () => {
    const y = PAGE_HEIGHT_PX;
    const headingTop = y - 61;
    const { stage, role } = makeHeadedSection({ headingTop, entryTop: y - 5, entryH: 300 });
    // First line starts below the cut: print has nothing to keep with the
    // title, so `break-after: avoid-page` pushes the heading down too.
    const restore = stubLineBoxes(new Map([[role, { top: y - 5, height: 20 }]]));
    try {
      expect(avoidOrphanSectionTitle(stage, y, 1)).toBe(headingTop);
    } finally {
      restore();
      stage.remove();
    }
  });

  it("moves a heading whose first entry print refuses to split", () => {
    const y = PAGE_HEIGHT_PX;
    const headingTop = y - 61;
    const { stage } = makeHeadedSection({
      headingTop,
      entryTop: y - 31,
      entryH: 300,
      unbreakable: true,
    });
    // An education/certification card keeps `break-inside-avoid`, so print
    // moves it whole and the title has to travel with it.
    expect(avoidOrphanSectionTitle(stage, y, 1)).toBe(headingTop);
    stage.remove();
  });

  it("budgets a sidebar's repeating top and bottom bands", () => {
    const stage = makeStage();
    const end = PAGE_HEIGHT_PX * 2 + 80;
    const flat = computePageOffsets(stage, end, 1);
    expect(flat[1]).toBe(PAGE_HEIGHT_PX);
    // Page 1: thead hidden in measure / cancelled in print → only tfoot
    // reserved. Later sheets lose both top and bottom bands.
    const budgeted = computePageOffsets(stage, end, 1, PAGE_PAD_Y_PX, PAGE_PAD_Y_PX);
    expect(budgeted[1]).toBe(PAGE_HEIGHT_PX - PAGE_PAD_Y_PX);
    expect(budgeted[2]).toBe(
      PAGE_HEIGHT_PX - PAGE_PAD_Y_PX + (PAGE_HEIGHT_PX - 2 * PAGE_PAD_Y_PX),
    );
  });

  it("does not snap a tall block that starts far above the cut", () => {
    const stage = makeStage();
    const li = document.createElement("li");
    stage.appendChild(li);
    stubBox(li, PAGE_HEIGHT_PX - 400, 500);

    expect(avoidSplitBlocks(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
    stage.remove();
  });

  it("snaps a cut that runs through a line box up to that line's top", () => {
    const stage = makeStage();
    const p = document.createElement("p");
    p.textContent = "Accountant werwerwgrerg";
    stage.appendChild(p);
    const lineTop = PAGE_HEIGHT_PX - 40;
    const lineH = 16;
    stubBox(p, lineTop, lineH);
    p.getClientRects = () =>
      [
        {
          top: lineTop,
          bottom: lineTop + lineH,
          height: lineH,
          width: 200,
          left: 0,
          right: 200,
          x: 0,
          y: lineTop,
          toJSON() {},
        },
      ] as unknown as DOMRectList;

    const cut = lineTop + lineH / 2;
    expect(snapToLineBoundary(stage, cut, 1)).toBe(lineTop);
    stage.remove();
  });

  it("does not snap to the top of a multi-line block from element rects", () => {
    const stage = makeStage();
    const li = document.createElement("li");
    li.textContent = "long bullet ".repeat(40);
    stage.appendChild(li);
    const blockTop = PAGE_HEIGHT_PX - 120;
    const blockH = 100;
    stubBox(li, blockTop, blockH);
    // One tall client rect spanning the whole bullet — must NOT pull the cut.
    li.getClientRects = () =>
      [
        {
          top: blockTop,
          bottom: blockTop + blockH,
          height: blockH,
          width: 200,
          left: 0,
          right: 200,
          x: 0,
          y: blockTop,
          toJSON() {},
        },
      ] as unknown as DOMRectList;

    const cut = PAGE_HEIGHT_PX - 30;
    expect(snapToLineBoundary(stage, cut, 1)).toBe(Math.floor(cut));
    stage.remove();
  });

});

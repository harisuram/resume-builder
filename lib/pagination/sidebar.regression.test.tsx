/**
 * Conversation regression: sidebar preview contracts that kept breaking
 * when one fix undid another.
 *
 * 1. Rails are full-bleed (no white “patch” bands around the rail)
 * 2. Page 1 content has a 4% top inset (column padding); every sheet gets
 *    a 4% bottom chrome band; page 2+ also get a 4% top band (rail fill
 *    covers both)
 * 3. No invented trailing blank sheets from height snap / stub cuts
 * 4. Side/bottom content padding is even (same px on rail + main)
 * 5. Left and right sidebars mirror the same rules — rail fill, pad cells,
 *    and orphan-title detection all flip with `sidebarSide`
 */
import { render } from "@testing-library/react";
import { PAGE_HEIGHT_PX, PAGE_PAD_X_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { avoidOrphanSectionTitle, computePageOffsets } from "@/lib/pagination/orphans";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { ResumePreviewFrame } from "@/components/builder/ResumePreviewFrame";
import { SidebarLayout } from "@/components/templates/layouts/SidebarLayout";
import { getTheme } from "@/components/templates/shared/theme";

/** The sheet wrapper must carry no padding of its own — whether that is an
 * explicit 0 or no declaration at all. Padding there paints outside the rail
 * fill on a sidebar, and on the other families it inset the preview by an
 * amount the PDF never had. */
function carriesNoPadding(value: string): boolean {
  return value === "" || parseFloat(value) === 0;
}

describe("sidebar pagination regressions", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not invent a trailing sheet from pad slack past a page edge", () => {
    const stage = document.createElement("div");
    // Just barely over one page once bottom pad is counted — still one sheet.
    const offsets = computePageOffsets(stage, PAGE_HEIGHT_PX + PAGE_PAD_Y_PX, 1);
    expect(offsets).toEqual([0, PAGE_HEIGHT_PX]);
  });

  it("collapses a stub last sheet into the previous cut", () => {
    const stage = document.createElement("div");
    const end = PAGE_HEIGHT_PX + 20;
    const offsets = computePageOffsets(stage, end, 1);
    expect(offsets.length).toBe(2);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBe(PAGE_HEIGHT_PX);
  });

  it("keeps page 1's own 4% inset and gives page 2+ a matching 4% band, full-bleed rail fill throughout", () => {
    jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(2500);
    const { container } = render(
      <ResumePreviewFrame data={makeFullResumeData({ templateId: "atelier" })} />,
    );
    const sheets = container.querySelectorAll<HTMLElement>(".resume-page-sheet");
    expect(sheets.length).toBeGreaterThanOrEqual(2);

    // The sheet wrapper itself never carries CSS padding (that would paint a
    // white patch outside the rail fill). Page 1 top inset lives in the
    // template’s column padding, not sheet chrome.
    expect(carriesNoPadding(sheets[0].style.paddingTop)).toBe(true);
    expect(sheets[0].querySelector("[data-page-top-band]")).toBeNull();
    // Explicit tfoot-matching bottom band on every sidebar sheet.
    expect(sheets[0].querySelector("[data-page-bottom-band]")).not.toBeNull();
    expect(parseFloat(sheets[0].style.height)).toBe(PAGE_HEIGHT_PX);

    const band = sheets[1].querySelector<HTMLElement>("[data-page-top-band]");
    expect(band).not.toBeNull();
    expect(parseFloat(band!.style.height)).toBe(PAGE_PAD_Y_PX);
    expect(sheets[1].querySelector("[data-page-bottom-band]")).not.toBeNull();
    expect(carriesNoPadding(sheets[1].style.paddingTop)).toBe(true);
    // Page 2 = top band + content slice + bottom band (= one A4), not
    // top band stacked on a full paper window (that double-counted the inset).
    expect(parseFloat(sheets[1].style.height)).toBe(PAGE_HEIGHT_PX);

    for (const sheet of sheets) {
      const fill = sheet.querySelector<HTMLElement>("[data-rail-fill]");
      expect(fill).not.toBeNull();
      expect(fill!.style.right).toBe("0px");
      // Resolved px (not "34%") so it lines up with the scaled column
      // inside the transformed template, not its own unscaled box.
      expect(parseFloat(fill!.style.width)).toBeCloseTo(PAGE_WIDTH_PX * 0.34, 5);
      expect(fill!.className).toContain("absolute");
      expect(fill!.className).toMatch(/inset-0|inset-y-0/);
    }
  });

  it("applies the same even side content padding on rail and main", () => {
    const { container } = render(
      <SidebarLayout data={makeFullResumeData({ templateId: "ember" })} theme={getTheme("ember")} />,
    );
    const pads = container.querySelectorAll<HTMLElement>(".resume-col-pad");
    expect(pads.length).toBe(2);
    for (const pad of pads) {
      expect(pad.style.paddingTop).toBe(`${PAGE_PAD_Y_PX}px`);
      expect(pad.style.paddingLeft).toBe(`${PAGE_PAD_X_PX}px`);
      expect(pad.style.paddingRight).toBe(`${PAGE_PAD_X_PX}px`);
      expect(pad.style.paddingBottom).toBe("0px");
    }
    expect(container.querySelector("tfoot.resume-sidebar-page-pad-foot")).not.toBeNull();
  });

  it("mirrors the same padding and rail-fill rules for a right-hand sidebar", () => {
    jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(2500);
    const { container } = render(
      <ResumePreviewFrame data={makeFullResumeData({ templateId: "aisle" })} />,
    );
    const pads = container.querySelectorAll<HTMLElement>(".resume-col-pad");
    for (const pad of pads) {
      expect(pad.style.paddingTop).toBe(`${PAGE_PAD_Y_PX}px`);
      expect(pad.style.paddingBottom).toBe("0px");
    }
    const sheets = container.querySelectorAll<HTMLElement>(".resume-page-sheet");
    expect(sheets.length).toBeGreaterThanOrEqual(2);
    for (const sheet of sheets) {
      const fill = sheet.querySelector<HTMLElement>("[data-rail-fill]");
      expect(fill).not.toBeNull();
      expect(fill!.style.right).toBe("0px");
      expect(fill!.style.left).toBe("auto");
    }
    const band = sheets[1].querySelector<HTMLElement>("[data-page-top-band]");
    expect(band).not.toBeNull();
    expect(parseFloat(band!.style.height)).toBe(PAGE_PAD_Y_PX);
  });

  it("does not let a rail section title pull the shared page cut", () => {
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

    for (const id of ["ember", "aisle"] as const) {
      const data = makeFullResumeData({ templateId: id });
      const { container, unmount } = render(
        <SidebarLayout data={data} theme={getTheme(id)} />,
      );
      const stage = container.firstElementChild as HTMLElement;
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

      const skills = container.querySelector('[data-section-key="skills"]') as HTMLElement;
      expect(skills).not.toBeNull();
      const heading = skills.querySelector(".break-after-avoid") as HTMLElement | null;
      expect(heading).not.toBeNull();

      const titleTop = PAGE_HEIGHT_PX - 30;
      stubBox(skills, titleTop, 200);
      stubBox(heading!, titleTop, 20);

      // Rail titles must not steer the shared cut — that made Soft Skills
      // jump a page earlier in the preview than in the PDF.
      expect(avoidOrphanSectionTitle(stage, PAGE_HEIGHT_PX, 1)).toBe(PAGE_HEIGHT_PX);
      unmount();
    }
  });

  it("does not round a short sidebar overflow into an empty third sheet", () => {
    jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(PAGE_HEIGHT_PX + 80);
    const { container } = render(
      <ResumePreviewFrame data={makeFullResumeData({ templateId: "navy" })} />,
    );
    const sheets = container.querySelectorAll(".resume-page-sheet");
    // One page of content + small overflow → at most 2 sheets, never 3.
    expect(sheets.length).toBeLessThanOrEqual(2);
  });
});

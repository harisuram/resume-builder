import { render, screen } from "@testing-library/react";
import { PAGE_HEIGHT_PX, PAGE_INSET_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { ResumePreviewFrame } from "./ResumePreviewFrame";

function setBox(el: Element, box: { top: number; height: number }) {
  Object.defineProperty(el, "offsetTop", { configurable: true, value: box.top });
  Object.defineProperty(el, "offsetHeight", { configurable: true, value: box.height });
}

function hasGapSpacer(el: HTMLElement) {
  const prev = el.previousElementSibling as HTMLElement | null;
  return prev?.getAttribute("data-page-gap-spacer") === "true";
}

/** The sheet wrapper must carry no padding of its own — whether that is an
 * explicit 0 or no declaration at all. Padding there paints outside the rail
 * fill on a sidebar, and on the other families it inset the preview by an
 * amount the PDF never had. */
function carriesNoPadding(value: string): boolean {
  return value === "" || parseFloat(value) === 0;
}

describe("ResumePreviewFrame", () => {
  it("renders the template matching the resume's templateId", () => {
    const data = makeFullResumeData({ templateId: "jakes-resume" });
    render(<ResumePreviewFrame data={data} />);
    expect(screen.getAllByText("Alexandra Montgomery-Whitfield").length).toBeGreaterThan(0);
  });

  it("re-renders the correct template when templateId changes", () => {
    const data = makeFullResumeData({ templateId: "jakes-resume" });
    const { rerender } = render(<ResumePreviewFrame data={data} />);
    rerender(<ResumePreviewFrame data={{ ...data, templateId: "deedy-reversed" }} />);
    expect(screen.getAllByText("Alexandra Montgomery-Whitfield").length).toBeGreaterThan(0);
  });

  it("only tags the print root element when printable is true", () => {
    const data = makeFullResumeData();
    const { container, rerender } = render(<ResumePreviewFrame data={data} printable={false} />);
    expect(container.querySelector("#resume-print-root")).not.toBeInTheDocument();
    expect(container.querySelector("[data-print-viewport]")).not.toBeInTheDocument();

    rerender(<ResumePreviewFrame data={data} printable />);
    expect(container.querySelector("#resume-print-root")).toBeInTheDocument();
    expect(container.querySelector('[data-print-viewport="true"]')).toBeInTheDocument();
  });

  it("fits a sidebar surface to content height without inventing a blank trailing page", () => {
    const data = makeFullResumeData({ templateId: "bre-sidebar" });
    const { container, rerender } = render(<ResumePreviewFrame data={data} />);
    const page = container.querySelector(".resume-sidebar-page") as HTMLElement;
    const main = container.querySelector(".resume-main-column") as HTMLElement;
    const experience = container.querySelector('[data-section-key="experience"]') as HTMLElement;
    Object.defineProperty(page, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX });
    Object.defineProperty(page, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX });
    Object.defineProperty(main, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX * 3 });
    Object.defineProperty(main, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX * 3 });
    Object.defineProperty(experience, "offsetTop", { configurable: true, value: PAGE_HEIGHT_PX + 200 });
    Object.defineProperty(experience, "offsetHeight", { configurable: true, value: 100 });
    Object.defineProperty(experience, "offsetParent", { configurable: true, get: () => main });
    Object.defineProperty(main, "offsetTop", { configurable: true, value: 0 });
    Object.defineProperty(main, "offsetParent", { configurable: true, get: () => page });
    rerender(<ResumePreviewFrame data={{ ...data }} />);
    // Content bottom + bottom pad — not rounded up to an empty second A4.
    // The rail reaching the bottom of the last sheet is the print-only
    // `.resume-rail-print-fill`'s job, not this height's.
    const expected = PAGE_HEIGHT_PX + 200 + 100 + PAGE_PAD_Y_PX;
    expect(page).toHaveStyle({ height: `${expected}px`, minHeight: `${expected}px` });
  });

  it("lets a sidebar page snap back down after a prior overshoot so PDFs do not keep a blank trailing sheet", () => {
    const data = makeFullResumeData({ templateId: "inkwell" });
    const { container, rerender } = render(<ResumePreviewFrame data={data} printable />);
    const page = container.querySelector(".resume-sidebar-page") as HTMLElement;
    const main = container.querySelector(".resume-main-column") as HTMLElement;
    const experience = container.querySelector('[data-section-key="experience"]') as HTMLElement;

    for (const el of page.querySelectorAll<HTMLElement>("[data-section-key], .resume-dark-header")) {
      Object.defineProperty(el, "offsetTop", { configurable: true, value: 0 });
      Object.defineProperty(el, "offsetHeight", { configurable: true, value: 0 });
      Object.defineProperty(el, "offsetParent", { configurable: true, get: () => main });
    }
    Object.defineProperty(experience, "offsetTop", { configurable: true, value: PAGE_HEIGHT_PX + 200 });
    Object.defineProperty(experience, "offsetHeight", { configurable: true, value: 80 });
    Object.defineProperty(experience, "offsetParent", { configurable: true, get: () => main });
    Object.defineProperty(main, "offsetTop", { configurable: true, value: 0 });
    Object.defineProperty(main, "offsetParent", { configurable: true, get: () => page });
    Object.defineProperty(page, "offsetHeight", {
      configurable: true,
      get() {
        return page.style.height ? parseFloat(page.style.height) : PAGE_HEIGHT_PX;
      },
    });
    Object.defineProperty(page, "scrollHeight", {
      configurable: true,
      get() {
        return page.style.height ? parseFloat(page.style.height) : PAGE_HEIGHT_PX;
      },
    });
    rerender(<ResumePreviewFrame data={{ ...data }} printable />);
    const expected = PAGE_HEIGHT_PX + 200 + 80 + PAGE_PAD_Y_PX;
    expect(page).toHaveStyle({ height: `${expected}px`, minHeight: `${expected}px` });
    // `offsetHeight` here reads back whatever height was last written, so a
    // height derived from its own previous value would compound every pass.
    rerender(<ResumePreviewFrame data={{ ...data }} printable />);
    expect(page).toHaveStyle({ height: `${expected}px`, minHeight: `${expected}px` });
  });

  it("printable sidebar does not grow a blank trailing page from padding slack", () => {
    const data = makeFullResumeData({ templateId: "bre-creative" });
    const { container, rerender } = render(<ResumePreviewFrame data={data} printable />);
    const page = container.querySelector(".resume-sidebar-page") as HTMLElement;
    const main = container.querySelector(".resume-main-column") as HTMLElement;
    const experience = container.querySelector('[data-section-key="experience"]') as HTMLElement;

    for (const el of page.querySelectorAll<HTMLElement>("[data-section-key]")) {
      Object.defineProperty(el, "offsetTop", { configurable: true, value: 0 });
      Object.defineProperty(el, "offsetHeight", { configurable: true, value: 0 });
      Object.defineProperty(el, "offsetParent", { configurable: true, get: () => main });
    }
    Object.defineProperty(experience, "offsetTop", { configurable: true, value: PAGE_HEIGHT_PX * 2 - 20 });
    Object.defineProperty(experience, "offsetHeight", { configurable: true, value: 10 });
    Object.defineProperty(experience, "offsetParent", { configurable: true, get: () => main });
    Object.defineProperty(main, "offsetTop", { configurable: true, value: 0 });
    Object.defineProperty(main, "offsetParent", { configurable: true, get: () => page });
    rerender(<ResumePreviewFrame data={{ ...data }} printable />);
    expect(parseFloat(page.style.height)).toBeLessThanOrEqual(PAGE_HEIGHT_PX * 2);
  });

  it("keeps page-inset on the export frame so print matches the preview gaps", () => {
    const data = makeFullResumeData({ templateId: "inkwell" });
    const { container } = render(<ResumePreviewFrame data={data} printable />);
    const stage = container.querySelector(".resume-scale-stage") as HTMLElement;
    expect(stage.style.getPropertyValue("--page-inset")).toBe(`${PAGE_INSET_PX}px`);
  });

  it("never inserts page-gap spacers (forced partitions removed)", () => {
    const data = makeFullResumeData({ templateId: "bre-sidebar", pageBreakSections: ["education"] });
    const { container, rerender } = render(<ResumePreviewFrame data={data} />);
    const edu = container.querySelector('[data-section-key="education"]') as HTMLElement;
    setBox(edu, { top: 200, height: 80 });
    setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 2500 });
    rerender(<ResumePreviewFrame data={{ ...data }} />);
    expect(hasGapSpacer(edu)).toBe(false);
    expect(container.querySelector("[data-force-break]")).toBeNull();
    expect(screen.queryByRole("button", { name: /Move / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Undo/ })).not.toBeInTheDocument();
  });

  describe("page sheets", () => {
    function mockContentHeight(px: number) {
      return jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(px);
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("shows a single paper sheet when content fits on one page", () => {
      mockContentHeight(400);
      const { container } = render(<ResumePreviewFrame data={makeFullResumeData()} />);
      expect(container.querySelectorAll(".resume-page-sheet")).toHaveLength(1);
    });

    it("stacks paper sheets once content overflows (without dashed cut lines)", () => {
      mockContentHeight(2500);
      const { container } = render(<ResumePreviewFrame data={makeFullResumeData()} />);
      expect(container.querySelectorAll(".resume-page-sheet").length).toBeGreaterThanOrEqual(2);
      expect(container.querySelector(".page-split-guide")).toBeNull();
      expect(screen.queryByRole("button", { name: /Move / })).not.toBeInTheDocument();
    });

    it("keeps the paper stack out of print (no-print) and leaves a print root", () => {
      mockContentHeight(2500);
      const { container } = render(<ResumePreviewFrame data={makeFullResumeData()} printable />);
      expect(container.querySelector(".resume-page-stack")?.classList.contains("no-print")).toBe(true);
      expect(container.querySelector("#resume-print-root")).not.toBeNull();
      expect(container.querySelector(".resume-print-source")).not.toBeNull();
    });

    /* These sheets used to sit under a screen-only 24px pad that print had no
     * counterpart for, so the preview showed edges the PDF didn't. Both sides
     * now hold back PAGE_INSET_PX — cloned print-root padding in print, these
     * bands on screen — on every sheet, sheet 1 included. */
    it("gives non-sidebar sheets the same paper margins print reserves", () => {
      mockContentHeight(2500);
      const { container } = render(
        <ResumePreviewFrame data={makeFullResumeData({ templateId: "jakes-resume" })} />,
      );
      const sheets = container.querySelectorAll<HTMLElement>(".resume-page-sheet");
      expect(sheets.length).toBeGreaterThanOrEqual(2);

      // Same band at both edges of every sheet, sheet 1 included: uniform
      // sheets are what let the cuts come from real fragmentation.
      for (const sheet of sheets) {
        const head = sheet.querySelector<HTMLElement>("[data-page-top-band]");
        const foot = sheet.querySelector<HTMLElement>("[data-page-bottom-band]");
        expect(head).not.toBeNull();
        expect(foot).not.toBeNull();
        expect(parseFloat(head!.style.height)).toBe(PAGE_INSET_PX);
        expect(parseFloat(foot!.style.height)).toBe(PAGE_INSET_PX);
      }
      for (const sheet of sheets) {
        expect(carriesNoPadding(sheet.style.paddingTop)).toBe(true);
        expect(carriesNoPadding(sheet.style.paddingBottom)).toBe(true);
        expect(parseFloat(sheet.style.height)).toBe(PAGE_HEIGHT_PX);
      }
    });

    it("keeps sidebar sheets full-bleed with a rail fill under leftover bands", () => {
      mockContentHeight(2500);
      const { container } = render(
        <ResumePreviewFrame data={makeFullResumeData({ templateId: "bre-sidebar" })} />,
      );
      const sheets = container.querySelectorAll<HTMLElement>(".resume-page-sheet");
      expect(sheets.length).toBeGreaterThanOrEqual(2);
      // No CSS padding on sidebar sheets — that painted white outside the rail fill.
      expect(carriesNoPadding(sheets[0].style.paddingTop)).toBe(true);
      expect(carriesNoPadding(sheets[0].style.paddingBottom)).toBe(true);
      expect(carriesNoPadding(sheets[1].style.paddingTop)).toBe(true);
      expect(carriesNoPadding(sheets[1].style.paddingBottom)).toBe(true);
      // Page 1 top inset is column padding inside the crop; page 2+ get a
      // matching 4% band for the print thead (rail fill still covers it).
      expect(sheets[0].querySelector("[data-page-top-band]")).toBeNull();
      const band = sheets[1].querySelector<HTMLElement>("[data-page-top-band]");
      expect(band).not.toBeNull();
      expect(parseFloat(band!.style.height)).toBe(PAGE_PAD_Y_PX);
      // Every sidebar sheet gets an explicit bottom band (print tfoot).
      expect(sheets[0].querySelector("[data-page-bottom-band]")).not.toBeNull();
      expect(sheets[1].querySelector("[data-page-bottom-band]")).not.toBeNull();
      const fill = sheets[0].querySelector<HTMLElement>("[data-rail-fill]");
      expect(fill).not.toBeNull();
      // A resolved px number (not "34%") so this overlay's edge lines up
      // with the *scaled* column inside the transformed template — a plain
      // percentage of this div's own box rounds to a different sub-pixel
      // edge and the rail looks a hair wider right at the padding band.
      expect(parseFloat(fill!.style.width)).toBeCloseTo(PAGE_WIDTH_PX * 0.34, 5);
      expect(fill!.style.backgroundColor).toMatch(/#3A4750|#3a4750|rgb\(58,\s*71,\s*80\)/i);
      expect(parseFloat(sheets[0].style.height)).toBe(PAGE_HEIGHT_PX);
      // Page 2 is one A4 (top + slice + bottom), not A4 + extra top band.
      expect(parseFloat(sheets[1].style.height)).toBe(PAGE_HEIGHT_PX);
    });

    it("paints right-rail fills on the right for Atelier", () => {
      mockContentHeight(2500);
      const { container } = render(
        <ResumePreviewFrame data={makeFullResumeData({ templateId: "atelier" })} />,
      );
      const fill = container.querySelector<HTMLElement>("[data-rail-fill]");
      expect(fill).not.toBeNull();
      expect(fill!.style.right).toBe("0px");
      expect(fill!.style.left).toBe("auto");
    });
  });
});

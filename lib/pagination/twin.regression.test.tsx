/**
 * Twin layout measure invariants after forced Move/Undo partitions were removed.
 */
import { render, screen } from "@testing-library/react";
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { PRINT_LAYOUT_SIM_CLASS } from "@/lib/pagination";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { ResumePreviewFrame } from "@/components/builder/ResumePreviewFrame";

const TWIN = "twin";

function setBox(el: Element, box: { top: number; height: number }) {
  Object.defineProperty(el, "offsetTop", { configurable: true, value: box.top });
  Object.defineProperty(el, "offsetHeight", { configurable: true, value: box.height });
  (el as HTMLElement).getBoundingClientRect = () =>
    ({
      top: box.top,
      bottom: box.top + box.height,
      height: box.height,
      width: 100,
      left: 0,
      right: 100,
      x: 0,
      y: box.top,
      toJSON() {},
    }) as DOMRect;
}

function stubStage(stage: HTMLElement, height = 2500) {
  setBox(stage, { top: 0, height });
  stage.getBoundingClientRect = () =>
    ({
      top: 0,
      bottom: height,
      height,
      width: PAGE_WIDTH_PX,
      left: 0,
      right: PAGE_WIDTH_PX,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect;
}

describe("Twin natural layout", () => {
  it("keeps print-layout-sim on Twin so preview guides match download layout", () => {
    const data = makeFullResumeData({ templateId: TWIN });
    const { container } = render(<ResumePreviewFrame data={data} />);
    expect(container.querySelector(".resume-scale-stage")?.classList.contains(PRINT_LAYOUT_SIM_CLASS)).toBe(
      true,
    );
  });

  it("does not offer Move / Undo controls", () => {
    const data = makeFullResumeData({ templateId: TWIN, pageBreakSections: ["partTime"] });
    const { container } = render(<ResumePreviewFrame data={data} />);
    expect(screen.queryByRole("button", { name: /Move / })).toBeNull();
    expect(screen.queryByRole("button", { name: /Undo/ })).toBeNull();
    expect(container.querySelector("[data-force-break]")).toBeNull();
    expect(container.querySelector("[data-page-gap-spacer]")).toBeNull();
  });

  it("shows faint page sheets when content spans multiple sheets", () => {
    const spy = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(PAGE_HEIGHT_PX * 2 + 80);
    const data = makeFullResumeData({ templateId: TWIN });
    const { container } = render(<ResumePreviewFrame data={data} />);
    expect(container.querySelectorAll(".resume-page-sheet").length).toBeGreaterThanOrEqual(2);
    spy.mockRestore();
  });

  it("enables print-layout-sim on prepare-print without break spacers", () => {
    const data = makeFullResumeData({ templateId: TWIN });
    const { container, rerender } = render(<ResumePreviewFrame data={data} printable />);
    const stage = container.querySelector(".resume-scale-stage") as HTMLElement;
    stubStage(stage, 2500);
    rerender(<ResumePreviewFrame data={{ ...data }} printable />);

    window.dispatchEvent(new Event("resume:prepare-print"));
    const parkedStage = document.body.querySelector(
      '[data-print-viewport="true"] .resume-scale-stage',
    ) as HTMLElement | null;
    expect(parkedStage?.classList.contains(PRINT_LAYOUT_SIM_CLASS)).toBe(true);
    expect(parkedStage?.querySelector("[data-page-gap-spacer]")).toBeNull();
    expect(parkedStage?.querySelector(".resume-split-columns")?.getAttribute("style") ?? "").toMatch(
      /display:\s*table/,
    );
    const rail = parkedStage?.querySelector(".resume-split-narrow") as HTMLElement | null;
    expect(rail?.style.getPropertyValue("vertical-align")).toBe("top");
    window.dispatchEvent(new Event("resume:end-print"));
  });
});

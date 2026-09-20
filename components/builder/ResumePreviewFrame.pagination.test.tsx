/**
 * Preview / print share one frame: natural content flow, faint page guides,
 * prepare-print parks the printable root. Forced Move/Undo partitions removed.
 */
import { render } from "@testing-library/react";
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { PRINT_LAYOUT_SIM_CLASS } from "@/lib/pagination";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { ResumePreviewFrame } from "@/components/builder/ResumePreviewFrame";
import { TEMPLATE_LIST } from "@/components/templates/registry";

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

const FAMILIES = [
  ["jakes-resume", "single"],
  ["bre-creative", "sidebar"],
  ["deedy-reversed", "asymmetric"],
  ["dossier", "labeled"],
] as const;

describe("natural page guides (no forced partitions)", () => {
  it.each(FAMILIES)("%s (%s) never stamps data-force-break", (id) => {
    const data = makeFullResumeData({ templateId: id, pageBreakSections: ["experience"] });
    const { container } = render(<ResumePreviewFrame data={data} />);
    expect(container.querySelector("[data-force-break]")).toBeNull();
    expect(container.querySelector('[data-section-key="experience"]')).not.toBeNull();
  });

  it.each(FAMILIES)("%s (%s) keeps prepare-print park + Twin table sim", (id) => {
    const data = makeFullResumeData({ templateId: id });
    const { container, rerender } = render(<ResumePreviewFrame data={data} printable />);
    const stage = container.querySelector(".resume-scale-stage") as HTMLElement;
    stubStage(stage, PAGE_HEIGHT_PX * 2 + 100);
    rerender(<ResumePreviewFrame data={{ ...data }} printable />);

    window.dispatchEvent(new Event("resume:prepare-print"));
    const parkedRoot = document.body.querySelector(
      '[data-print-viewport="true"] #resume-print-root',
    ) as HTMLElement | null;
    expect(parkedRoot).not.toBeNull();
    expect(parkedRoot!.querySelector("[data-page-gap-spacer]")).toBeNull();
    const parkedStage = parkedRoot!.closest(".resume-scale-stage");
    if (id === "deedy-reversed" || id === "bre-creative") {
      expect(parkedStage?.classList.contains(PRINT_LAYOUT_SIM_CLASS)).toBe(true);
    }
    window.dispatchEvent(new Event("resume:end-print"));
  });
});

describe("page tags across every template", () => {
  it.each(TEMPLATE_LIST.map((t) => [t.id, t.layout] as const))("%s (%s) tags sections without force-break", (id) => {
    const data = makeFullResumeData({
      templateId: id,
      pageBreakSections: ["experience", "skills", "education"],
    });
    const { container } = render(<ResumePreviewFrame data={data} />);
    expect(container.querySelector("[data-force-break]")).toBeNull();
    expect(container.querySelector('[data-section-key="experience"]')).not.toBeNull();
  });
});

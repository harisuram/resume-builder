import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PAGE_HEIGHT_PX } from "@/lib/page";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { TEMPLATE_LIST } from "@/components/templates/registry";
import { ResumePreviewFrame } from "./ResumePreviewFrame";

/** jsdom never lays anything out for real, so offsetTop/offsetHeight are
 * always 0 — this pins them to fixed values on one specific DOM node
 * (rather than the whole HTMLElement prototype) to simulate where a
 * section actually sits within the page. */
function setBox(el: Element, box: { top: number; height: number }) {
  Object.defineProperty(el, "offsetTop", { configurable: true, value: box.top });
  Object.defineProperty(el, "offsetHeight", { configurable: true, value: box.height });
}

/** offsetTop that tracks whether a page-start margin is currently applied —
 * used to simulate packing page 3 back onto page 2 after an earlier move. */
function hasGapSpacer(el: HTMLElement, kind?: "break" | "inset") {
  const prev = el.previousElementSibling as HTMLElement | null;
  if (prev?.getAttribute("data-page-gap-spacer") !== "true") return false;
  if (!kind) return true;
  return prev.getAttribute("data-page-gap-kind") === kind;
}

function setPackableBox(el: HTMLElement, positioned: { forced: number; natural: number; height: number }) {
  Object.defineProperty(el, "offsetTop", {
    configurable: true,
    get() {
      return hasGapSpacer(el) ? positioned.forced : positioned.natural;
    },
  });
  Object.defineProperty(el, "offsetHeight", { configurable: true, value: positioned.height });
}

describe("ResumePreviewFrame", () => {
  it("renders the template matching the resume's templateId", () => {
    const data = makeFullResumeData({ templateId: "jakes-resume" });
    render(<ResumePreviewFrame data={data} />);
    expect(screen.getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
  });

  it("re-renders the correct template when templateId changes", () => {
    const data = makeFullResumeData({ templateId: "jakes-resume" });
    const { rerender } = render(<ResumePreviewFrame data={data} />);
    // Deedy Reversed uses the asymmetric two-column layout with a divider column.
    rerender(<ResumePreviewFrame data={{ ...data, templateId: "deedy-reversed" }} />);
    expect(screen.getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
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

  it("snaps a sidebar surface to whole A4 pages from real section bottoms, not a stretched cell", () => {
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
    expect(page).toHaveStyle({ height: `${PAGE_HEIGHT_PX * 2}px`, minHeight: `${PAGE_HEIGHT_PX * 2}px` });
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
    expect(page).toHaveStyle({ height: `${PAGE_HEIGHT_PX * 2}px`, minHeight: `${PAGE_HEIGHT_PX * 2}px` });
  });

  it("keeps page-inset on the export frame so print matches the preview gaps", () => {
    const data = makeFullResumeData({ templateId: "inkwell" });
    const { container } = render(<ResumePreviewFrame data={data} printable />);
    const stage = container.querySelector(".resume-scale-stage") as HTMLElement;
    expect(stage.style.getPropertyValue("--page-inset")).toBe("32px");
  });

  it("does not push a sidebar-rail section down — that opened a hole in the colored column", () => {
    const data = makeFullResumeData({ templateId: "bre-sidebar", pageBreakSections: ["education"] });
    const { container, rerender } = render(<ResumePreviewFrame data={data} />);
    const edu = container.querySelector('[data-section-key="education"]') as HTMLElement;
    setBox(edu, { top: 200, height: 80 });
    setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 2500 });
    rerender(<ResumePreviewFrame data={{ ...data }} />);
    expect(hasGapSpacer(edu)).toBe(false);
    expect(screen.queryByRole("button", { name: /Education. starts a new page/ })).not.toBeInTheDocument();
  });

  describe("page-break guides", () => {
    // jsdom never lays anything out for real (offsetHeight is always 0), so
    // these stub it to simulate a resume of a given rendered height.
    function mockContentHeight(px: number) {
      return jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(px);
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("shows no guide at all for a resume that fits on one page", () => {
      mockContentHeight(400);
      render(<ResumePreviewFrame data={makeFullResumeData()} />);
      expect(screen.queryByText("Page 1")).not.toBeInTheDocument();
      expect(screen.queryByText(/starts here/)).not.toBeInTheDocument();
    });

    it("marks where each additional page starts once content overflows one page", () => {
      mockContentHeight(2500); // spills across 3 pages at PAGE_HEIGHT_PX (1123)
      render(<ResumePreviewFrame data={makeFullResumeData()} />);
      expect(screen.queryByText("Page 1")).not.toBeInTheDocument();
      expect(screen.getByText("Page 2 starts here")).toBeInTheDocument();
      expect(screen.getByText("Page 3 starts here")).toBeInTheDocument();
      expect(screen.queryByText("Page 4 starts here")).not.toBeInTheDocument();
    });

    it("keeps the guides out of the print output (marked no-print)", () => {
      mockContentHeight(2500);
      const { container } = render(<ResumePreviewFrame data={makeFullResumeData()} printable />);
      const guideContainer = screen.getByText("Page 2 starts here").closest(".no-print");
      expect(guideContainer).not.toBeNull();
      // And it isn't nested inside the print target itself.
      expect(container.querySelector("#resume-print-root")?.contains(guideContainer)).toBe(false);
    });
  });

  describe("moving a split section to the next page", () => {
    it("offers to move a section that spans a page boundary, and reports it when clicked", async () => {
      const data = makeFullResumeData({ templateId: "jakes-resume" });
      const onToggle = jest.fn();
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={onToggle} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      const experienceEl = container.querySelector('[data-section-key="experience"]')!;
      setBox(experienceEl, { top: 900, height: 300 }); // bottom 1200 crosses PAGE_HEIGHT_PX
      setBox(stage, { top: 0, height: 1200 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={onToggle} />);

      const button = await screen.findByRole("button", { name: /Move .Experience. to page 2/ });
      await userEvent.click(button);
      expect(onToggle).toHaveBeenCalledWith("experience");
    });

    it("does not offer to move a section that fits entirely on one page", () => {
      const data = makeFullResumeData({ templateId: "jakes-resume" });
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={jest.fn()} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      const experienceEl = container.querySelector('[data-section-key="experience"]')!;
      setBox(experienceEl, { top: 100, height: 200 }); // bottom 300, well inside page 1
      setBox(stage, { top: 0, height: 2000 }); // still multi-page overall, just not from this section
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={jest.fn()} />);

      expect(screen.queryByText(/Move .Experience./)).not.toBeInTheDocument();
    });

    it("falls back to plain, non-interactive labels when no callback is given", async () => {
      const data = makeFullResumeData({ templateId: "jakes-resume" });
      const { container, rerender } = render(<ResumePreviewFrame data={data} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      const experienceEl = container.querySelector('[data-section-key="experience"]')!;
      setBox(experienceEl, { top: 900, height: 300 });
      setBox(stage, { top: 0, height: 1200 });
      rerender(<ResumePreviewFrame data={{ ...data }} />);

      expect(await screen.findByText('"Experience" splits here')).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows an Undo control for a section already forced onto a new page", async () => {
      const data = makeFullResumeData({
        templateId: "jakes-resume",
        pageBreakSections: ["certifications"],
      });
      const onToggle = jest.fn();
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={onToggle} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      const certEl = container.querySelector('[data-section-key="certifications"]')!;
      setBox(certEl, { top: 200, height: 100 });
      setBox(stage, { top: 0, height: 2000 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={onToggle} />);

      const undoButton = await screen.findByRole("button", { name: /.Certifications. starts a new page — Undo/ });
      await userEvent.click(undoButton);
      expect(onToggle).toHaveBeenCalledWith("certifications");
    });

    it("shows one marker, not two, where a forced section lands on a page boundary", async () => {
      const data = makeFullResumeData({
        templateId: "jakes-resume",
        pageBreakSections: ["certifications"],
      });
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={jest.fn()} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      const certEl = container.querySelector('[data-section-key="certifications"]')!;
      // The push lands PAGE_INSET_PX below the paper edge so page 2 has a
      // default top margin. Tests stub offsetTop, so it still reads as the
      // boundary; pairing treats that inset band as the same marker.
      setBox(certEl, { top: PAGE_HEIGHT_PX, height: 100 });
      setBox(stage, { top: 0, height: 2000 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={jest.fn()} />);

      expect(await screen.findByRole("button", { name: /.Certifications. starts a new page/ })).toBeInTheDocument();
      // The boundary's own generic label would otherwise stack on the Undo control.
      expect(screen.queryByText("Page 2 starts here")).not.toBeInTheDocument();
    });

    it("still shows one marker when the forced block sits PAGE_INSET below the edge", async () => {
      const data = makeFullResumeData({
        templateId: "jakes-resume",
        pageBreakSections: ["certifications"],
      });
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={jest.fn()} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      const certEl = container.querySelector('[data-section-key="certifications"]')!;
      // Real layout after pageStartMarginCss: content starts inset below the
      // paper edge. A tight pair window used to leave both Undo and Move.
      setBox(certEl, { top: PAGE_HEIGHT_PX + 32, height: 100 });
      setBox(stage, { top: 0, height: 2000 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={jest.fn()} />);

      expect(await screen.findByRole("button", { name: /.Certifications. starts a new page/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Move / })).not.toBeInTheDocument();
      expect(screen.queryByText("Page 2 starts here")).not.toBeInTheDocument();
      expect(screen.queryByText(/splits here/)).not.toBeInTheDocument();
    });

    it("still labels a forced section when no callback is given, without the Undo control", async () => {
      const data = makeFullResumeData({
        templateId: "jakes-resume",
        pageBreakSections: ["certifications"],
      });
      const { container, rerender } = render(<ResumePreviewFrame data={data} />);

      const stage = container.querySelector(".resume-scale-stage")!;
      setBox(container.querySelector('[data-section-key="certifications"]')!, { top: PAGE_HEIGHT_PX, height: 100 });
      setBox(stage, { top: 0, height: 2000 });
      rerender(<ResumePreviewFrame data={{ ...data }} />);

      expect(await screen.findByText('"Certifications" starts a new page')).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("tags a forced section with data-force-break so the preview can push it to a page start", () => {
      const data = makeFullResumeData({ templateId: "jakes-resume", pageBreakSections: ["skills"] });
      const { container } = render(<ResumePreviewFrame data={data} />);
      expect(container.querySelector('[data-section-key="skills"]')).toHaveAttribute("data-force-break", "true");
      expect(container.querySelector('[data-section-key="education"]')).not.toHaveAttribute("data-force-break");
    });

    it("clears a later page-3 force break when it already fits on page 2 after an earlier move", () => {
      const data = makeFullResumeData({
        templateId: "jakes-resume",
        pageBreakSections: ["experience", "certifications"],
      });
      const onToggle = jest.fn();
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={onToggle} />);

      const stage = container.querySelector(".resume-scale-stage") as HTMLElement;
      const experience = container.querySelector('[data-section-key="experience"]') as HTMLElement;
      const certifications = container.querySelector('[data-section-key="certifications"]') as HTMLElement;
      // Experience still needs its page-2 break (straddles page 1 without it).
      setPackableBox(experience, {
        forced: PAGE_HEIGHT_PX + 32,
        natural: PAGE_HEIGHT_PX - 40,
        height: 120,
      });
      // Certifications was forced onto page 3, but after Experience moves it
      // fits entirely on page 2 — pack it up and clear the leftover break.
      setPackableBox(certifications, {
        forced: PAGE_HEIGHT_PX * 2 + 32,
        natural: PAGE_HEIGHT_PX + 200,
        height: 80,
      });
      setBox(stage, { top: 0, height: 3000 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={onToggle} />);

      expect(onToggle).toHaveBeenCalledWith("certifications");
      expect(onToggle).not.toHaveBeenCalledWith("experience");
      expect(hasGapSpacer(certifications)).toBe(false);
    });

    it("keeps a page-2 force break that would otherwise fall back onto page 1", () => {
      const data = makeFullResumeData({
        templateId: "jakes-resume",
        pageBreakSections: ["experience"],
      });
      const onToggle = jest.fn();
      const { container, rerender } = render(<ResumePreviewFrame data={data} onToggleSectionBreak={onToggle} />);

      const stage = container.querySelector(".resume-scale-stage") as HTMLElement;
      const experience = container.querySelector('[data-section-key="experience"]') as HTMLElement;
      setPackableBox(experience, {
        forced: PAGE_HEIGHT_PX + 32,
        natural: 200,
        height: 100,
      });
      setBox(stage, { top: 0, height: 2000 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={onToggle} />);

      expect(onToggle).not.toHaveBeenCalled();
      expect(hasGapSpacer(experience)).toBe(true);
    });
  });

  describe("moving a single list entry to the next page", () => {
    const PROJECTS = [
      { name: "Kafka connector", description: "CDC bridge." },
      { name: "Postgres tuner", description: "Index advisor." },
      { name: "Static site host", description: "Edge cache." },
    ];

    function threeProjects(overrides: Parameters<typeof makeFullResumeData>[0] = {}) {
      const base = makeFullResumeData({ templateId: "jakes-resume" });
      return { ...base, sections: { ...base.sections, projects: PROJECTS }, ...overrides };
    }

    /** Lays the three projects out with the given one straddling the first
     * page boundary, and returns the props needed to re-measure. */
    function layOut(container: HTMLElement, straddling: number) {
      setBox(container.querySelector('[data-section-key="projects"]')!, { top: 700, height: 600 });
      PROJECTS.forEach((_, i) => {
        const box = i === straddling ? { top: PAGE_HEIGHT_PX - 40, height: 120 } : { top: 740 + i * 60, height: 50 };
        setBox(container.querySelector(`[data-item-key="projects:${i}"]`)!, box);
      });
      setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
    }

    it("nudges a straddling avoid-break entry down so the preview matches print", () => {
      const { container, rerender } = render(<ResumePreviewFrame data={threeProjects()} />);
      const item = container.querySelector('[data-item-key="projects:2"]') as HTMLElement;
      expect(item.className).toContain("break-inside-avoid");
      setBox(item, { top: PAGE_HEIGHT_PX - 40, height: 120 });
      setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
      rerender(<ResumePreviewFrame data={threeProjects()} />);
      expect(hasGapSpacer(item)).toBe(true);
      expect(hasGapSpacer(item, "break")).toBe(true);
      expect((item.previousElementSibling as HTMLElement).style.height).toBe("72px");
    });

    it("insets a section that starts on page 2 so it is not flush with the paper", () => {
      const data = makeFullResumeData({ templateId: "jakes-resume" });
      const { container, rerender } = render(<ResumePreviewFrame data={data} />);
      const education = container.querySelector('[data-section-key="education"]') as HTMLElement;
      setBox(education, { top: PAGE_HEIGHT_PX, height: 80 });
      setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
      rerender(<ResumePreviewFrame data={{ ...data }} />);
      expect(hasGapSpacer(education)).toBe(true);
      expect(hasGapSpacer(education, "inset")).toBe(true);
      expect((education.previousElementSibling as HTMLElement).style.height).toBe("32px");
    });

    it("does not clear that nudge when only the preview column's height changes", () => {
      // Soft skills (or any last section) pushing the stack over a page used
      // to resize the viewport, re-enter measure, wipe the page-gap spacer, then
      // re-apply it — the right-hand preview glittered. Height-only resizes
      // must leave simulation styles alone; download never ran this path.
      const resizeCallbacks: Array<() => void> = [];
      const OriginalRO = global.ResizeObserver;
      global.ResizeObserver = class {
        constructor(cb: ResizeObserverCallback) {
          resizeCallbacks.push(() => cb([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver));
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      } as typeof ResizeObserver;

      try {
        const { container, rerender } = render(<ResumePreviewFrame data={threeProjects()} />);
        const item = container.querySelector('[data-item-key="projects:2"]') as HTMLElement;
        setBox(item, { top: PAGE_HEIGHT_PX - 40, height: 120 });
        setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
        rerender(<ResumePreviewFrame data={threeProjects()} />);
        expect(hasGapSpacer(item)).toBe(true);
        const spacer = item.previousElementSibling as HTMLElement;
        const heightBefore = spacer.style.height;

        for (const fire of resizeCallbacks) fire();
        expect(hasGapSpacer(item)).toBe(true);
        expect((item.previousElementSibling as HTMLElement).style.height).toBe(heightBefore);
      } finally {
        global.ResizeObserver = OriginalRO;
      }
    });

    it("offers the straddling entry rather than its whole section", async () => {
      const onToggleSectionBreak = jest.fn();
      const onToggleItemBreak = jest.fn();
      const props = { onToggleSectionBreak, onToggleItemBreak };
      const { container, rerender } = render(<ResumePreviewFrame data={threeProjects()} {...props} />);

      layOut(container, 2);
      rerender(<ResumePreviewFrame data={threeProjects()} {...props} />);

      const button = await screen.findByRole("button", { name: /Move .Static site host. to page 2/ });
      await userEvent.click(button);
      expect(onToggleItemBreak).toHaveBeenCalledWith("projects", 2);
      // The whole-section offer would have dragged the first two projects down too.
      expect(onToggleSectionBreak).not.toHaveBeenCalled();
      expect(screen.queryByText(/Move .Projects./)).not.toBeInTheDocument();
    });

    it("moves the whole section when the first entry straddles, so the title is not left behind", async () => {
      const onToggleSectionBreak = jest.fn();
      const onToggleItemBreak = jest.fn();
      const props = { onToggleSectionBreak, onToggleItemBreak };
      const { container, rerender } = render(<ResumePreviewFrame data={threeProjects()} {...props} />);

      layOut(container, 0);
      rerender(<ResumePreviewFrame data={threeProjects()} {...props} />);

      const button = await screen.findByRole("button", { name: /Move .Projects. to page 2/ });
      await userEvent.click(button);
      expect(onToggleSectionBreak).toHaveBeenCalledWith("projects");
      expect(onToggleItemBreak).not.toHaveBeenCalled();
    });

    it("names the entry in the Undo control once it's been forced", async () => {
      const data = threeProjects({ pageBreakItems: ["projects:2"] });
      const onToggleItemBreak = jest.fn();
      const { container, rerender } = render(
        <ResumePreviewFrame data={data} onToggleItemBreak={onToggleItemBreak} />,
      );

      setBox(container.querySelector('[data-item-key="projects:2"]')!, { top: PAGE_HEIGHT_PX, height: 120 });
      setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleItemBreak={onToggleItemBreak} />);

      const undo = await screen.findByRole("button", { name: /.Static site host. starts a new page/ });
      await userEvent.click(undo);
      expect(onToggleItemBreak).toHaveBeenCalledWith("projects", 2);
    });

    it("tags only the forced entry with data-force-break so the preview can push it", () => {
      const { container } = render(<ResumePreviewFrame data={threeProjects({ pageBreakItems: ["projects:1"] })} />);
      expect(container.querySelector('[data-item-key="projects:1"]')).toHaveAttribute("data-force-break", "true");
      expect(container.querySelector('[data-item-key="projects:0"]')).not.toHaveAttribute("data-force-break");
      expect(container.querySelector('[data-item-key="projects:2"]')).not.toHaveAttribute("data-force-break");
      // The section itself stays unforced — only the one entry moves.
      expect(container.querySelector('[data-section-key="projects"]')).not.toHaveAttribute("data-force-break");
    });

    it("shows a plain label for a straddling entry when no entry callback is wired", async () => {
      const { container, rerender } = render(<ResumePreviewFrame data={threeProjects()} />);

      layOut(container, 2);
      rerender(<ResumePreviewFrame data={threeProjects()} />);

      expect(await screen.findByText('"Static site host" splits here')).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("page-2 inset on every template", () => {
    it.each(TEMPLATE_LIST.map((t) => [t.id, t.name, t.layout] as const))(
      "%s (%s, %s) insets a main-column section that starts on page 2",
      (id) => {
        const data = makeFullResumeData({ templateId: id });
        const { container, rerender } = render(<ResumePreviewFrame data={data} />);
        const experience = container.querySelector('[data-section-key="experience"]') as HTMLElement;
        expect(experience).not.toBeNull();
        setBox(experience, { top: PAGE_HEIGHT_PX, height: 80 });
        setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
        rerender(<ResumePreviewFrame data={{ ...data }} />);
        expect(hasGapSpacer(experience)).toBe(true);
      },
    );

    it.each(TEMPLATE_LIST.filter((t) => t.layout !== "single").map((t) => [t.id, t.name, t.layout] as const))(
      "%s (%s, %s) insets a rail section that starts on page 2",
      (id) => {
        const data = makeFullResumeData({ templateId: id });
        const { container, rerender } = render(<ResumePreviewFrame data={data} />);
        const education = container.querySelector(
          '[data-resume-column="rail"] [data-section-key="education"]',
        ) as HTMLElement;
        expect(education).not.toBeNull();
        setBox(education, { top: PAGE_HEIGHT_PX, height: 80 });
        setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 1400 });
        rerender(<ResumePreviewFrame data={{ ...data }} />);
        expect(hasGapSpacer(education)).toBe(true);
      },
    );
  });
});

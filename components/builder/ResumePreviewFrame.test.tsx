import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PAGE_HEIGHT_PX } from "@/lib/page";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { ResumePreviewFrame } from "./ResumePreviewFrame";

/** jsdom never lays anything out for real, so offsetTop/offsetHeight are
 * always 0 — this pins them to fixed values on one specific DOM node
 * (rather than the whole HTMLElement prototype) to simulate where a
 * section actually sits within the page. */
function setBox(el: Element, box: { top: number; height: number }) {
  Object.defineProperty(el, "offsetTop", { configurable: true, value: box.top });
  Object.defineProperty(el, "offsetHeight", { configurable: true, value: box.height });
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

    rerender(<ResumePreviewFrame data={data} printable />);
    expect(container.querySelector("#resume-print-root")).toBeInTheDocument();
  });

  it("snaps a sidebar surface to whole A4 pages using the overflowing main column, not the clipped page box", () => {
    const data = makeFullResumeData({ templateId: "bre-sidebar" });
    const { container, rerender } = render(<ResumePreviewFrame data={data} />);
    const page = container.querySelector(".resume-sidebar-page")!;
    const main = container.querySelector(".resume-main-column")!;
    Object.defineProperty(page, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX });
    Object.defineProperty(page, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX });
    Object.defineProperty(main, "offsetHeight", { configurable: true, value: PAGE_HEIGHT_PX + 400 });
    Object.defineProperty(main, "scrollHeight", { configurable: true, value: PAGE_HEIGHT_PX + 400 });
    rerender(<ResumePreviewFrame data={{ ...data }} />);
    expect(page).toHaveStyle({ height: `${PAGE_HEIGHT_PX * 2}px`, minHeight: `${PAGE_HEIGHT_PX * 2}px` });
  });

  it("does not push a sidebar-rail section down — that opened a hole in the colored column", () => {
    const data = makeFullResumeData({ templateId: "bre-sidebar", pageBreakSections: ["education"] });
    const { container, rerender } = render(<ResumePreviewFrame data={data} />);
    const edu = container.querySelector('[data-section-key="education"]') as HTMLElement;
    setBox(edu, { top: 200, height: 80 });
    setBox(container.querySelector(".resume-scale-stage")!, { top: 0, height: 2500 });
    rerender(<ResumePreviewFrame data={{ ...data }} />);
    expect(edu.style.marginTop).toBe("");
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
      expect(screen.getByText("Page 1")).toBeInTheDocument();
      expect(screen.getByText("Page 2 starts here")).toBeInTheDocument();
      expect(screen.getByText("Page 3 starts here")).toBeInTheDocument();
      expect(screen.queryByText("Page 4 starts here")).not.toBeInTheDocument();
    });

    it("places the Page 1 badge on the main column of a left-sidebar template", () => {
      mockContentHeight(2500);
      render(<ResumePreviewFrame data={makeFullResumeData({ templateId: "bre-sidebar" })} />);
      expect(screen.getByText("Page 1")).toHaveStyle({ left: "calc(34% + 8px)" });
    });

    it("keeps the guides out of the print output (marked no-print)", () => {
      mockContentHeight(2500);
      const { container } = render(<ResumePreviewFrame data={makeFullResumeData()} printable />);
      const guideContainer = screen.getByText("Page 1").closest(".no-print");
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
      // Exactly where the push puts it in a real browser: the top of page 2.
      setBox(certEl, { top: PAGE_HEIGHT_PX, height: 100 });
      setBox(stage, { top: 0, height: 2000 });
      rerender(<ResumePreviewFrame data={{ ...data }} onToggleSectionBreak={jest.fn()} />);

      expect(await screen.findByRole("button", { name: /.Certifications. starts a new page/ })).toBeInTheDocument();
      // The boundary's own generic label would otherwise stack on the Undo control.
      expect(screen.queryByText("Page 2 starts here")).not.toBeInTheDocument();
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
      expect(item.style.marginTop).toBe("40px");
      expect(item.style.getPropertyPriority("margin-top")).toBe("important");
    });

    it("does not clear that nudge when only the preview column's height changes", () => {
      // Soft skills (or any last section) pushing the stack over a page used
      // to resize the viewport, re-enter measure, wipe marginTop, then
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
        expect(item.style.marginTop).toBe("40px");

        const assignments: string[] = [];
        const proto = Object.getPrototypeOf(item.style);
        const descriptor = Object.getOwnPropertyDescriptor(proto, "marginTop");
        const originalSet = descriptor?.set;
        if (originalSet) {
          Object.defineProperty(item.style, "marginTop", {
            configurable: true,
            get: descriptor.get?.bind(item.style),
            set(value: string) {
              assignments.push(value);
              originalSet.call(this, value);
            },
          });
        }

        for (const fire of resizeCallbacks) fire();
        expect(item.style.marginTop).toBe("40px");
        expect(assignments).toEqual([]);
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
});

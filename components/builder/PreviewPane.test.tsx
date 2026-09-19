import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { PreviewPane } from "./PreviewPane";

beforeEach(() => {
  useBuilderStore.getState().resetStore();
});

describe("PreviewPane empty template preview", () => {
  it("shows sample text of the selected template with non-skipped section titles", () => {
    render(<PreviewPane />);
    expect(screen.getByRole("region", { name: "Atlas template preview" })).toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume='jakes-resume']")).not.toBeNull();
    expect(document.querySelector("[data-template-skeleton]")).toBeNull();
    expect(screen.getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
    expect(document.querySelector("[data-section-key='experience']")).not.toBeNull();
    expect(document.querySelector("[data-section-key='patents']")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveTextContent("Change template");
    expect(screen.getByText(/this is a sample of/i)).toBeInTheDocument();
  });

  it("omits skipped sections from the sample preview", () => {
    useBuilderStore.getState().toggleSkipSection("patents");
    useBuilderStore.getState().toggleSkipSection("summary");
    render(<PreviewPane />);
    expect(document.querySelector("[data-section-key='patents']")).toBeNull();
    expect(document.querySelector("[data-section-key='summary']")).toBeNull();
    expect(document.querySelector("[data-section-key='experience']")).not.toBeNull();
  });

  it("opens the template picker from the placeholder callout", async () => {
    render(<PreviewPane />);
    await userEvent.click(screen.getByRole("button", { name: "Change template" }));
    expect(screen.getByRole("listbox", { name: "Templates" })).toBeInTheDocument();
  });

  it("replaces the sample with the live resume once a section has content", () => {
    useBuilderStore.getState().setSkills(["TypeScript"]);
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume]")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveTextContent(/^Template/);
    expect(screen.getByText("Your Name")).toBeInTheDocument();
  });

  it("replaces the sample as soon as a name is typed", () => {
    useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    expect(screen.getByText("Jamie Rivera")).toBeInTheDocument();
  });

  it("replaces the sample as soon as a photo is added", () => {
    useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc");
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume]")).toBeNull();
    expect(document.querySelector("img")).not.toBeNull();
  });

  it("keeps a print root when the export preview is still a sample", () => {
    const { container } = render(<PreviewPane printable />);
    const sample = container.querySelector("[data-sample-resume]");
    const printRoot = container.querySelector("#resume-print-root");
    expect(sample).not.toBeNull();
    expect(printRoot).toBeInTheDocument();
    // Sample is screen-only; print/PDF must never snapshot it.
    expect(sample!.closest(".no-print")).not.toBeNull();
    expect(printRoot!.contains(sample)).toBe(false);
    expect(printRoot!.textContent).not.toContain("Alexandra Montgomery-Whitfield");
  });
});

describe("PreviewPane with content", () => {
  it("renders the live template, not the sample preview chrome", () => {
    useBuilderStore.getState().loadFromData(makeFullResumeData({ templateId: "jakes-resume" }));
    render(<PreviewPane />);
    expect(screen.getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
    expect(document.querySelector("[data-sample-resume]")).toBeNull();
    expect(document.querySelector("[data-template-skeleton]")).toBeNull();
  });

  it("prints the user's resume through the live frame, not a sample", () => {
    useBuilderStore.getState().loadFromData(
      makeFullResumeData({
        templateId: "jakes-resume",
        basicInfo: {
          name: "Jamie Rivera",
          email: "jamie@example.com",
          phone: "5550100199",
          location: "Austin, TX",
          links: {},
        },
        pageBreakSections: ["experience"],
      }),
    );
    const { container } = render(<PreviewPane printable />);
    expect(container.querySelector("[data-sample-resume]")).toBeNull();
    const printRoot = container.querySelector("#resume-print-root");
    expect(printRoot).toBeInTheDocument();
    expect(printRoot!.textContent).toContain("Jamie Rivera");
    expect(printRoot!.textContent).not.toContain("Alexandra Montgomery-Whitfield");
    // Forced page separators stay on the live printable frame.
    expect(printRoot!.querySelector('[data-section-key="experience"]')).toHaveAttribute("data-force-break", "true");
    expect(container.querySelector('[data-tour="page-separator"]')).not.toBeNull();
  });
});

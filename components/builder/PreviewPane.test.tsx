import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { PreviewPane } from "./PreviewPane";

beforeEach(() => {
  useBuilderStore.getState().resetStore();
});

describe("PreviewPane empty template preview", () => {
  it("shows a skeleton of the selected template with non-skipped section titles", () => {
    render(<PreviewPane />);
    expect(screen.getByRole("region", { name: "Atlas template preview" })).toBeInTheDocument();
    expect(document.querySelector("[data-template-skeleton='jakes-resume']")).not.toBeNull();
    expect(document.querySelector("[data-preview-section='experience']")).not.toBeNull();
    expect(document.querySelector("[data-preview-section='patents']")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveTextContent("Change template");
    expect(screen.getByText(/this is a sample of/i)).toBeInTheDocument();
  });

  it("omits skipped sections from the placeholder", () => {
    useBuilderStore.getState().toggleSkipSection("patents");
    useBuilderStore.getState().toggleSkipSection("summary");
    render(<PreviewPane />);
    expect(document.querySelector("[data-preview-section='patents']")).toBeNull();
    expect(document.querySelector("[data-preview-section='summary']")).toBeNull();
    expect(document.querySelector("[data-preview-section='experience']")).not.toBeNull();
  });

  it("opens the template picker from the placeholder callout", async () => {
    render(<PreviewPane />);
    await userEvent.click(screen.getByRole("button", { name: "Change template" }));
    expect(screen.getByRole("listbox", { name: "Templates" })).toBeInTheDocument();
  });

  it("replaces the placeholder with the live resume once a section has content", () => {
    useBuilderStore.getState().setSkills(["TypeScript"]);
    render(<PreviewPane />);
    expect(screen.queryByRole("region", { name: /template preview/i })).not.toBeInTheDocument();
    expect(document.querySelector("[data-template-skeleton]")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a template" })).toHaveTextContent(/^Template/);
    expect(screen.getByText("Your Name")).toBeInTheDocument();
  });

  it("keeps a print root when the export preview is still a placeholder", () => {
    const { container } = render(<PreviewPane printable />);
    expect(container.querySelector("[data-template-skeleton]")).not.toBeNull();
    expect(container.querySelector("#resume-print-root")).toBeInTheDocument();
  });
});

describe("PreviewPane with content", () => {
  it("renders the live template, not the skeleton", () => {
    useBuilderStore.getState().loadFromData(makeFullResumeData({ templateId: "jakes-resume" }));
    render(<PreviewPane />);
    expect(screen.getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
    expect(document.querySelector("[data-template-skeleton]")).toBeNull();
  });
});

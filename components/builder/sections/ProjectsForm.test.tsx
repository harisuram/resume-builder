import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiLimitError, optimizeProjectDescription } from "@/lib/ai";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { ToastHost } from "@/components/ui/Toast";
import { ProjectsForm } from "./ProjectsForm";

jest.mock("../../../lib/ai", () => ({
  AiLimitError: class AiLimitError extends Error {},
  AI_LIMITED_UNTIL_KEY: "ai-optimize-limited-until",
  AI_BACKOFF_MS: 4 * 60 * 60 * 1000,
  optimizeProjectDescription: jest.fn(),
}));
const mockOptimize = optimizeProjectDescription as jest.Mock;

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
  mockOptimize.mockReset();
  localStorage.clear();
  useToastStore.getState().clear();
});

describe("ProjectsForm", () => {
  it("adds a project and fills its fields", async () => {
    render(<ProjectsForm />);
    await userEvent.click(screen.getByText("+ Add project"));

    await userEvent.type(screen.getByPlaceholderText("Resume Builder"), "My Project");
    await userEvent.type(
      screen.getByPlaceholderText("What it does and what you used to build it."),
      "Does a thing.",
    );
    await userEvent.type(screen.getByPlaceholderText("github.com/you/project"), "github.com/me/project");

    const project = useBuilderStore.getState().sections.projects![0];
    expect(project.name).toBe("My Project");
    expect(project.description).toBe("Does a thing.");
    expect(project.link).toBe("github.com/me/project");
  });

  it("shows an error for a missing name after blur", async () => {
    render(<ProjectsForm />);
    await userEvent.click(screen.getByText("+ Add project"));
    await userEvent.click(screen.getByPlaceholderText("Resume Builder"));
    await userEvent.tab();
    expect(screen.getByText("Enter the project name.")).toBeInTheDocument();
  });

  it("flags a project link that is not a URL", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D", link: "not a url" }));
    render(<ProjectsForm />);
    await userEvent.click(screen.getByPlaceholderText("github.com/you/project"));
    await userEvent.tab();
    expect(screen.getByText(/Enter a valid project link/)).toBeInTheDocument();
  });

  it("adds technologies via the chip input", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D" }));
    render(<ProjectsForm />);
    const techInput = screen.getByPlaceholderText("Add a technology, press Enter");
    await userEvent.type(techInput, "React{Enter}");
    expect(useBuilderStore.getState().sections.projects![0].technologies).toEqual(["React"]);
  });

  it("offers the skill catalog for technologies and hides ones already selected", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D" }));
    render(<ProjectsForm />);
    await userEvent.click(screen.getByPlaceholderText("Add a technology, press Enter"));
    expect(screen.getByRole("option", { name: "TypeScript" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: "TypeScript" }));
    expect(useBuilderStore.getState().sections.projects![0].technologies).toEqual(["TypeScript"]);
    expect(screen.queryByRole("option", { name: "TypeScript" })).not.toBeInTheDocument();
  });

  it("removes a project", async () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "D" }));
    render(<ProjectsForm />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useBuilderStore.getState().sections.projects).toEqual([]);
  });

  it("shows a skipped notice when skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("projects"));
    render(<ProjectsForm />);
    expect(screen.getByText(/Projects is skipped/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Make ATS-friendly/ })).not.toBeInTheDocument();
  });

  it("disables the ATS button until the description has text", () => {
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "" }));
    render(<ProjectsForm />);
    expect(screen.getByRole("button", { name: /Make ATS-friendly/ })).toBeDisabled();
  });

  it("replaces the description with the AI-optimized version on success", async () => {
    mockOptimize.mockResolvedValue("Built a browser resume editor with live preview.");
    act(() =>
      useBuilderStore.getState().addListItem("projects", {
        name: "Resume Builder",
        description: "I made a resume site.",
        technologies: ["React"],
      }),
    );
    render(<ProjectsForm />);

    await userEvent.click(screen.getByRole("button", { name: /Make ATS-friendly/ }));

    expect(mockOptimize).toHaveBeenCalledWith({
      name: "Resume Builder",
      description: "I made a resume site.",
      technologies: ["React"],
    });
    await waitFor(() =>
      expect(useBuilderStore.getState().sections.projects![0].description).toBe(
        "Built a browser resume editor with live preview.",
      ),
    );
  });

  it("hides the AI button once the free quota is hit", async () => {
    mockOptimize.mockRejectedValue(
      new AiLimitError("The free AI rewrite limit is used up. Try another writing tool, or polish this section yourself."),
    );
    act(() => useBuilderStore.getState().addListItem("projects", { name: "P", description: "Does a thing." }));
    render(
      <>
        <ProjectsForm />
        <ToastHost />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Make ATS-friendly/ }));

    await waitFor(() => expect(screen.queryByRole("button", { name: /Make ATS-friendly/ })).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(/free AI rewrite limit is used up/i);
    expect(Number(localStorage.getItem("ai-optimize-limited-until"))).toBeGreaterThan(Date.now());
  });
});

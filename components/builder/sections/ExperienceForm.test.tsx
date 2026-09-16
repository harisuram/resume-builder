import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiLimitError, optimizeExperienceBullets } from "@/lib/ai";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { ToastHost } from "@/components/ui/Toast";
import { ExperienceForm } from "./ExperienceForm";

// jest.mock's target must resolve through Jest's own resolver, which has no
// "@/" alias (that rewrite happens later, via SWC) — a relative path here
// still registers against the same resolved module as the "@/lib/ai" import.
jest.mock("../../../lib/ai", () => ({
  AiLimitError: class AiLimitError extends Error {},
  AI_LIMITED_UNTIL_KEY: "ai-optimize-limited-until",
  AI_BACKOFF_MS: 4 * 60 * 60 * 1000,
  optimizeExperienceBullets: jest.fn(),
}));
const mockOptimize = optimizeExperienceBullets as jest.Mock;

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
  mockOptimize.mockReset();
  localStorage.clear();
  useToastStore.getState().clear();
});

describe.each([
  ["experience", "Experience"],
  ["internships", "Internships"],
  ["partTime", "Part-time work"],
] as const)("ExperienceForm (%s)", (sectionKey, title) => {
  it("shows the given title and help text", () => {
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="Some help text" />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("Some help text")).toBeInTheDocument();
  });

  it("adds an entry with company, role, and one blank bullet", async () => {
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);
    await userEvent.click(screen.getByText(new RegExp(`\\+ Add (experience|role)`)));

    await userEvent.type(screen.getByPlaceholderText("Acme Corp"), "Acme Corp");
    await userEvent.type(screen.getByPlaceholderText(/Software Engineer, Pharmacist, Architect/), "Engineer");

    const list = useBuilderStore.getState().sections[sectionKey]!;
    expect(list[0].company).toBe("Acme Corp");
    expect(list[0].role).toBe("Engineer");
    expect(list[0].bullets).toEqual([""]);
  });

  it("fills the role from the suggestion list", async () => {
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);
    await userEvent.click(screen.getByText(new RegExp(`\\+ Add (experience|role)`)));
    await userEvent.click(screen.getByPlaceholderText(/Software Engineer, Pharmacist, Architect/));
    await userEvent.click(screen.getByRole("option", { name: "Software Engineer" }));
    expect(useBuilderStore.getState().sections[sectionKey]![0].role).toBe("Software Engineer");
  });

  it("shows required-field errors after blur", async () => {
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);
    await userEvent.click(screen.getByText(new RegExp(`\\+ Add (experience|role)`)));
    await userEvent.click(screen.getByPlaceholderText("Acme Corp"));
    await userEvent.tab();
    expect(screen.getByText("Enter the company or organization.")).toBeInTheDocument();
  });

  it("adds and removes bullets", async () => {
    act(() => {
      useBuilderStore.getState().addListItem(sectionKey, { company: "Acme", role: "Eng", startDate: "2020-01", bullets: [""] });
    });
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);

    await userEvent.type(screen.getByPlaceholderText("Shipped a feature that increased signups by 12%"), "Did a thing");
    expect(useBuilderStore.getState().sections[sectionKey]![0].bullets).toEqual(["Did a thing"]);

    await userEvent.click(screen.getByText("+ Add bullet"));
    expect(useBuilderStore.getState().sections[sectionKey]![0].bullets).toEqual(["Did a thing", ""]);

    const removeBulletButtons = screen.getAllByRole("button", { name: "Remove bullet" });
    await userEvent.click(removeBulletButtons[removeBulletButtons.length - 1]);
    expect(useBuilderStore.getState().sections[sectionKey]![0].bullets).toEqual(["Did a thing"]);
  });

  it("shows a skipped notice, and shows the form again once un-skipped elsewhere", () => {
    act(() => useBuilderStore.getState().toggleSkipSection(sectionKey));
    const { rerender } = render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);
    expect(screen.getByText(new RegExp(`${title} is skipped`))).toBeInTheDocument();

    act(() => useBuilderStore.getState().toggleSkipSection(sectionKey));
    rerender(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);
    expect(useBuilderStore.getState().sectionStatus[sectionKey]).not.toBe("skipped");
    expect(screen.queryByText(new RegExp(`${title} is skipped`))).not.toBeInTheDocument();
  });

  it("removes a whole entry", async () => {
    act(() => {
      useBuilderStore.getState().addListItem(sectionKey, { company: "Acme", role: "Eng", startDate: "2020-01", bullets: [] });
    });
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useBuilderStore.getState().sections[sectionKey]).toEqual([]);
  });

  it("replaces bullets with the AI-optimized version on success", async () => {
    mockOptimize.mockResolvedValue(["Shipped a rewritten bullet"]);
    act(() => {
      useBuilderStore.getState().addListItem(sectionKey, { company: "Acme", role: "Eng", startDate: "2020-01", bullets: ["Did a thing"] });
    });
    render(<ExperienceForm sectionKey={sectionKey} title={title} help="help" />);

    await userEvent.click(screen.getByRole("button", { name: /Make ATS-friendly/ }));

    expect(mockOptimize).toHaveBeenCalledWith({ role: "Eng", company: "Acme", bullets: ["Did a thing"] });
    await waitFor(() =>
      expect(useBuilderStore.getState().sections[sectionKey]![0].bullets).toEqual(["Shipped a rewritten bullet"]),
    );
  });

  it("hides the AI button once the free quota is hit", async () => {
    mockOptimize.mockRejectedValue(
      new AiLimitError("The free AI rewrite limit is used up. Try another writing tool, or polish this section yourself."),
    );
    act(() => {
      useBuilderStore.getState().addListItem(sectionKey, { company: "Acme", role: "Eng", startDate: "2020-01", bullets: ["Did a thing"] });
    });
    render(
      <>
        <ExperienceForm sectionKey={sectionKey} title={title} help="help" />
        <ToastHost />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Make ATS-friendly/ }));

    await waitFor(() => expect(screen.queryByRole("button", { name: /Make ATS-friendly/ })).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(/free AI rewrite limit is used up/i);
    expect(Number(localStorage.getItem("ai-optimize-limited-until"))).toBeGreaterThan(Date.now());
  });
});

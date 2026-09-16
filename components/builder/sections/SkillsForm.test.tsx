import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { SkillsForm } from "./SkillsForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("SkillsForm", () => {
  it("adds skills via the chip input and marks the section complete", async () => {
    render(<SkillsForm />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "TypeScript{Enter}");
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("complete");
  });

  it("shows a skipped notice when skipped and restores the input when un-skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("skills"));
    const { rerender } = render(<SkillsForm />);
    expect(screen.getByText(/Skills is skipped/)).toBeInTheDocument();

    act(() => useBuilderStore.getState().toggleSkipSection("skills"));
    rerender(<SkillsForm />);
    expect(screen.getByPlaceholderText("Add a skill, press Enter")).toBeInTheDocument();
  });
});

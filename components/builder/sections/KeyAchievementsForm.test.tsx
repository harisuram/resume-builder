import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { KeyAchievementsForm } from "./KeyAchievementsForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("KeyAchievementsForm", () => {
  it("adds an achievement and marks the section complete", async () => {
    render(<KeyAchievementsForm />);
    await userEvent.click(screen.getByText("+ Add achievement"));
    expect(screen.getByPlaceholderText("Grew the customer base by 40% in under a year")).toHaveFocus();
    await userEvent.type(
      screen.getByPlaceholderText("Grew the customer base by 40% in under a year"),
      "Shipped the v2 platform three months ahead of schedule",
    );

    expect(useBuilderStore.getState().sections.keyAchievements).toEqual([
      "Shipped the v2 platform three months ahead of schedule",
    ]);
    expect(useBuilderStore.getState().sectionStatus.keyAchievements).toBe("complete");
  });

  it("asks for text after an empty achievement is blurred", async () => {
    render(<KeyAchievementsForm />);
    await userEvent.click(screen.getByText("+ Add achievement"));
    await userEvent.click(screen.getByPlaceholderText("Grew the customer base by 40% in under a year"));
    await userEvent.tab();
    expect(screen.getByText("Enter an achievement, or remove this line.")).toBeInTheDocument();
  });

  it("supports multiple achievements, edited independently", async () => {
    act(() => useBuilderStore.getState().setKeyAchievements(["First win", "Second win"]));
    render(<KeyAchievementsForm />);

    const inputs = screen.getAllByDisplayValue(/win/);
    expect(inputs).toHaveLength(2);
    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], "Updated win");

    expect(useBuilderStore.getState().sections.keyAchievements).toEqual(["First win", "Updated win"]);
  });

  it("removes an achievement", async () => {
    act(() => useBuilderStore.getState().setKeyAchievements(["Keep this", "Remove this"]));
    render(<KeyAchievementsForm />);

    const removeButtons = screen.getAllByRole("button", { name: "Remove achievement" });
    await userEvent.click(removeButtons[1]);

    expect(useBuilderStore.getState().sections.keyAchievements).toEqual(["Keep this"]);
  });

  it("shows a skipped notice when skipped, and the form again once un-skipped elsewhere", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("keyAchievements"));
    const { rerender } = render(<KeyAchievementsForm />);
    expect(screen.getByText(/Key achievements is skipped/)).toBeInTheDocument();
    expect(screen.queryByText("+ Add achievement")).not.toBeInTheDocument();

    act(() => useBuilderStore.getState().toggleSkipSection("keyAchievements"));
    rerender(<KeyAchievementsForm />);
    expect(screen.getByText("+ Add achievement")).toBeInTheDocument();
  });
});

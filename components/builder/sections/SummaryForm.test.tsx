import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { SummaryForm } from "./SummaryForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("SummaryForm", () => {
  it("labels the step Summary", () => {
    render(<SummaryForm />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("updates the store as the textarea is typed into", async () => {
    render(<SummaryForm />);
    await userEvent.type(screen.getByRole("textbox"), "Backend engineer.");
    expect(useBuilderStore.getState().sections.summary).toBe("Backend engineer.");
    expect(useBuilderStore.getState().sectionStatus.summary).toBe("complete");
  });

  it("shows a skipped notice when skipped", () => {
    act(() => {
      useBuilderStore.getState().toggleSkipSection("summary");
    });
    render(<SummaryForm />);
    expect(screen.getByText(/Summary is skipped/)).toBeInTheDocument();
  });
});

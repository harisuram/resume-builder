import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiLimitError, optimizeSummary } from "@/lib/ai";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { ToastHost } from "@/components/ui/Toast";
import { SummaryForm } from "./SummaryForm";

jest.mock("../../../lib/ai", () => ({
  AiLimitError: class AiLimitError extends Error {},
  AI_LIMITED_UNTIL_KEY: "ai-optimize-limited-until",
  AI_BACKOFF_MS: 4 * 60 * 60 * 1000,
  optimizeSummary: jest.fn(),
}));
const mockOptimize = optimizeSummary as jest.Mock;

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
  mockOptimize.mockReset();
  localStorage.clear();
  useToastStore.getState().clear();
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

  it("does not show a length error for a normal summary", async () => {
    render(<SummaryForm />);
    await userEvent.type(screen.getByRole("textbox"), "Backend engineer.");
    await userEvent.tab();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a skipped notice when skipped", () => {
    act(() => {
      useBuilderStore.getState().toggleSkipSection("summary");
    });
    render(<SummaryForm />);
    expect(screen.getByText(/Summary is skipped/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Make ATS-friendly/ })).not.toBeInTheDocument();
  });

  it("disables the ATS button until the summary has text", () => {
    render(<SummaryForm />);
    expect(screen.getByRole("button", { name: /Make ATS-friendly/ })).toBeDisabled();
  });

  it("replaces the summary with the AI-optimized version on success", async () => {
    mockOptimize.mockResolvedValue("Staff backend engineer specializing in payments.");
    act(() => {
      useBuilderStore.getState().setSummary("I work on backends.");
    });
    render(<SummaryForm />);

    await userEvent.click(screen.getByRole("button", { name: /Make ATS-friendly/ }));

    expect(mockOptimize).toHaveBeenCalledWith("I work on backends.");
    await waitFor(() =>
      expect(useBuilderStore.getState().sections.summary).toBe("Staff backend engineer specializing in payments."),
    );
  });

  it("hides the AI button once the free quota is hit", async () => {
    mockOptimize.mockRejectedValue(
      new AiLimitError("The free AI rewrite limit is used up. Try another writing tool, or polish this section yourself."),
    );
    act(() => {
      useBuilderStore.getState().setSummary("Backend engineer.");
    });
    render(
      <>
        <SummaryForm />
        <ToastHost />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Make ATS-friendly/ }));

    await waitFor(() => expect(screen.queryByRole("button", { name: /Make ATS-friendly/ })).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(/free AI rewrite limit is used up/i);
    expect(Number(localStorage.getItem("ai-optimize-limited-until"))).toBeGreaterThan(Date.now());
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { saveResumeData } from "@/lib/storage";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { useBuilderStore } from "@/lib/store";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { BuilderShell } from "./BuilderShell";
import { BuilderTour } from "./BuilderTour";

beforeEach(() => {
  localStorage.clear();
  useBuilderStore.getState().resetStore();
});

describe("BuilderTour", () => {
  it("walks through switches, page order, and the page separator", async () => {
    const onDismiss = jest.fn();
    render(<BuilderTour open onDismiss={onDismiss} />);

    expect(screen.getByRole("dialog", { name: /skip what this resume/i })).toBeInTheDocument();
    expect(screen.getByText(/every section has a switch/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /this list is the page order/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /keep a section from splitting/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start building" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("lets the user skip from any step", async () => {
    const onDismiss = jest.fn();
    render(<BuilderTour open onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("skips on Escape", async () => {
    const onDismiss = jest.fn();
    render(<BuilderTour open onDismiss={onDismiss} />);
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("BuilderShell first-run tour", () => {
  it("shows the tour when local storage has no section values", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("dialog", { name: /skip what this resume/i })).toBeInTheDocument();
  });

  it("does not show the tour when a saved section already has a value", async () => {
    saveResumeData(makeFullResumeData());
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.queryByRole("dialog", { name: /skip what this resume/i })).not.toBeInTheDocument();
  });

  it("records a skip so an empty draft does not replay the tour", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("button", { name: "Skip tour" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(screen.queryByRole("dialog", { name: /skip what this resume/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(TOUR_DISMISSED_KEY)).toBe("1");
  });
});

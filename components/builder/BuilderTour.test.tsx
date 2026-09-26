import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { saveResumeData } from "@/lib/storage";
import { BUILDER_TOUR_MEDIA, TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { useBuilderStore } from "@/lib/store";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { BuilderShell } from "./BuilderShell";
import { BuilderTour } from "./BuilderTour";

beforeEach(() => {
  localStorage.clear();
  useBuilderStore.getState().resetStore();
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === BUILDER_TOUR_MEDIA,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

describe("BuilderTour", () => {
  it("walks through switches, page order, and the page separator", async () => {
    const onDismiss = jest.fn();
    render(<BuilderTour open onDismiss={onDismiss} />);

    expect(screen.getByRole("dialog", { name: /skip what this resume/i })).toBeInTheDocument();
    expect(screen.getByText(/every section has a switch/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /drag a section to set the page order/i })).toBeInTheDocument();
    expect(screen.getByText(/grab the dotted handle/i)).toBeInTheDocument();
    expect(screen.getByText(/drag the handle to reorder/i)).toBeInTheDocument();

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

  it("asks for a resume file instead of touring when arriving from Import my resume", async () => {
    window.history.replaceState({}, "", "/builder?import=1");
    render(<BuilderShell />);
    const prompt = await screen.findByRole("dialog", { name: "Start from your own resume" });
    expect(prompt).toHaveTextContent(/PDF, Word/);
    expect(screen.queryByRole("dialog", { name: /skip what this resume/i })).not.toBeInTheDocument();
    // A refresh won't ask again.
    expect(window.location.search).toBe("");

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const click = jest.spyOn(input, "click");
    await userEvent.click(screen.getByRole("button", { name: "Choose a file" }));
    expect(click).toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Start from your own resume" })).not.toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });

  it("lets the visitor start from scratch instead", async () => {
    window.history.replaceState({}, "", "/builder?import=1");
    render(<BuilderShell />);
    await screen.findByRole("dialog", { name: "Start from your own resume" });
    await userEvent.click(screen.getByRole("button", { name: "Start from scratch" }));
    expect(screen.queryByRole("dialog", { name: "Start from your own resume" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Basic info" })).toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });

  it("does not show the tour on a mobile viewport", async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();
  });

  it("closes the tour when the viewport shrinks below md", async () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const media = {
      matches: true,
      media: BUILDER_TOUR_MEDIA,
      addEventListener: (_event: string, cb: (event: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
      removeEventListener: jest.fn(),
    };
    window.matchMedia = jest.fn().mockReturnValue(media);
    render(<BuilderShell />);
    expect(await screen.findByRole("dialog", { name: /skip what this resume/i })).toBeInTheDocument();
    media.matches = false;
    act(() => {
      listeners.forEach((cb) => cb({ matches: false } as MediaQueryListEvent));
    });
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();
  });

  it("does not show the tour when a saved section already has a value", async () => {
    saveResumeData(makeFullResumeData());
    render(<BuilderShell />);
    await screen.findByRole("heading", { name: "Basic info" });
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();
  });

  it("records a skip so an empty draft does not replay the tour", async () => {
    render(<BuilderShell />);
    expect(await screen.findByRole("button", { name: "Skip tour" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();
    expect(localStorage.getItem(TOUR_DISMISSED_KEY)).toBe("1");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  dismissMobileBuilderTour,
  MOBILE_TOUR_DISMISSED_KEY,
  shouldOfferMobileBuilderTour,
  TOUR_DISMISSED_KEY,
} from "@/lib/builderTour";
import { saveResumeData } from "@/lib/storage";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { MobileBuilderTour } from "./MobileBuilderTour";

beforeEach(() => {
  localStorage.clear();
  jest.useRealTimers();
});

describe("MobileBuilderTour", () => {
  it("walks the menu, the bottom bar, preview, then finishes", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onDismiss = jest.fn();
    render(<MobileBuilderTour open onDismiss={onDismiss} />);

    expect(screen.getByRole("dialog", { name: /every section lives in the menu/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /save & next, one step at a time/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /peek at the real page/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: /save & next/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /you're ready to build/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start building" }));
    jest.advanceTimersByTime(300);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("can be skipped from the first card", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onDismiss = jest.fn();
    render(<MobileBuilderTour open onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: "Skip tour" }));
    jest.advanceTimersByTime(300);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(<MobileBuilderTour open={false} onDismiss={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("shouldOfferMobileBuilderTour", () => {
  it("is offered on a first visit and remembered once dismissed", () => {
    expect(shouldOfferMobileBuilderTour()).toBe(true);
    dismissMobileBuilderTour();
    expect(localStorage.getItem(MOBILE_TOUR_DISMISSED_KEY)).toBe("1");
    expect(shouldOfferMobileBuilderTour()).toBe(false);
  });

  it("is independent of the desktop tour flag", () => {
    localStorage.setItem(TOUR_DISMISSED_KEY, "1");
    expect(shouldOfferMobileBuilderTour()).toBe(true);
  });

  it("is not offered when a draft already has content", () => {
    saveResumeData(makeFullResumeData());
    expect(shouldOfferMobileBuilderTour()).toBe(false);
  });
});

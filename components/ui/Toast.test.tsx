import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TOAST_DISMISS_MS, showToast, useToastStore } from "@/lib/toast";
import { ToastHost } from "./Toast";

beforeEach(() => {
  act(() => useToastStore.getState().clear());
});

afterEach(() => {
  act(() => useToastStore.getState().clear());
});

describe("ToastHost", () => {
  it("renders nothing until a toast is shown", () => {
    const { container } = render(<ToastHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a failed-action toast as an alert at the top of the screen", () => {
    render(<ToastHost />);
    act(() => showToast("Couldn't open the print dialog. Try again."));
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveTextContent("Couldn't open the print dialog. Try again.");
    expect(region.className).toContain("top-[");
    expect(region.className).not.toContain("bottom-");
  });

  it("dismisses when the close button is clicked", async () => {
    render(<ToastHost />);
    act(() => showToast("That image is too large — try one under 8MB."));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses itself after a few seconds", () => {
    jest.useFakeTimers();
    render(<ToastHost />);
    act(() => showToast("Couldn't save this resume on this device."));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(TOAST_DISMISS_MS);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});

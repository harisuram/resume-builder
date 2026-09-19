import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useToastStore } from "@/lib/toast";
import { ToastHost } from "@/components/ui/Toast";
import { CopyBulletsButton, formatBulletsForClipboard } from "./CopyBulletsButton";

describe("formatBulletsForClipboard", () => {
  it("formats non-empty bullets as a markdown list", () => {
    expect(formatBulletsForClipboard(["  Did a thing ", "", "Shipped it"])).toBe(
      "- Did a thing\n- Shipped it",
    );
  });

  it("returns an empty string when nothing is filled", () => {
    expect(formatBulletsForClipboard(["", "  "])).toBe("");
  });
});

describe("CopyBulletsButton", () => {
  const writeText = jest.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    useToastStore.getState().clear();
  });

  it("is hidden until there are at least two bullet rows", () => {
    const { rerender } = render(<CopyBulletsButton bullets={["Only one"]} />);
    expect(screen.queryByRole("button", { name: /Copy all points/i })).not.toBeInTheDocument();

    rerender(<CopyBulletsButton bullets={["One", "Two"]} />);
    expect(screen.getByRole("button", { name: /Copy all points/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy all points/i })).toHaveTextContent("Copy all points");
  });

  it("copies filled bullets", async () => {
    render(<CopyBulletsButton bullets={["Did a thing", "Shipped it", ""]} />);
    await userEvent.click(screen.getByRole("button", { name: /Copy all points/i }));

    expect(writeText).toHaveBeenCalledWith("- Did a thing\n- Shipped it");
  });

  it("stays disabled when every bullet is blank", () => {
    render(<CopyBulletsButton bullets={["", ""]} />);
    expect(screen.getByRole("button", { name: /Copy all points/i })).toBeDisabled();
  });

  it("toasts when the clipboard API fails", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(
      <>
        <CopyBulletsButton bullets={["A", "B"]} />
        <ToastHost />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: /Copy all points/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't copy bullets/i));
  });
});

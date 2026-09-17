import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { MobilePreviewSheet } from "./MobilePreviewSheet";

beforeEach(() => {
  useBuilderStore.getState().resetStore();
});

describe("MobilePreviewSheet", () => {
  it("shows the live preview and template picker", () => {
    render(<MobilePreviewSheet onClose={jest.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Resume preview" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.className).toContain("md:hidden");
    expect(within(dialog).getByRole("button", { name: "Choose a template" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue editing" })).toBeInTheDocument();
  });

  it("closes from the header control", async () => {
    const onClose = jest.fn();
    render(<MobilePreviewSheet onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Close preview" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("closes from Continue editing", async () => {
    const onClose = jest.fn();
    render(<MobilePreviewSheet onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue editing" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    render(<MobilePreviewSheet onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("does not dismiss on Escape while the template list is open", async () => {
    const onClose = jest.fn();
    render(<MobilePreviewSheet onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a template" }));
    expect(screen.getByRole("listbox", { name: "Templates" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox", { name: "Templates" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Resume preview" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

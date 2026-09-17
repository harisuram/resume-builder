import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog open={false} title="Start over?" description="This can't be undone." onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("portals onto the document so it can center on the viewport", () => {
    const { container } = render(
      <header className="backdrop-blur-xl">
        <ConfirmDialog open title="Start over?" description="This can't be undone." onConfirm={() => {}} onCancel={() => {}} />
      </header>,
    );
    const dialog = screen.getByRole("dialog", { name: "Start over?" });
    expect(dialog.parentElement).toBe(document.body);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog.className).toContain("items-center");
    expect(dialog.className).toContain("justify-center");
    expect(dialog.className).toContain("fixed");
    expect(dialog.className).toContain("inset-0");
  });

  it("shows the title and description when open", () => {
    render(
      <ConfirmDialog open title="Start over?" description="This can't be undone." onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByRole("dialog", { name: "Start over?" })).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm and onCancel from their respective buttons", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Start over?"
        description="This can't be undone."
        confirmLabel="Clear it"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Clear it" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses custom cancel copy and a primary confirm when asked", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Save this resume?"
        description="Stored only in this browser."
        confirmLabel="Yes, save it"
        cancelLabel="No, don’t save"
        confirmVariant="primary"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "No, don’t save" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Yes, save it" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses contained button styles for both actions", () => {
    render(
      <ConfirmDialog
        open
        title="Start over?"
        description="This can't be undone."
        confirmLabel="Clear it"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Clear it" });
    expect(cancel.className).toContain("border");
    expect(cancel.className).toContain("bg-[var(--color-surface)]");
    expect(confirm.className).toContain("bg-red-600");
  });
});

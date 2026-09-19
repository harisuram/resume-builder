import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteIconButton, RemoveEntryIcon, TrashIcon } from "./DeleteIconButton";

describe("DeleteIconButton", () => {
  it("renders a labeled icon button with no visible Remove text", () => {
    render(<DeleteIconButton aria-label="Remove" onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Remove" });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent("Remove");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onClick when activated", async () => {
    const onClick = jest.fn();
    render(<DeleteIconButton aria-label="Remove bullet" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove bullet" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("exports a trash icon for reuse", () => {
    const { container } = render(<TrashIcon className="h-4 w-4" />);
    expect(container.querySelector("svg")).toHaveClass("h-4", "w-4");
  });

  it("uses a circle-X icon for entry cards", () => {
    const { container: iconOnly } = render(<RemoveEntryIcon className="h-4 w-4" />);
    expect(iconOnly.querySelector("circle")).toBeInTheDocument();

    render(<DeleteIconButton icon="entry" aria-label="Remove" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Remove" }).querySelector("circle")).toBeInTheDocument();
  });
});

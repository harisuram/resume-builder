import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("reflects the checked state via aria-checked", () => {
    render(<Switch checked label="Skip section" onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the inverted value when clicked", async () => {
    const onChange = jest.fn();
    render(<Switch checked label="Skip section" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("uses the label as the accessible name", () => {
    render(<Switch checked={false} label="Include Skills" onChange={() => {}} />);
    expect(screen.getByRole("switch", { name: "Include Skills" })).toBeInTheDocument();
  });
});

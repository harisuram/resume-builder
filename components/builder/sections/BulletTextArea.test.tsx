import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletTextArea } from "./BulletTextArea";

describe("BulletTextArea", () => {
  it("wraps long text in a textarea and keeps Enter from inserting newlines", async () => {
    const onChange = jest.fn();
    render(
      <BulletTextArea
        value="Short"
        onChange={onChange}
        aria-label="Bullet 1"
        placeholder="Shipped a feature that increased signups by 12%"
      />,
    );
    const field = screen.getByRole("textbox", { name: "Bullet 1" });
    expect(field.tagName).toBe("TEXTAREA");
    expect(field).toHaveClass("overflow-hidden");

    await userEvent.type(field, "{Enter}x");
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0] as string;
    expect(last).not.toContain("\n");
  });

  it("focuses when autoFocus is set", () => {
    render(<BulletTextArea value="" onChange={() => {}} aria-label="Bullet 1" autoFocus />);
    expect(screen.getByRole("textbox", { name: "Bullet 1" })).toHaveFocus();
  });
});

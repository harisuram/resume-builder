import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemCard, useFocusNewIndex } from "./ItemCard";

function Harness({ initial = [] as string[] }) {
  const [items, setItems] = useState(initial);
  const { focusIndex, focusNew } = useFocusNewIndex();
  return (
    <>
      {items.map((value, i) => (
        <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => setItems(items.filter((_, idx) => idx !== i))}>
          <input aria-label={`Name ${i}`} value={value} onChange={() => {}} />
          <input aria-label={`Other ${i}`} value="" onChange={() => {}} />
        </ItemCard>
      ))}
      <button
        type="button"
        onClick={() => {
          focusNew(items.length);
          setItems([...items, ""]);
        }}
      >
        + Add
      </button>
    </>
  );
}

describe("ItemCard autoFocus", () => {
  it("does not steal focus for items that were already in the list", () => {
    render(<Harness initial={["Existing"]} />);
    expect(screen.getByLabelText("Name 0")).not.toHaveFocus();
  });

  it("focuses the first field of a newly added card", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add" }));
    expect(screen.getByLabelText("Name 0")).toHaveFocus();
  });

  it("moves focus to the newest card when another is added", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add" }));
    await userEvent.click(screen.getByRole("button", { name: "+ Add" }));
    expect(screen.getByLabelText("Name 1")).toHaveFocus();
    expect(screen.getByLabelText("Name 0")).not.toHaveFocus();
  });
});

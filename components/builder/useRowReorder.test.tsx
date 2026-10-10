import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { useRowReorder } from "./useRowReorder";

const ROW_HEIGHT = 40;

// jsdom has no PointerEvent, so fireEvent.pointer* would build a bare Event
// and drop clientY/button. MouseEvent carries both.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {}
  Object.assign(window, { PointerEvent: PointerEventPolyfill });
}

/** A bare list driven by the hook: rows stacked 40px apart, a grip each. */
function List({ initial, locked = [], onReorder }: { initial: string[]; locked?: string[]; onReorder?: jest.Mock }) {
  const [keys, setKeys] = useState(initial);
  const { draggingKey, droppedKey, startDrag, rowRef } = useRowReorder({
    keys,
    isLocked: (key) => locked.includes(key),
    onReorder: (key, toIndex) => {
      onReorder?.(key, toIndex);
      setKeys((current) => {
        const next = current.filter((k) => k !== key);
        next.splice(toIndex, 0, key);
        return next;
      });
    },
  });
  return (
    <ul>
      {keys.map((key, i) => (
        <li
          key={key}
          data-testid={`row-${key}`}
          data-dragging={draggingKey === key || undefined}
          data-dropped={droppedKey === key || undefined}
          ref={(node) => {
            rowRef(key)(node);
            if (node) node.getBoundingClientRect = () => ({ top: i * ROW_HEIGHT, height: ROW_HEIGHT }) as DOMRect;
          }}
        >
          <button type="button" aria-label={`grip ${key}`} onPointerDown={(e) => startDrag(key, e)} />
          {key}
        </li>
      ))}
    </ul>
  );
}

const order = () => screen.getAllByRole("listitem").map((li) => li.textContent);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function drag(key: string, fromY: number, toY: number) {
  fireEvent.pointerDown(screen.getByRole("button", { name: `grip ${key}` }), { clientY: fromY, button: 0 });
  fireEvent.pointerMove(window, { clientY: fromY + 10 });
  fireEvent.pointerMove(window, { clientY: toY });
}

describe("useRowReorder", () => {
  it("drags a row to a new slot, commits once it settles, and pulses the drop", () => {
    const onReorder = jest.fn();
    render(<List initial={["a", "b", "c", "d"]} onReorder={onReorder} />);
    drag("a", 5, 125);
    expect(screen.getByTestId("row-a")).toHaveAttribute("data-dragging");
    expect(document.body.classList.contains("nav-section-dragging")).toBe(true);
    // Rows between the old and new slot shift up by one row height.
    expect(screen.getByTestId("row-b").style.transform).toBe(`translate3d(0, -${ROW_HEIGHT}px, 0)`);

    fireEvent.pointerUp(window);
    expect(onReorder).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(300));
    expect(onReorder).toHaveBeenCalledWith("a", 3);
    expect(order()).toEqual(["b", "c", "d", "a"]);
    expect(screen.getByTestId("row-a")).toHaveAttribute("data-dropped");
    expect(screen.getByTestId("row-a").style.transform).toBe("");
    expect(document.body.classList.contains("nav-section-dragging")).toBe(false);
    act(() => jest.advanceTimersByTime(400));
    expect(screen.getByTestId("row-a")).not.toHaveAttribute("data-dropped");
  });

  it("treats a press without movement as a click, not a drag", () => {
    const onReorder = jest.fn();
    render(<List initial={["a", "b"]} onReorder={onReorder} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: "grip a" }), { clientY: 5, button: 0 });
    fireEvent.pointerMove(window, { clientY: 7 });
    fireEvent.pointerUp(window);
    act(() => jest.advanceTimersByTime(300));
    expect(onReorder).not.toHaveBeenCalled();
    expect(screen.getByTestId("row-a")).not.toHaveAttribute("data-dragging");
  });

  it("cancels on Escape and puts the row back", () => {
    const onReorder = jest.fn();
    render(<List initial={["a", "b", "c"]} onReorder={onReorder} />);
    drag("a", 5, 85);
    fireEvent.keyDown(window, { key: "Escape" });
    act(() => jest.advanceTimersByTime(300));
    expect(onReorder).not.toHaveBeenCalled();
    expect(order()).toEqual(["a", "b", "c"]);
    expect(screen.getByTestId("row-a")).not.toHaveAttribute("data-dragging");
  });

  it("won't pick up a locked row, or start from a non-primary button", () => {
    const onReorder = jest.fn();
    render(<List initial={["a", "b", "c"]} locked={["a"]} onReorder={onReorder} />);
    drag("a", 5, 85);
    fireEvent.pointerUp(window);
    fireEvent.pointerDown(screen.getByRole("button", { name: "grip b" }), { clientY: 45, button: 2 });
    fireEvent.pointerMove(window, { clientY: 100 });
    fireEvent.pointerUp(window);
    act(() => jest.advanceTimersByTime(300));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("dropping back in place commits nothing", () => {
    const onReorder = jest.fn();
    render(<List initial={["a", "b", "c"]} onReorder={onReorder} />);
    drag("b", 45, 50);
    fireEvent.pointerUp(window);
    act(() => jest.advanceTimersByTime(300));
    expect(onReorder).not.toHaveBeenCalled();
    expect(screen.getByTestId("row-b")).not.toHaveAttribute("data-dropped");
  });
});

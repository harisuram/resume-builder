import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { MobileSectionDrawer } from "./MobileSectionDrawer";

beforeEach(() => {
  useBuilderStore.getState().resetStore();
});

describe("MobileSectionDrawer", () => {
  it("shows the resume's sections by default, with no way into the cover letter", () => {
    render(<MobileSectionDrawer open active="basicInfo" onSelect={jest.fn()} onClose={jest.fn()} />);
    const menu = screen.getByRole("dialog", { name: "Sections" });
    expect(within(menu).getByRole("navigation", { name: "Resume sections" })).toBeInTheDocument();
    expect(within(menu).queryByRole("link", { name: /cover letter/i })).not.toBeInTheDocument();
  });

  it("draws another builder's nav and hands its pick back once the menu has closed", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(
      <MobileSectionDrawer<"one" | "two">
        open
        active="one"
        onSelect={onSelect}
        onClose={onClose}
        renderNav={(select) => (
          <nav aria-label="Letter steps">
            <button type="button" onClick={() => select("two")}>
              Two
            </button>
          </nav>
        )}
      />,
    );
    const menu = screen.getByRole("dialog", { name: "Sections" });
    expect(within(menu).queryByRole("navigation", { name: "Resume sections" })).not.toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("button", { name: "Two" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSelect).toHaveBeenCalledWith("two");
  });
});

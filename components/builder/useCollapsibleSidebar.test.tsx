import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarToggleIcon, useCollapsibleSidebar } from "./useCollapsibleSidebar";

function Harness() {
  const { railMode, toggle } = useCollapsibleSidebar();
  return (
    <button type="button" aria-expanded={!railMode} aria-label={railMode ? "Expand sidebar" : "Collapse sidebar"} onClick={toggle}>
      <SidebarToggleIcon collapsed={railMode} />
    </button>
  );
}

describe("useCollapsibleSidebar", () => {
  it("ignores a keydown that has no key", () => {
    render(<Harness />);
    expect(() => window.dispatchEvent(new Event("keydown"))).not.toThrow();
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles on Ctrl+B", async () => {
    render(<Harness />);
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
  });
});

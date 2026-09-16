import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("puts a dark-mode toggle in the nav next to the builder CTA", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: /switch to (dark|light) mode/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start building" })).toHaveAttribute("href", "/builder");
  });
});

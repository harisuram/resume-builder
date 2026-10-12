import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("shows the site name in the home nav", () => {
    render(<SiteHeader home />);
    expect(screen.getByText("Free Resume Builder")).not.toHaveClass("max-md:sr-only");
  });

  it("puts a dark-mode toggle in the nav next to the builder CTA", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: /switch to (dark|light) mode/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start building" })).toHaveAttribute("href", "/builder");
  });
});

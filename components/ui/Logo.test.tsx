import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders as a link to the given href by default", () => {
    render(<Logo />);
    expect(screen.getByRole("link", { name: "Free Resume Builder" })).toHaveAttribute("href", "/");
  });

  it("hides the wordmark on phones when asked, and keeps the link name", () => {
    render(<Logo hideNameOnMobile />);
    const name = screen.getByText("Free Resume Builder");
    expect(name).toHaveClass("max-md:sr-only");
    expect(screen.getByRole("link", { name: "Free Resume Builder" })).toBeInTheDocument();
  });

  it("renders as plain (unlinked) content when href is empty", () => {
    render(<Logo href="" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Free Resume Builder")).toBeInTheDocument();
  });
});

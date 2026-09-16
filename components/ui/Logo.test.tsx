import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders as a link to the given href by default", () => {
    render(<Logo />);
    expect(screen.getByRole("link", { name: "Free Resume Builder" })).toHaveAttribute("href", "/");
  });

  it("renders as plain (unlinked) content when href is empty", () => {
    render(<Logo href="" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Free Resume Builder")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import AboutPage from "./page";
import { TEMPLATE_COUNT_WORDS } from "@/lib/seo";

describe("about page", () => {
  it("states the live template count", () => {
    render(<AboutPage />);
    expect(screen.getByText(new RegExp(`${TEMPLATE_COUNT_WORDS} templates share one preview`))).toBeInTheDocument();
    expect(screen.queryByText(/Thirty-one/)).not.toBeInTheDocument();
  });
});

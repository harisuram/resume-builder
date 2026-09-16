import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";
import { FOOTER_LINKS } from "@/lib/seo";

describe("SiteFooter", () => {
  it("links every indexable marketing page", () => {
    render(<SiteFooter />);
    for (const link of FOOTER_LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
    expect(screen.queryByRole("link", { name: /builder/i })).not.toBeInTheDocument();
  });
});

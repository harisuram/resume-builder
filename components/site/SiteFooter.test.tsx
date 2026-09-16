import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";
import { FOOTER_LINKS, FOOTER_NOTE, FOOTER_TAGLINE, SITE_NAME } from "@/lib/seo";

describe("SiteFooter", () => {
  it("links every indexable marketing page", () => {
    render(<SiteFooter />);
    for (const link of FOOTER_LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
    expect(screen.queryByRole("link", { name: /builder/i })).not.toBeInTheDocument();
  });

  it("describes the product as it works today", () => {
    render(<SiteFooter />);
    expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    expect(screen.getByText(FOOTER_TAGLINE)).toBeInTheDocument();
    expect(screen.getByText(FOOTER_NOTE)).toBeInTheDocument();
    expect(FOOTER_TAGLINE).toMatch(/pharmacy|architecture|construction/i);
  });
});

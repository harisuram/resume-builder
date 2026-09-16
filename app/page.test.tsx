import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { HOME_FAQS } from "@/lib/seo";

describe("homepage", () => {
  it("uses a make-a-resume heading and the shared FAQ copy", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /make a resume/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Build my resume" })).toHaveAttribute("href", "/builder");
    for (const faq of HOME_FAQS) {
      expect(screen.getByRole("heading", { name: faq.question })).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it("points at the cluster pages without stuffing extra routes into the CTA", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Browse templates" })).toHaveAttribute("href", "/templates");
    expect(screen.getByRole("link", { name: "How private this is" })).toHaveAttribute("href", "/private");
    expect(
      screen.getAllByRole("link", { name: /how to make a resume/i }).some((el) => el.getAttribute("href") === "/how-to-make-a-resume"),
    ).toBe(true);
    expect(screen.getByRole("link", { name: "ATS-friendly resumes" })).toHaveAttribute("href", "/ats");
  });
});

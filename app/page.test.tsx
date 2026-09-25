import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { HOME_FAQS, TEMPLATE_COUNT_WORDS } from "@/lib/seo";

describe("homepage", () => {
  it("shows the live template count in the strip and the feature copy", () => {
    render(<Home />);
    expect(screen.getByText(`${TEMPLATES.length} templates`)).toBeInTheDocument();
    expect(screen.getByText(`${TEMPLATE_COUNT_WORDS} templates, one live preview`)).toBeInTheDocument();
    expect(screen.queryByText(/Thirty-one/)).not.toBeInTheDocument();
  });

  it("uses a brand-led heading and the shared FAQ copy", () => {
    render(<Home />);
    expect(screen.getAllByText("Free Resume Builder").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole("heading", { level: 1, name: /build the resume[\s\S]*skip what doesn.t belong/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Build my resume" })).toHaveAttribute("href", "/builder");
    for (const faq of HOME_FAQS) {
      expect(screen.getByRole("heading", { name: faq.question })).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it("keeps FAQ answers collapsed until a question is opened", async () => {
    render(<Home />);
    const first = screen.getByRole("button", { name: HOME_FAQS[0].question });
    const second = screen.getByRole("button", { name: HOME_FAQS[1].question });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(HOME_FAQS[0].answer)).not.toBeVisible();

    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(HOME_FAQS[0].answer)).toBeVisible();

    await userEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(HOME_FAQS[1].answer)).toBeVisible();
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

  it("opens the template preview modal from a home-strip card instead of dumping every card onto /templates", async () => {
    render(<Home />);
    const seeAll = screen.getAllByRole("link", { name: "See all templates" });
    expect(seeAll.length).toBeGreaterThan(0);
    for (const link of seeAll) {
      expect(link).toHaveAttribute("href", "/templates");
    }
    expect(screen.queryByRole("link", { name: "Atlas" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Preview Atlas layout" }));
    const dialog = screen.getByRole("dialog", { name: "Atlas" });
    expect(within(dialog).getByText("Summary")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Use this template" })).toHaveAttribute(
      "href",
      "/builder?template=jakes-resume",
    );
  });
});

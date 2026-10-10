import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { HOME_FAQS, TEMPLATE_COUNT_WORDS } from "@/lib/seo";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe("homepage", () => {
  it("puts resume and cover letter side by side as equals, each with its own way in", () => {
    render(<Home />);
    const resume = screen.getByRole("article", { name: "Build your resume" });
    const letter = screen.getByRole("article", { name: "Write your cover letter" });
    expect(resume.parentElement).toBe(letter.parentElement);
    expect(within(resume).getByRole("link", { name: "Build my resume" })).toHaveAttribute("href", "/builder");
    expect(within(resume).getByRole("button", { name: /Import my resume/ })).toBeInTheDocument();
    expect(within(letter).getByRole("link", { name: "Write my cover letter" })).toHaveAttribute("href", "/cover-letter/builder");
    expect(within(letter).getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/cover-letter");
    // Same shape: a picture, a title, a three-point list, two actions.
    for (const card of [resume, letter]) {
      expect(within(card).getAllByRole("listitem")).toHaveLength(3);
      // Two fanned sheets, decorative — the card's text says what it is.
      expect(card.querySelectorAll("img")).toHaveLength(2);
      expect(card.querySelector("img")?.closest("[aria-hidden='true']")).not.toBeNull();
    }
    // Not in the header or footer navigation.
    for (const nav of screen.getAllByRole("navigation")) {
      expect(within(nav).queryByRole("link", { name: /cover letter/i })).not.toBeInTheDocument();
    }
  });

  it("names both products in the heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /free resume & cover letter builder[\s\S]*no sign-up[\s\S]*skip what doesn.t belong/i }),
    ).toBeInTheDocument();
  });

  it("shows a resume and its cover letter as a matching set, restyled together", async () => {
    render(<Home />);
    const set = screen.getByRole("region", { name: "One look, two documents" });
    expect(within(set).getByRole("img", { name: "Resume in the Atlas template" })).toBeInTheDocument();
    expect(within(set).getByRole("img", { name: "Cover letter in the Atlas template" })).toBeInTheDocument();
    await userEvent.click(within(set).getByRole("radio", { name: "Fern" }));
    expect(within(set).getByRole("radio", { name: "Fern" })).toHaveAttribute("aria-checked", "true");
    expect(within(set).getByRole("img", { name: "Resume in the Fern template" })).toBeInTheDocument();
    expect(within(set).getByRole("img", { name: "Cover letter in the Fern template" })).toBeInTheDocument();
  });

  it("has no numbered steps strip — the two product cards already say how to start", () => {
    render(<Home />);
    expect(screen.queryByRole("heading", { name: "Download both" })).not.toBeInTheDocument();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
  });

  it("lets visitors start from the resume they have", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /Import my resume/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Can I start from my existing resume?" })).toBeInTheDocument();
  });

  it("shows the live template count in the strip and the feature copy", () => {
    render(<Home />);
    expect(screen.getByText(`${TEMPLATES.length} templates`)).toBeInTheDocument();
    expect(screen.getByText(`${TEMPLATE_COUNT_WORDS} templates, one live preview`)).toBeInTheDocument();
    expect(screen.queryByText(/Thirty-one/)).not.toBeInTheDocument();
  });

  it("keeps the brand in the header and footer and ships the shared FAQ copy, cover letter questions included", () => {
    render(<Home />);
    expect(screen.getAllByText("Free Resume Builder").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("heading", { name: "Can I make a cover letter too?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Will my cover letter match my resume?" })).toBeInTheDocument();
    for (const faq of HOME_FAQS) {
      expect(screen.getByRole("heading", { name: faq.question })).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it("ships every FAQ answer in the HTML inside a collapsed <details>", async () => {
    const { container } = render(<Home />);
    const panels = container.querySelectorAll('details[name="faq"]');
    expect(panels).toHaveLength(HOME_FAQS.length);
    for (const [i, faq] of HOME_FAQS.entries()) {
      expect(panels[i]).not.toHaveAttribute("open");
      expect(panels[i]).toHaveTextContent(faq.answer);
    }

    await userEvent.click(screen.getByText(HOME_FAQS[0].question));
    expect(panels[0]).toHaveAttribute("open");
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
      "/builder?template=atlas",
    );
  });
});

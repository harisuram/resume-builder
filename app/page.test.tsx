import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { HOME_FAQS, TEMPLATE_COUNT_WORDS } from "@/lib/seo";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe("homepage", () => {
  it("offers resume and cover letter as two equal ways in, with the same shape", () => {
    render(<Home />);
    const resume = screen.getByRole("link", { name: "Build my resume" });
    const letter = screen.getByRole("link", { name: "Write my cover letter" });
    expect(resume).toHaveAttribute("href", "/builder");
    expect(letter).toHaveAttribute("href", "/cover-letter/builder");
    // Same list, same markup: neither reads as the main product.
    expect(resume.closest("ul")).toBe(letter.closest("ul"));
    expect(resume.className).toBe(letter.className);
    expect(resume).toHaveAccessibleDescription(/53 templates|templates/);
    expect(letter).toHaveAccessibleDescription(/same template and details as your resume/i);
    // Not in the header or footer navigation.
    for (const nav of screen.getAllByRole("navigation")) {
      expect(within(nav).queryByRole("link", { name: /cover letter/i })).not.toBeInTheDocument();
    }
  });

  it("keeps the search terms in a plain-spoken heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /a free resume builder, and a cover letter to match/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No sign-up, no watermark, nothing to pay at the download button/)).toBeInTheDocument();
  });

  it("lets visitors start from the resume they have", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "import it" })).toBeInTheDocument();
    expect(screen.getByTestId("home-import-input")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Can I start from my existing resume?" })).toBeInTheDocument();
  });

  it("says plainly what the site doesn't do", () => {
    render(<Home />);
    const section = screen.getByRole("region", { name: "What you won’t find here" });
    for (const item of ["A sign-up form.", "A watermark.", "A paywall at the download button.", "Your resume on a server."]) {
      expect(within(section).getByText(item)).toBeInTheDocument();
    }
    expect(within(section).getByRole("link", { name: "How private it is" })).toHaveAttribute("href", "/private");
  });

  it("shows a resume and its cover letter as a matching set, restyled together", async () => {
    render(<Home />);
    const set = screen.getByRole("region", { name: "Pick a look once. Both pages follow." });
    expect(within(set).getByRole("img", { name: "Resume in the Fern template" })).toBeInTheDocument();
    expect(within(set).getByRole("img", { name: "Cover letter in the Fern template" })).toBeInTheDocument();
    await userEvent.click(within(set).getByRole("radio", { name: "Marquee" }));
    expect(within(set).getByRole("radio", { name: "Marquee" })).toHaveAttribute("aria-checked", "true");
    expect(within(set).getByRole("radio", { name: "Fern" })).toHaveAttribute("aria-checked", "false");
    expect(within(set).getByRole("img", { name: "Resume in the Marquee template" })).toBeInTheDocument();
    expect(within(set).getByRole("img", { name: "Cover letter in the Marquee template" })).toBeInTheDocument();
  });

  it("shows the live template count in the strip and the feature copy, without icon tiles", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: `${TEMPLATES.length} templates, all free` })).toBeInTheDocument();
    const details = screen.getByRole("region", { name: "The details" });
    expect(within(details).getByText(`${TEMPLATE_COUNT_WORDS} templates, one live preview`)).toBeInTheDocument();
    expect(within(details).queryAllByRole("img")).toHaveLength(0);
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

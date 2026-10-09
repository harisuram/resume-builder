import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { HOME_FAQS, TEMPLATE_COUNT_WORDS } from "@/lib/seo";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe("homepage", () => {
  it("tells visitors they can start from their own resume", () => {
    render(<Home />);
    expect(screen.getByText("Already have a resume?")).toBeInTheDocument();
    expect(screen.getByText(/Upload your PDF or Word file/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import my resume/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Can I start from my existing resume?" })).toBeInTheDocument();
  });

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
      screen.getByRole("heading", { level: 1, name: /free resume builder, no sign-up[\s\S]*skip what doesn.t belong/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Build my resume" })).toHaveAttribute("href", "/builder");
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

import { render, screen } from "@testing-library/react";
import CoverLetterPage, { metadata } from "./page";
import { COVER_LETTER_FAQS, PAGE_META } from "@/lib/seo";

describe("cover letter landing page", () => {
  it("targets the cover letter builder in its title and metadata", () => {
    render(<CoverLetterPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /free cover letter builder that matches your resume/i }),
    ).toBeInTheDocument();
    // Shown without the brand suffix, so search results don't cut it off.
    expect(metadata.title).toEqual({ absolute: PAGE_META["/cover-letter"].title });
    expect(metadata.alternates).toEqual({ canonical: "/cover-letter" });
  });

  it("sends every primary CTA to the cover letter builder", () => {
    render(<CoverLetterPage />);
    const ctas = screen.getAllByRole("link", { name: "Write my cover letter" });
    expect(ctas).toHaveLength(2);
    for (const cta of ctas) expect(cta).toHaveAttribute("href", "/cover-letter/builder");
    expect(screen.getByRole("link", { name: "Make my resume first" })).toHaveAttribute("href", "/builder");
  });

  it("ships the FAQ answers and links the cover letter guide", () => {
    render(<CoverLetterPage />);
    for (const faq of COVER_LETTER_FAQS) {
      expect(screen.getByRole("heading", { name: faq.question })).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "how to write a cover letter" })).toHaveAttribute(
      "href",
      "/guides/how-to-write-a-cover-letter",
    );
  });

  it("emits FAQPage JSON-LD that matches the visible questions", () => {
    const { container } = render(<CoverLetterPage />);
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')];
    const faq = scripts.map((s) => JSON.parse(s.innerHTML)).find((d) => d["@type"] === "FAQPage");
    expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(COVER_LETTER_FAQS.map((f) => f.question));
  });
});

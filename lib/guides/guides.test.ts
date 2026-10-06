import { GUIDES, getGuide, guideReadMinutes, guideText, guideWordCount } from ".";
import { sectionId } from "@/components/site/GuideBody";

describe("guides", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = GUIDES.map((guide) => guide.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("only links related guides that exist, never itself", () => {
    for (const guide of GUIDES) {
      expect(guide.related.length).toBeGreaterThan(0);
      for (const slug of guide.related) {
        expect(getGuide(slug)).toBeDefined();
        expect(slug).not.toBe(guide.slug);
      }
    }
  });

  /* The guides exist because thin pages were flagged as low-value content.
   * Keep each one substantial. */
  it("keeps every guide substantial", () => {
    for (const guide of GUIDES) {
      expect(guideWordCount(guide)).toBeGreaterThanOrEqual(1100);
      expect(guide.sections.length).toBeGreaterThanOrEqual(5);
      expect(guideReadMinutes(guide)).toBeGreaterThanOrEqual(5);
    }
  });

  it("has search-friendly titles and descriptions", () => {
    for (const guide of GUIDES) {
      expect(guide.title.length).toBeLessThanOrEqual(70);
      expect(guide.description.length).toBeGreaterThanOrEqual(100);
      expect(guide.description.length).toBeLessThanOrEqual(170);
    }
  });

  it("uses real ISO dates, never updated before published", () => {
    for (const guide of GUIDES) {
      expect(guide.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.updated >= guide.published).toBe(true);
    }
  });

  it("gives every section a distinct in-page anchor", () => {
    for (const guide of GUIDES) {
      const ids = guide.sections.map((section) => sectionId(section.heading));
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).not.toBe("faq");
    }
  });

  it("keeps markup out of the copy", () => {
    for (const guide of GUIDES) {
      expect(guideText(guide)).not.toMatch(/<\/?[a-z][^>]*>|\*\*|\]\(/i);
    }
  });

  /* Popular "facts" with no real source behind them. */
  it("does not repeat unsourced resume statistics", () => {
    for (const guide of GUIDES) {
      expect(guideText(guide)).not.toMatch(
        /\b(6|six|7|seven)[- ]seconds?\b|\b75 ?(%|percent) of (resumes|applications|applicants|candidates)/i,
      );
    }
  });
});

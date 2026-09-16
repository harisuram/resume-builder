import { HOME_DESCRIPTION, HOME_FAQS, HOME_TITLE, howToJsonLd, pageMetadata, webApplicationJsonLd } from "./seo";
import { INDEXABLE_PATHS, SITE_URL, absoluteUrl } from "./site";

describe("absoluteUrl", () => {
  it("uses SITE_URL for the homepage and joins other paths", () => {
    expect(absoluteUrl("/")).toBe(SITE_URL);
    expect(absoluteUrl("/private")).toBe(`${SITE_URL}/private`);
  });
});

describe("pageMetadata", () => {
  it("sets an absolute homepage title and a canonical on every indexable path", () => {
    const home = pageMetadata("/");
    expect(home.title).toEqual({ absolute: expect.stringContaining("Free AI Resume Maker") });
    expect(home.description).toBe(HOME_DESCRIPTION);
    expect(HOME_TITLE).toMatch(/unlimited/i);
    expect(HOME_DESCRIPTION).toMatch(/best/i);
    expect(HOME_DESCRIPTION).toMatch(/free/i);
    expect(HOME_DESCRIPTION).toMatch(/unlimited/i);
    expect(HOME_DESCRIPTION).toMatch(/AI-powered/i);
    expect(home.openGraph?.description).toBe(HOME_DESCRIPTION);
    expect(home.twitter?.description).toBe(HOME_DESCRIPTION);
    expect(home.alternates).toEqual({ canonical: "/" });
    expect(home.robots).toEqual({ index: true, follow: true });

    const privacy = pageMetadata("/privacy");
    expect(privacy.title).toBe("Privacy");
    expect(privacy.alternates).toEqual({ canonical: "/privacy" });
    expect(privacy.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 }),
    ]);
  });
});

describe("JSON-LD", () => {
  it("lists creator and curriculum vitae aliases on the WebApplication", () => {
    const data = webApplicationJsonLd();
    expect(data.alternateName).toEqual(expect.arrayContaining(["Resume Creator", "Free Resume Creator", "Free Curriculum Vitae"]));
    expect(data.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
    expect(data.url).toBe(SITE_URL);
  });

  it("emits FAQ questions that match the homepage copy source", () => {
    expect(HOME_FAQS.length).toBeGreaterThanOrEqual(7);
    expect(HOME_FAQS.some((faq) => /curriculum vitae/i.test(faq.answer))).toBe(true);
  });

  it("emits HowTo steps with fragment urls", () => {
    const data = howToJsonLd();
    expect(data["@type"]).toBe("HowTo");
    expect(data.step).toHaveLength(6);
    expect(data.step[0].url).toBe(`${absoluteUrl("/how-to-make-a-resume")}#step-1`);
  });
});

describe("indexable paths", () => {
  it("does not include the builder", () => {
    expect(INDEXABLE_PATHS).not.toContain("/builder");
  });
});

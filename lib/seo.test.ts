import { TEMPLATES } from "@/components/templates/shared/theme";
import { capitalizedNumberWords } from "./numberWords";
import {
  COVER_LETTER_FAQS,
  coverLetterAppJsonLd,
  FEATURE_LIST,
  FEATURES,
  HOME_DESCRIPTION,
  HOME_FAQS,
  HOME_TITLE,
  howToJsonLd,
  PAGE_META,
  pageMetadata,
  SITE_NAME,
  TEMPLATE_COUNT_WORDS,
  webApplicationJsonLd,
} from "./seo";
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
    expect(home.title).toEqual({ absolute: expect.stringContaining("Free Resume Builder") });
    expect(home.description).toBe(HOME_DESCRIPTION);
    expect(HOME_TITLE).toMatch(/no sign-up/i);
    expect(HOME_TITLE).toMatch(/ATS-friendly/i);
    expect(HOME_DESCRIPTION).toMatch(/free/i);
    expect(HOME_DESCRIPTION).toMatch(/unlimited/i);
    expect(HOME_DESCRIPTION).toMatch(/AI-powered/i);
    expect(home.openGraph?.description).toBe(HOME_DESCRIPTION);
    expect(home.twitter?.description).toBe(HOME_DESCRIPTION);
    expect(home.alternates).toEqual({ canonical: "/" });
    expect(home.robots).toEqual({ index: true, follow: true });

    const privacy = pageMetadata("/privacy");
    expect(privacy.title).toBe("Privacy Policy");
    expect(privacy.alternates).toEqual({ canonical: "/privacy" });
    expect(privacy.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/og.png", width: 1200, height: 630 }),
    ]);
    expect(home.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/og.png", width: 1200, height: 630 }),
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
    expect(INDEXABLE_PATHS).not.toContain("/cover-letter/builder");
  });

  it("registers the cover letter landing page with targeted copy", () => {
    expect(INDEXABLE_PATHS).toContain("/cover-letter");
    const meta = pageMetadata("/cover-letter");
    expect(meta.title).toEqual({ absolute: PAGE_META["/cover-letter"].title });
    expect(PAGE_META["/cover-letter"].title).toMatch(/free cover letter builder/i);
    expect(PAGE_META["/cover-letter"].title).toMatch(/matches your resume/i);
    expect(meta.alternates).toEqual({ canonical: "/cover-letter" });
    expect(PAGE_META["/cover-letter"].description.length).toBeLessThanOrEqual(160);
    expect(COVER_LETTER_FAQS.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps every indexable page's search title short enough for Google to show whole", () => {
    for (const path of INDEXABLE_PATHS) {
      const { title } = pageMetadata(path);
      const shown = typeof title === "object" && title && "absolute" in title ? title.absolute : `${title} — ${SITE_NAME}`;
      expect([path, shown.length <= 62]).toEqual([path, true]);
    }
  });

  it("gives the cover letter page its own free web app and a breadcrumb back home", () => {
    const app = coverLetterAppJsonLd();
    expect(app).toMatchObject({ "@type": "WebApplication", url: absoluteUrl("/cover-letter"), offers: { price: "0" } });
    expect(app.description).toBe(PAGE_META["/cover-letter"].description);
  });
});

describe("template count copy", () => {
  it("spells the live template count everywhere the copy mentions it", () => {
    const words = capitalizedNumberWords(TEMPLATES.length);
    expect(TEMPLATE_COUNT_WORDS).toBe(words);
    expect(PAGE_META["/templates"].description.startsWith(`${words} free, unlimited resume templates.`)).toBe(true);
    expect(pageMetadata("/templates").openGraph?.description).toBe(PAGE_META["/templates"].description);
    expect(FEATURES.some((feature) => feature.title === `${words} templates, one live preview`)).toBe(true);
    expect(FEATURE_LIST).toContain(`${words} resume templates with a live preview`);
  });

  it("never ships a stale hardcoded count", () => {
    const copy = JSON.stringify([PAGE_META, FEATURES, FEATURE_LIST]);
    expect(copy).not.toMatch(/Thirty-one/);
  });
});

import robots from "./robots";
import { SITE_URL } from "@/lib/site";

describe("robots.txt", () => {
  it("lets Google crawl /builder (for noindex) and keeps /api/ out", () => {
    const result = robots();
    expect(result.rules).toEqual([
      {
        userAgent: ["Mediapartners-Google", "AdsBot-Google", "AdsBot-Google-Mobile"],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ]);
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("leaves both cover letter pages crawlable — the landing page to index, the builder for its noindex", () => {
    const rules = robots().rules;
    for (const rule of Array.isArray(rules) ? rules : [rules]) {
      const disallowed = [rule.disallow ?? []].flat();
      for (const path of ["/cover-letter", "/cover-letter/builder"]) {
        expect(disallowed.some((prefix) => path.startsWith(prefix))).toBe(false);
      }
    }
  });
});

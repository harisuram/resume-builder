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
});

import sitemap from "./sitemap";
import { GUIDES, guidePath } from "@/lib/guides";
import { INDEXABLE_PATHS, absoluteUrl } from "@/lib/site";

describe("sitemap.xml", () => {
  it("lists every indexable page, then every guide, on the configured host", () => {
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      ...INDEXABLE_PATHS.map((path) => absoluteUrl(path)),
      ...GUIDES.map((guide) => absoluteUrl(guidePath(guide.slug))),
    ]);
  });

  it("gives static pages no build-time lastmod, and guides their own edit date", () => {
    const entries = sitemap();
    for (const entry of entries.slice(0, INDEXABLE_PATHS.length)) {
      expect(entry).not.toHaveProperty("lastModified");
    }
    entries.slice(INDEXABLE_PATHS.length).forEach((entry, i) => {
      expect(entry.lastModified).toBe(GUIDES[i].updated);
    });
  });

  it("does not list the builder", () => {
    expect(sitemap().some((entry) => entry.url.endsWith("/builder"))).toBe(false);
  });

  it("lists the cover letter landing page but not the cover letter builder", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(absoluteUrl("/cover-letter"));
    expect(urls).not.toContain(absoluteUrl("/cover-letter/builder"));
  });
});

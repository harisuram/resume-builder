import sitemap from "./sitemap";
import { INDEXABLE_PATHS, absoluteUrl } from "@/lib/site";

describe("sitemap.xml", () => {
  it("lists every indexable URL on the configured host, without a build-time lastmod", () => {
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toEqual(INDEXABLE_PATHS.map((path) => absoluteUrl(path)));
    for (const entry of entries) {
      expect(entry).not.toHaveProperty("lastModified");
    }
  });

  it("does not list the builder", () => {
    expect(sitemap().some((entry) => entry.url.endsWith("/builder"))).toBe(false);
  });
});

import type { MetadataRoute } from "next";
import { GUIDES, guidePath } from "@/lib/guides";
import { INDEXABLE_PATHS, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = INDEXABLE_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" || path === "/guides" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : 0.7,
  }));

  // Guides carry their own edit date, so lastmod is a real content date —
  // not the build time, which would change on every deploy.
  const guides: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: absoluteUrl(guidePath(guide.slug)),
    lastModified: guide.updated,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...guides];
}

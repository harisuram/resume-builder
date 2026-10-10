import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // AdSense review/fill crawlers need every page that hosts a slot,
        // including /builder and /cover-letter/builder (which regular bots
        // should crawl but not index).
        userAgent: ["Mediapartners-Google", "AdsBot-Google", "AdsBot-Google-Mobile"],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        // /builder and /cover-letter/builder stay crawlable so Google can
        // honor their noindex tags.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

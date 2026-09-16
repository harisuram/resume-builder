import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // AdSense review/fill crawlers need every page that hosts a slot,
        // including /builder (which regular bots should crawl but not index).
        userAgent: ["Mediapartners-Google", "AdsBot-Google", "AdsBot-Google-Mobile"],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        // /builder stays crawlable so Google can honor its noindex tag.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

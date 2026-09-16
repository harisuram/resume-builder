import type { Metadata } from "next";
import { HOME_TITLE } from "@/lib/seo";

const BUILDER_DESCRIPTION =
  "Build a resume with the best free, unlimited AI-powered resume maker. Pick a template and download a PDF — no account.";

export const metadata: Metadata = {
  title: "Build your resume",
  description: BUILDER_DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: "/builder" },
  openGraph: {
    title: "Build your resume",
    description: BUILDER_DESCRIPTION,
    url: "/builder",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: HOME_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Build your resume",
    description: BUILDER_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function BuilderLayout({ children }: LayoutProps<"/builder">) {
  return children;
}

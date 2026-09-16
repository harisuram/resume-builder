import type { Metadata } from "next";
import { HOME_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Build your resume",
  description: "Build your resume.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/builder" },
  openGraph: {
    title: "Build your resume",
    description: "Build your resume.",
    url: "/builder",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: HOME_TITLE }],
  },
};

export default function BuilderLayout({ children }: LayoutProps<"/builder">) {
  return children;
}

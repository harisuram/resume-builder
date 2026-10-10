import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HOME_TITLE } from "@/lib/seo";

const DESCRIPTION =
  "Write a free cover letter in the same template as your resume, with AI help on every paragraph. Download a PDF — no account.";

/** The tool itself stays out of the index, like /builder: the indexable page
 * is the /cover-letter landing page, which links here. */
export const metadata: Metadata = {
  title: "Write your cover letter",
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: "/cover-letter/builder" },
  openGraph: {
    title: "Write your cover letter",
    description: DESCRIPTION,
    url: "/cover-letter/builder",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: HOME_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Write your cover letter",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function CoverLetterBuilderLayout({ children }: { children: ReactNode }) {
  return children;
}

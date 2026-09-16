import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build your resume",
  description: "Build your resume.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/builder" },
};

export default function BuilderLayout({ children }: LayoutProps<"/builder">) {
  return children;
}

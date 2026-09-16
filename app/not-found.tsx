import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="marketing-shell flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-20 sm:px-10">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">404</p>
        <h1 className="mt-4 font-display text-[32px] font-semibold tracking-tight text-[var(--color-ink)]">
          That page isn’t here.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          {SITE_NAME} only publishes a handful of pages. Try the home page or the walkthrough for making a resume.
        </p>
        <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
          <Link href="/" className="font-medium text-[var(--color-accent)] hover:underline">
            Home
          </Link>
          <Link href="/how-to-make-a-resume" className="font-medium text-[var(--color-accent)] hover:underline">
            How to make a resume
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { FOOTER_LINKS, FOOTER_NOTE, FOOTER_TAGLINE, SITE_NAME } from "@/lib/seo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-[16px] font-semibold text-[var(--color-ink)]">{SITE_NAME}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{FOOTER_TAGLINE}</p>
        <nav aria-label="Site" className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px]">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-5 text-[12px] text-[var(--color-ink-faint)]">{FOOTER_NOTE}</p>
      </div>
    </footer>
  );
}

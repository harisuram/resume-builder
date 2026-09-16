import Link from "next/link";
import { FOOTER_LINKS, SITE_NAME } from "@/lib/seo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] px-6 py-6 sm:px-10">
      <nav aria-label="Site" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px]">
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
      <p className="mt-3 text-center text-[12px] text-[var(--color-ink-faint)]">{SITE_NAME}</p>
    </footer>
  );
}

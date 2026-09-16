import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { FOOTER_LINKS, FOOTER_NOTE, FOOTER_TAGLINE } from "@/lib/seo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] px-6 py-12 sm:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm text-left">
          <Logo href="" />
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{FOOTER_TAGLINE}</p>
        </div>
        <nav aria-label="Site" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] sm:max-w-xs sm:justify-end">
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
      </div>
      <p className="mx-auto mt-8 max-w-4xl text-[12px] text-[var(--color-ink-faint)]">{FOOTER_NOTE}</p>
    </footer>
  );
}

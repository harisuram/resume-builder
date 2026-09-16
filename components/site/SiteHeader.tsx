import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ctaPrimary } from "@/components/ui/cta";

const HEADER_LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/how-to-make-a-resume", label: "How to" },
  { href: "/private", label: "Private" },
] as const;

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--color-border)]/80 bg-[var(--color-paper)]/80 backdrop-blur-xl">
      <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-10 sm:py-3.5">
        <Logo href={home ? "" : "/"} />
        <div className="flex shrink-0 items-center gap-5">
          <nav className="hidden items-center gap-5 text-[13.5px] font-medium md:flex" aria-label="Site">
            {HEADER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/builder" className={ctaPrimary.sm} aria-label="Start building">
            <span className="sm:hidden" aria-hidden="true">
              Start
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              Start building
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

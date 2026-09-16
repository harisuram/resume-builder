import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const HEADER_CTA =
  "rounded-md bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-[var(--color-accent-ink)] transition duration-150 ease-out hover:brightness-110 active:brightness-95";

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Logo href={home ? "" : "/"} />
      <Link href="/builder" className={HEADER_CTA}>
        Start building
      </Link>
    </header>
  );
}

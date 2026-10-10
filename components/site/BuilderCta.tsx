import Link from "next/link";
import { ctaPrimary } from "@/components/ui/cta";

export function BuilderCta({
  children = "Build my resume",
  size = "md",
  href = "/builder",
}: {
  children?: string;
  size?: keyof typeof ctaPrimary;
  /** Which builder to open — the resume builder unless a page says otherwise. */
  href?: "/builder" | "/cover-letter/builder";
}) {
  return (
    <Link href={href} className={ctaPrimary[size]}>
      {children}
    </Link>
  );
}

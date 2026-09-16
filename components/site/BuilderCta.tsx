import Link from "next/link";
import { ctaPrimary } from "@/components/ui/cta";

export function BuilderCta({
  children = "Build my resume",
  size = "md",
}: {
  children?: string;
  size?: keyof typeof ctaPrimary;
}) {
  return (
    <Link href="/builder" className={ctaPrimary[size]}>
      {children}
    </Link>
  );
}

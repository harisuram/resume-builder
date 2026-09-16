import Link from "next/link";

const SIZES = {
  sm: "rounded-md bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-[var(--color-accent-ink)] transition duration-150 ease-out hover:brightness-110 active:brightness-95",
  md: "rounded-md bg-[var(--color-accent)] px-6 py-3 text-[14px] font-medium text-[var(--color-accent-ink)] transition duration-150 ease-out hover:brightness-110 active:brightness-95",
} as const;

export function BuilderCta({
  children = "Build my resume",
  size = "md",
}: {
  children?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <Link href="/builder" className={SIZES[size]}>
      {children}
    </Link>
  );
}

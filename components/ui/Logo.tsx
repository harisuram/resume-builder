import Link from "next/link";

/** A nib mark — ties the brand to writing/typography rather than a generic
 * geometric logo. Inline SVG: zero extra requests, scales crisply. */
function NibIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2 4 15.5c-.6 1 .5 2.1 1.5 1.5L12 13l6.5 4c1 .6 2.1-.5 1.5-1.5L12 2Z"
        fill="currentColor"
      />
      <path d="M12 13 9 21.5c-.2.6.5 1.1 1 .7L12 20l2 2.2c.5.4 1.2-.1 1-.7L12 13Z" fill="currentColor" />
      <circle cx="12" cy="10.5" r="1.3" fill="var(--color-paper)" />
    </svg>
  );
}

export function Logo({
  href = "/",
  size = "md",
  className = "",
}: {
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <NibIcon className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
      <span
        className={`whitespace-nowrap font-display font-semibold tracking-tight text-[var(--color-ink)] ${
          size === "sm" ? "text-[14px] sm:text-[16px]" : "text-[15px] sm:text-[17px]"
        }`}
      >
        Free Resume Builder
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}

import Link from "next/link";
import { FEATURES } from "@/lib/seo";

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
      {children}
    </span>
  );
}

function SectionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <rect x="4" y="4" width="16" height="4.5" rx="1.2" />
      <rect x="4" y="10.25" width="16" height="4.5" rx="1.2" />
      <rect x="4" y="16.5" width="10" height="3.5" rx="1.2" />
    </svg>
  );
}

function SuggestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <rect x="3.5" y="4" width="10" height="16" rx="1.4" />
      <rect x="10.5" y="7" width="10" height="13" rx="1.4" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
    </svg>
  );
}

function PrivateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path d="M12 3.5 5 6.5v5.2c0 4.3 2.9 7.4 7 8.8 4.1-1.4 7-4.5 7-8.8V6.5L12 3.5Z" />
      <path d="M9.5 12.2 11.2 14l3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = [SectionsIcon, SuggestIcon, TemplatesIcon, PdfIcon, PrivateIcon];

export function FeatureCards() {
  return (
    <div className="mt-20 grid w-full min-w-0 max-w-4xl gap-4 sm:grid-cols-2">
      {FEATURES.map((feature, index) => {
        const Icon = ICONS[index] ?? SectionsIcon;
        return (
          <div
            key={feature.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30"
          >
            <IconBox>
              <Icon />
            </IconBox>
            <h2 className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
              {feature.title}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{feature.body}</p>
            {"href" in feature && feature.href ? (
              <Link
                href={feature.href}
                className="mt-3 inline-block text-[13px] font-medium text-[var(--color-accent)] hover:underline"
              >
                {feature.linkLabel}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

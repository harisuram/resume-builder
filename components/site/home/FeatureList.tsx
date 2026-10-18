import Link from "next/link";
import { FEATURES } from "@/lib/seo";
import { HOME_SERIF } from "./serif";

/** The builder's features as a plain two-column list — a sentence each, no
 * icon tiles — under a heading set in the home page's serif. */
export function FeatureList() {
  return (
    <section
      aria-labelledby="details-heading"
      className="mt-16 grid w-full min-w-0 max-w-6xl gap-8 border-t border-[var(--color-ink)]/15 pt-10 sm:mt-24 sm:pt-12 lg:mt-32 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
    >
      <h2 id="details-heading" className={`${HOME_SERIF} text-[32px] leading-tight tracking-[-0.01em] text-[var(--color-ink)] sm:text-[40px]`}>
        The details
      </h2>
      <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 sm:gap-y-8">
        {FEATURES.map((feature) => (
          <div key={feature.title}>
            <dt className="text-[15px] font-semibold text-[var(--color-ink)]">{feature.title}</dt>
            <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">
              {feature.body}
              {"href" in feature && feature.href ? (
                <>
                  {" "}
                  <Link
                    href={feature.href}
                    className="font-medium text-[var(--color-ink)] underline decoration-[var(--color-ink)]/30 underline-offset-4 hover:decoration-[var(--color-ink)]"
                  >
                    {feature.linkLabel}
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { FeatureCards } from "@/components/site/FeatureCards";
import { MarketingPage } from "@/components/site/MarketingPage";
import { MatchingSet } from "@/components/site/MatchingSet";
import { ProductCards } from "@/components/site/ProductCards";
import { TemplatePreviewStrip } from "@/components/site/TemplatePreviewStrip";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { HOME_FAQS, faqJsonLd, pageMetadata, webApplicationJsonLd, webSiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata("/");

const TRUST = ["Free", "No account", "No watermark", "Stays on your device"] as const;

/** A faint grid under a soft accent glow, behind the hero only. Kept inside
 * the page column (no full-bleed width) so it can't cause sideways scroll. */
function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[620px] sm:-top-20" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 [mask-image:radial-gradient(55%_60%_at_50%_35%,black,transparent)]" />
      <div className="absolute left-1/2 top-10 h-[360px] w-[min(760px,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--accent-glow),transparent)] opacity-60 blur-2xl" />
    </div>
  );
}

export default function Home() {
  return (
    <MarketingPage home jsonLd={[webApplicationJsonLd(), webSiteJsonLd(), faqJsonLd(HOME_FAQS)]}>
      <div className="relative isolate flex w-full min-w-0 flex-col items-center">
        <HeroBackdrop />

        <section className="flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
          <ul
            aria-label="What you get"
            className="animate-fade-up inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-1.5 text-[12px] font-medium text-[var(--color-ink-soft)] shadow-card backdrop-blur"
          >
            {TRUST.map((item, i) => (
              // The last item waits for sm: four don't fit one line on a phone.
              <li key={item} className={`${i === TRUST.length - 1 ? "hidden sm:inline-flex" : "inline-flex"} items-center gap-2.5`}>
                {i > 0 && <span className="h-1 w-1 rounded-full bg-[var(--color-ink-faint)]" aria-hidden="true" />}
                {item}
              </li>
            ))}
          </ul>

          <h1 className="animate-fade-up-delay mt-5 w-full min-w-0 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-tight text-[var(--color-ink)] sm:text-[42px] lg:text-[48px]">
            Free resume &amp; cover letter builder
            <span className="mt-2 block text-[18px] leading-[1.3] text-[var(--color-ink-soft)] sm:text-[24px] lg:text-[26px]">
              No sign-up. Skip what doesn’t belong.
            </span>
          </h1>

          <p className="animate-fade-up-delay mt-4 w-full min-w-0 max-w-2xl text-pretty text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            ATS-friendly templates for both, a live preview of the exact PDF you’ll download, and AI help when you want
            it — free, with no account and no payment.
          </p>
        </section>

        <ProductCards />

        <MatchingSet />

        <TemplatePreviewStrip />

        <FeatureCards />


        <section className="mt-20 w-full max-w-4xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-[22px] font-semibold tracking-tight text-[var(--color-ink)]">
            Questions
          </h2>
          <FaqAccordion items={HOME_FAQS} />
          <p className="mt-8 text-[13.5px] text-[var(--color-ink-soft)]">
            Want the steps in order? See{" "}
            <Link href="/how-to-make-a-resume" className="font-medium text-[var(--color-accent)] hover:underline">
              how to make a resume
            </Link>
            , or read about{" "}
            <Link href="/ats" className="font-medium text-[var(--color-accent)] hover:underline">
              ATS-friendly resumes
            </Link>
            . For help with the writing itself — summaries, bullet points, skills, cover letters — browse the{" "}
            <Link href="/guides" className="font-medium text-[var(--color-accent)] hover:underline">
              resume guides
            </Link>
            .
          </p>
        </section>

        <AdSlot
          slot={ADSENSE_SLOTS.landing}
          name="Landing page"
          className="mt-16 flex w-full max-w-3xl flex-col items-center gap-1"
        />
      </div>
    </MarketingPage>
  );
}

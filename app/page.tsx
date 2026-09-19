import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { BuilderCta } from "@/components/site/BuilderCta";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { FeatureCards } from "@/components/site/FeatureCards";
import { MarketingPage } from "@/components/site/MarketingPage";
import { TemplatePreviewStrip } from "@/components/site/TemplatePreviewStrip";
import { ctaGhost } from "@/components/ui/cta";
import { ADSENSE_SLOTS } from "@/lib/ads";
import {
  HOME_FAQS,
  SITE_NAME,
  faqJsonLd,
  pageMetadata,
  webApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/seo";

export const metadata = pageMetadata("/");

const STEPS = [
  { n: "01", title: "Fill what belongs", body: "Name, contact, then only the sections this resume needs." },
  { n: "02", title: "Pick a look", body: "Switch templates in the live preview until one fits." },
  { n: "03", title: "Download a PDF", body: "Print the same view you already checked. No account." },
] as const;

function NibMark() {
  return (
    <span
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-cta sm:h-12 sm:w-12"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6">
        <path
          d="M12 2 4 15.5c-.6 1 .5 2.1 1.5 1.5L12 13l6.5 4c1 .6 2.1-.5 1.5-1.5L12 2Z"
          fill="currentColor"
        />
        <path d="M12 13 9 21.5c-.2.6.5 1.1 1 .7L12 20l2 2.2c.5.4 1.2-.1 1-.7L12 13Z" fill="currentColor" />
        <circle cx="12" cy="10.5" r="1.3" fill="var(--color-accent)" />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <MarketingPage home jsonLd={[webApplicationJsonLd(), webSiteJsonLd(), faqJsonLd(HOME_FAQS)]}>
      <div className="flex w-full min-w-0 flex-col items-center">
        <section className="flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
          <div className="animate-fade-up flex flex-col items-center gap-3.5 sm:gap-4">
            <NibMark />
            <p className="font-display text-[28px] font-semibold tracking-tight text-[var(--color-ink)] sm:text-[36px] lg:text-[40px]">
              {SITE_NAME}
            </p>
          </div>

          <h1 className="animate-fade-up-delay mt-4 w-full min-w-0 text-pretty font-display text-[22px] font-semibold tracking-tight leading-[1.25] text-[var(--color-ink-soft)] sm:mt-5 sm:text-[28px] lg:text-[32px]">
            Build the resume.
            <span className="text-[var(--color-ink)]"> Skip what doesn’t belong.</span>
          </h1>

          <p className="mt-4 w-full min-w-0 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-soft)] sm:mt-5">
            Empty sections never print. Switch templates in a live preview, then download that same PDF — no
            account.
          </p>

          <div className="mt-8 flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <BuilderCta>Build my resume</BuilderCta>
            <Link href="/templates" className={ctaGhost}>
              See all templates
            </Link>
          </div>
        </section>

        <TemplatePreviewStrip />

        <ol className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-card"
            >
              <p className="font-display text-[13px] font-semibold text-[var(--color-accent)]">
                {step.n}
              </p>
              <h2 className="mt-2 font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                {step.title}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{step.body}</p>
            </li>
          ))}
        </ol>

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

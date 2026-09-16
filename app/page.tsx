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

export default function Home() {
  return (
    <MarketingPage home jsonLd={[webApplicationJsonLd(), webSiteJsonLd(), faqJsonLd(HOME_FAQS)]}>
      <div className="flex w-full min-w-0 flex-col items-center">
        <p className="animate-fade-up inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-ink-soft)] shadow-card">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-focus)]" aria-hidden="true" />
          Free resume maker · No account · Private
        </p>
        <h1 className="animate-fade-up-delay mt-6 w-full min-w-0 max-w-[20.5rem] text-pretty text-center font-display text-[28px] font-semibold tracking-tight leading-[1.15] text-[var(--color-ink)] sm:max-w-2xl sm:text-[40px] lg:text-[48px]">
          Make a resume from only the sections you need.
        </h1>
        <p className="mt-5 w-full min-w-0 max-w-xl text-center text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          A free resume builder for software, data, IT, pharmacy, architecture, construction, and more. Skip anything
          that doesn’t belong, pick a template, and download a PDF. No sign-up.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <BuilderCta>Build my resume</BuilderCta>
          <Link href="/templates" className={ctaGhost}>
            See all templates
          </Link>
        </div>
        <p className="mt-4 text-[12.5px] text-[var(--color-ink-faint)]">Takes about five minutes.</p>

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

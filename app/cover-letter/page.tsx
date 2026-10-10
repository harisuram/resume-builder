import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { BuilderCta } from "@/components/site/BuilderCta";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { ctaGhost } from "@/components/ui/cta";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { guidePath } from "@/lib/guides";
import {
  COVER_LETTER_FAQS,
  COVER_LETTER_FEATURES,
  COVER_LETTER_STEPS,
  breadcrumbJsonLd,
  coverLetterAppJsonLd,
  faqJsonLd,
  pageMetadata,
} from "@/lib/seo";

export const metadata = pageMetadata("/cover-letter");

const BUILDER = "/cover-letter/builder";
const link = "font-medium text-[var(--color-accent)] hover:underline";

export default function CoverLetterPage() {
  return (
    <MarketingPage
      jsonLd={[
        coverLetterAppJsonLd(),
        faqJsonLd(COVER_LETTER_FAQS),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Cover letter", path: "/cover-letter" },
        ]),
      ]}
    >
      <div className="flex w-full min-w-0 flex-col items-center">
        <section className="animate-fade-up flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
          <PageTitle>Free cover letter builder that matches your resume</PageTitle>
          <Lead>
            Write a cover letter one guided paragraph at a time. It uses your resume’s template, name, contact
            details, and photo, so the two look like a set — then download it as a PDF. Free, with no account, and
            everything stays in your browser.
          </Lead>

          <div className="mt-8 flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <BuilderCta href={BUILDER}>Write my cover letter</BuilderCta>
            <Link href="/builder" className={ctaGhost}>
              Make my resume first
            </Link>
          </div>
        </section>

        <section className="mt-20 w-full min-w-0 max-w-4xl" aria-labelledby="how-heading">
          <h2 id="how-heading" className="font-display text-[22px] font-semibold tracking-tight text-[var(--color-ink)]">
            How it works
          </h2>
          <ol className="mt-6 grid w-full gap-4 md:grid-cols-3">
            {COVER_LETTER_STEPS.map((step, i) => (
              <li
                id={`step-${i + 1}`}
                key={step.name}
                className="list-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-card"
              >
                <p className="font-display text-[13px] font-semibold text-[var(--color-accent)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                  {step.name}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Between two content sections, well away from every CTA button —
            AdSense's accidental-click policy. Collapses when unfilled. */}
        <AdSlot
          slot={ADSENSE_SLOTS.coverLanding}
          name="Cover letter page"
          className="mt-16 flex w-full max-w-3xl flex-col items-center gap-1"
        />

        <section className="mt-20 w-full min-w-0 max-w-4xl" aria-labelledby="features-heading">
          <h2
            id="features-heading"
            className="font-display text-[22px] font-semibold tracking-tight text-[var(--color-ink)]"
          >
            What you get
          </h2>
          <div className="mt-6 grid w-full min-w-0 gap-4 sm:grid-cols-2">
            {COVER_LETTER_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card"
              >
                <h3 className="font-display text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 w-full min-w-0 max-w-4xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-[22px] font-semibold tracking-tight text-[var(--color-ink)]">
            Questions
          </h2>
          <FaqAccordion items={COVER_LETTER_FAQS} />
          <p className="mt-8 text-[13.5px] text-[var(--color-ink-soft)]">
            Not sure what to say in each paragraph? Read{" "}
            <Link href={guidePath("how-to-write-a-cover-letter")} className={link}>
              how to write a cover letter
            </Link>
            , with a full sample letter. For the resume itself, see{" "}
            <Link href="/templates" className={link}>
              the templates
            </Link>{" "}
            both documents share.
          </p>
        </section>

        <section className="mt-16 w-full min-w-0 max-w-4xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-card sm:p-8">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">
            Write a cover letter that matches your resume
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Free, no account, and the preview is the PDF you download.
          </p>
          <div className="mt-5 flex flex-col items-stretch sm:items-center">
            <BuilderCta href={BUILDER}>Write my cover letter</BuilderCta>
          </div>
        </section>
      </div>
    </MarketingPage>
  );
}

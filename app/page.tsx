import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { BuilderCta } from "@/components/site/BuilderCta";
import { MarketingPage } from "@/components/site/MarketingPage";
import { ADSENSE_SLOTS } from "@/lib/ads";
import {
  FEATURES,
  HOME_FAQS,
  faqJsonLd,
  pageMetadata,
  webApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/seo";

export const metadata = pageMetadata("/");

export default function Home() {
  return (
    <MarketingPage home jsonLd={[webApplicationJsonLd(), webSiteJsonLd(), faqJsonLd(HOME_FAQS)]}>
      <div className="flex flex-col items-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
          Free resume maker · No account · Private
        </p>
        <h1 className="mt-4 max-w-2xl text-balance text-center font-display text-[36px] font-semibold leading-[1.15] text-[var(--color-ink)] sm:text-[46px]">
          Make a resume from only the sections you need.
        </h1>
        <p className="mt-5 max-w-xl text-center text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          A free resume builder for software, data, IT, pharmacy, architecture, construction, and more. Skip anything
          that doesn’t belong, pick a template, and download a PDF. No sign-up.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <BuilderCta>Build my resume</BuilderCta>
          <span className="text-[12.5px] text-[var(--color-ink-faint)]">Takes about ten minutes.</span>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors duration-150 ease-out hover:border-[var(--color-accent)]/40"
            >
              <h2 className="font-display text-[16px] font-semibold text-[var(--color-ink)]">{feature.title}</h2>
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
          ))}
        </div>

        <section className="mt-20 w-full max-w-4xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-[22px] font-semibold text-[var(--color-ink)]">
            Questions
          </h2>
          <dl className="mt-6 space-y-8">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question}>
                <dt>
                  <h3 className="font-display text-[16px] font-semibold text-[var(--color-ink)]">{faq.question}</h3>
                </dt>
                <dd className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
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

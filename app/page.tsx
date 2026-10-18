import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { MarketingPage } from "@/components/site/MarketingPage";
import { MatchingSet } from "@/components/site/MatchingSet";
import { TemplatePreviewStrip } from "@/components/site/TemplatePreviewStrip";
import { FeatureList } from "@/components/site/home/FeatureList";
import { HomeHero } from "@/components/site/home/HomeHero";
import { NotHere } from "@/components/site/home/NotHere";
import { HOME_SERIF } from "@/components/site/home/serif";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { HOME_FAQS, faqJsonLd, pageMetadata, webApplicationJsonLd, webSiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata("/");

const textLink =
  "font-medium text-[var(--color-ink)] underline decoration-[var(--color-ink)]/30 underline-offset-4 hover:decoration-[var(--color-ink)]";

export default function Home() {
  return (
    <MarketingPage home jsonLd={[webApplicationJsonLd(), webSiteJsonLd(), faqJsonLd(HOME_FAQS)]}>
      <div className="flex w-full min-w-0 flex-col items-center">
        <HomeHero />

        <NotHere />

        <MatchingSet />

        <TemplatePreviewStrip />

        <FeatureList />

        <section
          aria-labelledby="faq-heading"
          className="mt-16 grid w-full min-w-0 max-w-6xl gap-8 border-t border-[var(--color-ink)]/15 pt-10 sm:mt-24 sm:pt-12 lg:mt-32 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
        >
          <div>
            <h2 id="faq-heading" className={`${HOME_SERIF} text-[32px] leading-tight tracking-[-0.01em] text-[var(--color-ink)] sm:text-[40px]`}>
              Questions
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              Want the steps in order? See{" "}
              <Link href="/how-to-make-a-resume" className={textLink}>
                how to make a resume
              </Link>
              , or read about{" "}
              <Link href="/ats" className={textLink}>
                ATS-friendly resumes
              </Link>
              . For help with the writing itself — summaries, bullet points, skills, cover letters — browse the{" "}
              <Link href="/guides" className={textLink}>
                resume guides
              </Link>
              .
            </p>
          </div>
          <div className="min-w-0">
            <FaqAccordion items={HOME_FAQS} />
          </div>
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

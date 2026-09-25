import Link from "next/link";
import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, MarketingPage, PageTitle, SectionHeading } from "@/components/site/MarketingPage";
import { SITE_NAME, TEMPLATE_COUNT_WORDS, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

export default function AboutPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>{`About ${SITE_NAME}`}</PageTitle>
        <Lead>
          A free resume maker and resume creator for any field — software, data, IT, pharmacy, architecture,
          construction, and the rest. Every section is available, none are required. Skip what doesn’t belong, pick a
          template, download a PDF. No account. The same editor works as a CV builder if you need a curriculum vitae.
        </Lead>

        <SectionHeading>What it is</SectionHeading>
        <Body>
          A browser tool with a live preview. Roles, skills, degrees, and certifications offer suggestions that are not
          software-only; you can still type anything. {TEMPLATE_COUNT_WORDS} templates share one preview, and that preview is what
          you print. Phone numbers include a country code. Required fields are checked before you move on. Skip
          internships, patents, a photo, or anything else — skipped sections don’t leave empty headings. You can also
          drop an existing resume and we’ll fill every section we can read.
        </Body>

        <SectionHeading>What it isn’t</SectionHeading>
        <Body>
          It isn’t a job board, a review of your career, or a hosted resume URL. It doesn’t claim to “beat” applicant
          tracking systems. The optional ATS rewrite only edits bullets you already wrote.
        </Body>

        <SectionHeading>Where to go next</SectionHeading>
        <Body>
          <Link href="/how-to-make-a-resume" className="font-medium text-[var(--color-accent)] hover:underline">
            How to make a resume
          </Link>
          ,{" "}
          <Link href="/templates" className="font-medium text-[var(--color-accent)] hover:underline">
            free resume templates
          </Link>
          ,{" "}
          <Link href="/private" className="font-medium text-[var(--color-accent)] hover:underline">
            private &amp; safe
          </Link>
          , or{" "}
          <Link href="/ats" className="font-medium text-[var(--color-accent)] hover:underline">
            ATS-friendly resumes
          </Link>
          .
        </Body>

        <div className="mt-10">
          <BuilderCta>Start building</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

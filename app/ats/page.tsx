import Link from "next/link";
import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, MarketingPage, PageTitle, SectionHeading } from "@/components/site/MarketingPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/ats");

export default function AtsPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Make an ATS-friendly resume without a gimmick file</PageTitle>
        <Lead>
          Applicant tracking systems read text, headings, and order. This ATS resume builder doesn’t export a mystery
          file format. You make a resume in a real template, skip empty sections, and — if you want — rewrite
          experience bullets into plain, action-led lines.
        </Lead>

        <SectionHeading>What “ATS-friendly” means here</SectionHeading>
        <Body>
          Templates use ordinary headings and lists, not text baked into a picture. If you skip a section, it is left
          off the page instead of printing a blank “Skills” or “Projects” heading. That keeps the file closer to what a
          parser can map.
        </Body>

        <SectionHeading>The optional bullet rewrite</SectionHeading>
        <Body>
          On an experience entry, “Make ATS-friendly” rewrites the bullets you already wrote: strong verbs, one concise
          line each, no invented metrics. It only runs if you click it, and it only sends those bullets — not the rest
          of the resume. See the{" "}
          <Link href="/private" className="font-medium text-[var(--color-accent)] hover:underline">
            private resume builder
          </Link>{" "}
          page for that exception.
        </Body>

        <SectionHeading>What this does not claim</SectionHeading>
        <Body>
          No template “beats the ATS.” A recruiter still reads the PDF. Use clear job titles, real dates, and skills
          you actually have. Then pick a layout from the{" "}
          <Link href="/templates" className="font-medium text-[var(--color-accent)] hover:underline">
            free resume templates
          </Link>{" "}
          and download.
        </Body>

        <div className="mt-10">
          <BuilderCta>Create an ATS-friendly resume</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

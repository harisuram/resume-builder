import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, List, MarketingPage, PageTitle, SectionHeading, TextLink } from "@/components/site/MarketingPage";
import { TEMPLATE_COUNT_WORDS, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/ats");

export default function AtsPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Free ATS-friendly resume builder — no gimmick file</PageTitle>
        <Lead>
          An applicant tracking system (ATS) is the software many employers use to collect applications. It pulls the
          text out of your resume so recruiters can search and sort it. The best thing you can do for it is boring:
          clear headings, real text, and a simple order. That’s what the templates here are built around — and the
          builder is free, with no sign-up and no payment before you download.
        </Lead>

        <SectionHeading>What “ATS-friendly” means on this site</SectionHeading>
        <Body>
          Every template uses ordinary text headings and lists — nothing is baked into an image, so the words can be
          selected and read. If you skip a section, it’s left off the page entirely rather than printing an empty
          “Skills” or “Projects” heading. Dates, job titles, and company names sit in predictable places. None of this
          is a trick; it just keeps the file easy for software to read and easy for a person to skim.
        </Body>

        <SectionHeading>The optional “Make ATS-friendly” button</SectionHeading>
        <Body>
          Your summary, each experience entry, and each project have a “Make ATS-friendly” button. It rewrites the text
          you already wrote into plain, action-led lines with strong verbs. It’s instructed not to invent numbers or
          achievements, but it’s still AI, so read what comes back and fix anything that isn’t quite true. It only runs
          when you click it, and only sends the text of that one item — the{" "}
          <TextLink href="/private">private resume builder</TextLink> page explains what that means for your data.
        </Body>

        <SectionHeading>How to build an ATS-friendly resume here</SectionHeading>
        <Body>
          Open the builder and add your name and contact details, or drop an existing PDF, Word, or text resume to fill
          the matching sections. Work through experience, education, skills, and projects, and skip anything that
          doesn’t apply to this job. Use the “Make ATS-friendly” button on any summary, experience entry, or project you
          want tightened, then read the result. Pick one of the {TEMPLATE_COUNT_WORDS.toLowerCase()} templates in the
          live preview and download the PDF — the file is the same text-based page you just checked.
        </Body>

        <SectionHeading>An ATS-friendly formatting checklist</SectionHeading>
        <Body>
          Whatever tool you use, these habits keep a resume readable by tracking software:
        </Body>
        <List
          items={[
            "Use standard section names — Experience, Education, Skills — rather than clever ones.",
            "Keep every word as real text. Skills written inside an image or chart can’t be read.",
            "Write job titles and dates plainly, with the same date format throughout.",
            "Borrow the exact wording of skills from the job posting when you genuinely have them.",
            "Send a PDF unless the employer asks for Word, and keep the file name simple.",
            "Drop sections you have nothing for instead of leaving an empty heading.",
          ]}
        />

        <SectionHeading>What this doesn’t claim</SectionHeading>
        <Body>
          No template can “beat the ATS”, and you should be wary of anyone who says theirs does. Each employer sets up
          its system differently, and a recruiter still reads your resume in the end. What helps most is content: job
          titles people recognise, real dates, and skills you actually have, in words that match the job posting.
        </Body>
        <Body>
          For the longer explanation — how parsing works, what breaks it, and how recruiters search — read{" "}
          <TextLink href="/guides/how-applicant-tracking-systems-read-resumes">
            how applicant tracking systems read your resume
          </TextLink>
          . When you’re ready, pick a layout from the <TextLink href="/templates">free resume templates</TextLink>.
        </Body>

        <div className="mt-10">
          <BuilderCta>Create an ATS-friendly resume</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

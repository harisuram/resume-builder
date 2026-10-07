import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, List, MarketingPage, PageTitle, SectionHeading, TextLink } from "@/components/site/MarketingPage";
import { CONTACT_EMAIL, OPERATOR } from "@/lib/legal";
import { SITE_NAME, TEMPLATE_COUNT_WORDS, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

export default function AboutPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>{`About ${SITE_NAME}`}</PageTitle>
        <Lead>
          {SITE_NAME} is a resume and CV maker that works in your browser, costs nothing, and doesn’t ask you to sign
          up. It’s built and looked after by {OPERATOR}, and it exists because making a resume shouldn’t come with a
          catch.
        </Lead>

        <SectionHeading>Why it exists</SectionHeading>
        <Body>
          Plenty of “free” resume builders let you spend half an hour filling in your details, then ask for an email
          address, a subscription, or a payment before you can download the result. Others put a watermark on the PDF.
          That’s frustrating at the best of times, and worse when you’re between jobs or applying for your first one.
        </Body>
        <Body>
          This site works the other way round. You can open the builder, write your resume, and download the PDF
          without giving anything in return — not an email, not a phone number, not a credit card. There is no
          premium tier waiting at the end.
        </Body>

        <SectionHeading>What it does</SectionHeading>
        <List
          items={[
            "Lets you include only the sections that belong on your resume — experience, internships, projects, education, skills, certifications, and more — and leaves no empty headings for the ones you skip.",
            "Offers suggestions for roles, skills, degrees, and certifications across many fields, not just software: pharmacy, architecture, construction, IT, data, and others. You can always type your own.",
            `${TEMPLATE_COUNT_WORDS} templates share one preview, so you can switch designs at any point and see the change straight away.`,
            "Downloads a PDF that matches the preview exactly.",
            "Can read an existing PDF, Word, or text resume and fill in the matching sections, so you don’t start from scratch.",
          ]}
        />
        <Body>
          Alongside the builder, the <TextLink href="/guides">resume guides</TextLink> cover the writing itself:
          summaries, bullet points, skills, education, cover letters, career gaps, and how hiring software reads a
          resume. They’re written to be specific and honest — with real examples, and without made-up statistics.
        </Body>

        <SectionHeading>How your data is treated</SectionHeading>
        <Body>
          Your draft is saved in your own browser, not on a server. I can’t see it, and there’s no account for anyone
          to break into. The only times resume text leaves your device are when you choose to import a file or use the
          optional AI rewrite. The <TextLink href="/private">private resume builder</TextLink> page and the{" "}
          <TextLink href="/privacy">privacy policy</TextLink> explain exactly what happens in those cases.
        </Body>

        <SectionHeading>How it’s paid for</SectionHeading>
        <Body>
          The site shows a small number of ads from Google AdSense. They help pay for hosting and the AI service, and
          they’re what keeps the builder free for everyone. Ads never see the contents of your resume.
        </Body>

        <SectionHeading>What it isn’t</SectionHeading>
        <Body>
          It isn’t a job board, a recruitment agency, or a resume-hosting service, and it isn’t connected to any
          employer. It doesn’t claim to “beat” applicant tracking systems — the templates are simply built with clear
          headings and simple structure, which is what actually helps. And the optional AI rewrite only rephrases
          what you’ve already written; it isn’t meant to invent experience.
        </Body>

        <SectionHeading>Get in touch</SectionHeading>
        <Body>
          Suggestions, bug reports, and corrections are always welcome at{" "}
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>, or see the{" "}
          <TextLink href="/contact">contact page</TextLink> for what to include.
        </Body>

        <div className="mt-10">
          <BuilderCta>Start building</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

import { Article, Body, Lead, MarketingPage, PageTitle, SectionHeading, TextLink, Updated } from "@/components/site/MarketingPage";
import { CONTACT_EMAIL, formatLegalDate } from "@/lib/legal";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/disclaimer");

export default function DisclaimerPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Disclaimer</PageTitle>
        <Updated date={formatLegalDate()} />
        <Lead>
          {SITE_NAME} tries to give you a good tool and honest advice. But hiring is decided by people and companies I
          have no connection to, so there are limits to what any resume site can promise. Here they are, plainly.
        </Lead>

        <SectionHeading>The guides are general advice</SectionHeading>
        <Body>
          The guides are written to be practical and accurate, and I update them when I find something wrong. Still,
          they’re general information, not professional career, legal, or immigration advice. Hiring conventions differ
          between countries, industries, and individual employers, and they change over time. If an employer or job
          portal gives you specific instructions — a page limit, a required format, whether to include a photo —
          follow theirs over anything you read here.
        </Body>

        <SectionHeading>No guarantee of results</SectionHeading>
        <Body>
          A well-written resume improves your chances, but no template, guide, or tool can guarantee an interview or a
          job offer. Decisions are made by recruiters and hiring managers based on many things outside your resume,
          from how many people applied to what the team needs that month.
        </Body>

        <SectionHeading>About applicant tracking systems</SectionHeading>
        <Body>
          The templates use real text headings and simple structure, which helps hiring software read them. But there
          are many different applicant tracking systems, each set up differently by each employer, and I can’t test
          them all. Nothing on this site should be read as a promise that a resume will “pass” or “beat” any particular
          system.
        </Body>

        <SectionHeading>AI-generated suggestions</SectionHeading>
        <Body>
          The optional resume import and “Make ATS-friendly” rewrite use an AI model. Its output can contain mistakes:
          a detail placed in the wrong section, a number changed, or wording that claims more than you actually did.
          You’re responsible for checking every line before you send your resume anywhere. Never submit claims you
          can’t back up in an interview.
        </Body>

        <SectionHeading>Examples are fictional</SectionHeading>
        <Body>
          Names, companies, phone numbers, email addresses, links, and figures in sample resumes and guide examples are
          made up to illustrate a point. Any resemblance to real people or organisations is coincidental. Numbers in
          examples are illustrative — use only figures from your own work that you can explain.
        </Body>

        <SectionHeading>Ads and external links</SectionHeading>
        <Body>
          Ads on this site are served by Google, not chosen by me, and appearing here doesn’t mean I recommend the
          product or service. Links to other websites are provided for convenience; I don’t control those sites and
          am not responsible for their content.
        </Body>

        <SectionHeading>Keep your own copy</SectionHeading>
        <Body>
          Drafts are saved only in your browser. Clearing your browser data, using private browsing, or switching
          devices can mean losing a draft, and I have no way to recover it. Download a PDF of anything important.
        </Body>

        <SectionHeading>Spotted a problem?</SectionHeading>
        <Body>
          If a guide is wrong or out of date, or a template doesn’t print properly, please tell me at{" "}
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>. Corrections are genuinely welcome. See
          also the <TextLink href="/terms">terms and conditions</TextLink> and{" "}
          <TextLink href="/privacy">privacy policy</TextLink>.
        </Body>
      </Article>
    </MarketingPage>
  );
}

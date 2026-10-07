import { Article, Body, Lead, List, MarketingPage, PageTitle, SectionHeading, TextLink, Updated } from "@/components/site/MarketingPage";
import { CONTACT_EMAIL, OPERATOR, formatLegalDate } from "@/lib/legal";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Privacy policy</PageTitle>
        <Updated date={formatLegalDate()} />
        <Lead>
          {SITE_NAME} (freeresumebuilder.co.in) is run by {OPERATOR}. A resume is full of personal details, so I’ve
          tried to build this site to need as little of your data as possible, and to be plain about the few places
          where something does leave your device. This page explains exactly what happens to your information.
        </Lead>

        <SectionHeading>The short version</SectionHeading>
        <List
          items={[
            "There are no accounts. I never ask for your name, email, or a password to use the builder.",
            "Your resume draft is saved in your own browser, on your own device. It is not uploaded to a server I run.",
            "The site shows ads from Google AdSense. Google may use cookies to serve and measure those ads.",
            "Two optional features — importing an existing resume and the “Make ATS-friendly” rewrite — send text to an AI service to do their job. Nothing is sent unless you use them.",
            "I don’t sell personal information, and I have none to sell: I don’t keep copies of resumes.",
          ]}
        />

        <SectionHeading>What is stored in your browser</SectionHeading>
        <Body>
          The builder uses your browser’s local storage — a small storage area that belongs to this site, on your
          device. It holds:
        </Body>
        <List
          items={[
            "Your resume draft, saved when you click Save & Next or Skip, import a file, or download a PDF.",
            "Your light or dark theme choice.",
            "Whether you’ve already dismissed the builder’s quick tour, so it doesn’t keep reappearing.",
            "A short timer if the AI rewrite is temporarily busy, so the button can tell you when to try again.",
          ]}
        />
        <Body>
          I can’t see any of this from my side. You can delete it at any time by clicking Start new resume in the
          builder or by clearing this site’s data in your browser settings. Because it lives on one device, a draft
          started on your laptop won’t appear on your phone, and clearing your browser will remove it — download a PDF
          of anything you want to keep.
        </Body>

        <SectionHeading>Resume import and the AI rewrite</SectionHeading>
        <Body>
          When you import a resume, the file is opened and read inside your browser. The plain text taken from it is
          then sent to the site’s server so it can be sorted into the right sections. If you click “Make ATS-friendly”
          on your summary, an experience entry, or a project, the text of that one item (for example, a job’s title,
          company, and bullet points) is sent the same way so it can be rewritten.
        </Body>
        <Body>
          In both cases the server passes the text to{" "}
          <TextLink href="https://groq.com/privacy-policy/">Groq</TextLink>, an AI provider, gets the result back, and
          returns it to your browser. The server does not save the text, and its error logs record only error codes,
          not what you sent. Groq processes the request under its own privacy policy. If you’d rather none of your
          resume text leaves your device, don’t use these two features — everything else works without them, and
          import even has a basic offline fallback.
        </Body>

        <SectionHeading>Advertising and cookies</SectionHeading>
        <Body>
          The site is free because it shows ads served by Google AdSense. Some important points about how that works:
        </Body>
        <List
          items={[
            "Third-party vendors, including Google, use cookies to serve ads based on a visitor’s previous visits to this website or other websites.",
            "Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.",
            <>
              You can opt out of personalised advertising in Google’s{" "}
              <TextLink href="https://adssettings.google.com">Ad Settings</TextLink>, or opt out of some third-party
              vendors’ use of cookies for personalised advertising at{" "}
              <TextLink href="https://www.aboutads.info/choices/">aboutads.info</TextLink>.
            </>,
            <>
              Google explains what it does with data from sites that use its services in{" "}
              <TextLink href="https://policies.google.com/technologies/partner-sites">
                How Google uses information from sites or apps that use our services
              </TextLink>
              .
            </>,
          ]}
        />
        <Body>
          If you’re in the European Economic Area, the UK, or a US state with its own privacy law, you’ll see a consent
          message from Google before any advertising cookies are set. The ads never receive the contents of your resume — they only see what any web
          page sees, like your browser type and approximate location.
        </Body>

        <SectionHeading>Hosting and security</SectionHeading>
        <Body>
          The site is hosted on Cloudflare. Like any web host, Cloudflare handles your IP address and basic request
          details (the page requested, the time, your browser type) to deliver pages and protect the site from abuse.
          The AI features also use your IP address, briefly and in memory only, to limit how many requests one visitor
          can make per minute. I can see basic request logs — which page or feature was requested and whether it
          worked — to fix problems. I don’t use them to identify anyone.
        </Body>

        <SectionHeading>Children</SectionHeading>
        <Body>
          This site is meant for people preparing job applications and isn’t directed at children under 13. I don’t
          knowingly collect information from children, and since there are no accounts, there is nothing for a child
          to sign up for.
        </Body>

        <SectionHeading>Your choices and rights</SectionHeading>
        <Body>
          Because your resume stays on your device, you already control it completely: you can edit it, export it as a
          PDF, or delete it. Depending on where you live, you may also have legal rights to ask what data is held about
          you, or to have it corrected or deleted. For data held by Google or Cloudflare, their own privacy tools apply.
          For anything else, email me and I’ll help as far as I can — in practice I hold almost nothing that could be
          linked to you.
        </Body>

        <SectionHeading>Changes to this policy</SectionHeading>
        <Body>
          If the site changes how it handles data — for example, a new feature that sends information somewhere — I’ll
          update this page before that change goes live and change the date at the top.
        </Body>

        <SectionHeading>Contact</SectionHeading>
        <Body>
          Questions about privacy? Email <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>. More
          ways to reach me are on the <TextLink href="/contact">contact page</TextLink>, and a plain-English summary of
          how the builder keeps your work private is on the{" "}
          <TextLink href="/private">private resume builder</TextLink> page.
        </Body>
      </Article>
    </MarketingPage>
  );
}

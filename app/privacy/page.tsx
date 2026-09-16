import Link from "next/link";
import { Article, Body, Lead, MarketingPage, PageTitle, SectionHeading } from "@/components/site/MarketingPage";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Privacy</PageTitle>
        <Lead>
          {SITE_NAME} does not create accounts and does not host your resume on a server we run. This policy describes
          what the site does with information. The shorter product explanation is on the{" "}
          <Link href="/private" className="font-medium text-[var(--color-accent)] hover:underline">
            private resume builder
          </Link>{" "}
          page.
        </Lead>

        <SectionHeading>No account</SectionHeading>
        <Body>
          You can make a resume without an email address, password, or sign-up. There is no profile and no resume
          stored under a login we issue.
        </Body>

        <SectionHeading>Browser storage</SectionHeading>
        <Body>
          If you choose to save, a copy is written to this browser’s local storage on this device. Clearing site data
          in the browser removes it. We cannot read that copy from our side.
        </Body>

        <SectionHeading>Optional ads</SectionHeading>
        <Body>
          Some deployments load Google AdSense. If that script is present, Google may set cookies or collect device
          data according to Google’s own policies. AdSense is not a copy of your resume. If ads are not configured,
          the script is not loaded.
        </Body>

        <SectionHeading>Optional ATS rewrite</SectionHeading>
        <Body>
          If you click “Make ATS-friendly” on an experience entry, the bullets you submit are sent to a rewrite API so
          a model can return edited lines. Don’t click it if you don’t want those bullets to leave the device. Other
          fields are not sent by that control.
        </Body>

        <SectionHeading>PDF files</SectionHeading>
        <Body>
          Download uses the browser’s print-to-PDF flow on your machine. We don’t receive the file.
        </Body>

        <SectionHeading>Contact</SectionHeading>
        <Body>
          There is no user database to look up. Questions about this policy belong with whoever operates the domain
          you are visiting.
        </Body>
      </Article>
    </MarketingPage>
  );
}

import Link from "next/link";
import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, MarketingPage, PageTitle, SectionHeading } from "@/components/site/MarketingPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/private");

export default function PrivatePage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>A private resume builder that doesn’t require an account</PageTitle>
        <Lead>
          This is a safe, private resume builder and resume creator: no sign-up, no resume hosting, and nothing is
          written to this device until you choose to save. If you were searching for a secure resume maker, here’s
          what that actually means here.
        </Lead>

        <SectionHeading>What stays in your browser</SectionHeading>
        <Body>
          Editing happens on this page in your browser. There is no account, so there is no cloud copy of your resume
          waiting on a server we run. If you save, the copy is stored in this browser’s local storage on this device —
          not uploaded as a hosted file. Closing the tab without saving leaves nothing behind on disk beyond whatever
          the browser already held in memory.
        </Body>

        <SectionHeading>What does leave the device</SectionHeading>
        <Body>
          Two optional exceptions, and only those:
        </Body>
        <Body>
          If ads are enabled on this deployment, Google AdSense loads on some screens. That is Google’s ad script, not
          a copy of your resume.
        </Body>
        <Body>
          If you click “Make ATS-friendly” on an experience entry, those bullets are sent to a rewrite API so they can
          come back as plain, action-led lines. If you never click it, that request never happens.
        </Body>

        <SectionHeading>PDF download</SectionHeading>
        <Body>
          Download uses the browser’s print dialog against the live preview. The file is produced on your machine from
          the template you already reviewed.
        </Body>

        <SectionHeading>The legal page</SectionHeading>
        <Body>
          This page is the product explanation. The{" "}
          <Link href="/privacy" className="font-medium text-[var(--color-accent)] hover:underline">
            privacy policy
          </Link>{" "}
          is the same facts in policy form.
        </Body>

        <div className="mt-10">
          <BuilderCta>Build privately</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, List, MarketingPage, PageTitle, SectionHeading, TextLink } from "@/components/site/MarketingPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/private");

export default function PrivatePage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>A private resume builder that doesn’t require an account</PageTitle>
        <Lead>
          A resume holds your phone number, email, address, work history, and sometimes a photo. You shouldn’t have to
          hand all of that to a website just to format it. Here’s exactly where your information goes when you use
          this builder — and, mostly, where it doesn’t.
        </Lead>

        <SectionHeading>Your draft stays on your device</SectionHeading>
        <Body>
          You write your resume on this page, in your browser. When you click Save &amp; Next or Skip, the draft is
          saved to your browser’s local storage on this device. It isn’t uploaded to an account, because there are no
          accounts — so there’s no cloud copy sitting on a server, and nothing for anyone else to log in to.
        </Body>
        <Body>
          The flip side is worth knowing: the draft only exists on the device and browser you used. It won’t follow you
          from laptop to phone, and clearing your browser data deletes it. Click Start new resume in the builder to
          wipe it yourself.
        </Body>

        <SectionHeading>Your PDF is made on your device too</SectionHeading>
        <Body>
          The PDF is generated inside your browser and saved straight to your downloads. It isn’t built on a server,
          and I never receive a copy. The preview you see while editing is that same PDF, so there are no surprises
          when you open the file.
        </Body>

        <SectionHeading>The three times something leaves your device</SectionHeading>
        <Body>Being honest about privacy means listing the exceptions, so here they are:</Body>
        <List
          items={[
            "Ads. The site is paid for by Google AdSense, so Google’s ad script loads on some pages. It sees what any web page sees — like your browser and rough location — but never the contents of your resume.",
            "Importing a resume. If you drop in a PDF, Word, or text file, it’s read in your browser, then the extracted text is sent to the site’s server and an AI service so it can be sorted into the right sections. Don’t want that? Type your resume in instead.",
            "The “Make ATS-friendly” button. It appears on your summary, experience entries, and projects. Clicking it sends the text of that one item to an AI service to be rewritten. If you never click it, nothing is sent.",
          ]}
        />
        <Body>
          The server passes text through and returns the result; it doesn’t save what you sent. The full details,
          including the AI provider and cookies, are in the <TextLink href="/privacy">privacy policy</TextLink>.
        </Body>

        <SectionHeading>A few tips if privacy matters to you</SectionHeading>
        <List
          items={[
            "On a shared or public computer, click Start new resume when you’re done so your draft isn’t left behind.",
            "Keep the downloaded PDF somewhere safe — it’s your only copy outside the browser.",
            "You don’t need to put your full home address on a resume. A city and country is enough for most applications.",
          ]}
        />

        <div className="mt-10">
          <BuilderCta>Build privately</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

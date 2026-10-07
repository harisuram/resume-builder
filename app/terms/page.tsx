import { Article, Body, Lead, List, MarketingPage, PageTitle, SectionHeading, TextLink, Updated } from "@/components/site/MarketingPage";
import { CONTACT_EMAIL, JURISDICTION, OPERATOR, formatLegalDate } from "@/lib/legal";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/terms");

export default function TermsPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Terms and conditions</PageTitle>
        <Updated date={formatLegalDate()} />
        <Lead>
          These terms cover your use of {SITE_NAME} at freeresumebuilder.co.in, which is run by {OPERATOR}. I’ve kept
          them as short and readable as I can. By using the site, you agree to them — if you don’t, please don’t use
          it.
        </Lead>

        <SectionHeading>What the service is</SectionHeading>
        <Body>
          {SITE_NAME} is a free tool for writing a resume or CV in your browser and downloading it as a PDF, along with
          written guides about resumes and job applications. There is no account, subscription, or payment. I may add,
          change, or remove features, templates, or guides over time, and I can’t promise the site will always be
          available or free of errors.
        </Body>

        <SectionHeading>Your content belongs to you</SectionHeading>
        <Body>
          Everything you type or import into the builder is yours. I don’t claim any ownership of it, and because it’s
          stored in your own browser, I don’t have a copy. You can use the PDFs you create for any lawful purpose,
          including sending them to employers, recruiters, and job portals.
        </Body>
        <Body>
          You’re responsible for what your resume says. Please make sure it’s accurate and that you have the right to
          include anything you add, such as a photo.
        </Body>

        <SectionHeading>Acceptable use</SectionHeading>
        <Body>Please use the site the way it’s meant to be used. In particular, don’t:</Body>
        <List
          items={[
            "use it to create false or misleading documents, such as a resume claiming qualifications or jobs you don’t have, with the aim of deceiving an employer;",
            "upload files you don’t have the right to use, or that contain malware;",
            "try to overload, scrape, or interfere with the site or its AI features, for example with automated requests or by getting around rate limits;",
            "attempt to access parts of the site or its systems that aren’t meant to be public;",
            "resell or rebrand the service as your own.",
          ]}
        />

        <SectionHeading>The optional AI features</SectionHeading>
        <Body>
          Resume import and the “Make ATS-friendly” rewrite use a third-party AI model. AI output can be wrong — it may
          misplace a section, drop a detail, or phrase something in a way that overstates or understates what you did.
          Always read the result and correct it before you use it. These features may be limited, paused, or
          unavailable at busy times, and they’re offered as a convenience without any guarantee.
        </Body>

        <SectionHeading>Templates and site content</SectionHeading>
        <Body>
          You’re free to use the templates for your own resumes and CVs. The site’s design, code, text, and guides are
          protected by copyright. You’re welcome to link to any guide or quote a short passage with a link back, but
          please don’t copy whole guides or republish the templates as your own product. Some components are open-source
          and remain under their own licences.
        </Body>

        <SectionHeading>Advertising and external links</SectionHeading>
        <Body>
          The site is supported by ads from Google AdSense, and the guides occasionally link to other websites. I don’t
          control ads or other sites and am not responsible for their content, products, or privacy practices. Seeing
          an ad here isn’t an endorsement.
        </Body>

        <SectionHeading>No guarantees</SectionHeading>
        <Body>
          The site is provided “as is”. I work to keep it accurate and running, but I can’t guarantee that using it
          will get you an interview or a job, that your resume will be read in a particular way by any employer or
          applicant tracking system, or that the site will be free of bugs. The{" "}
          <TextLink href="/disclaimer">disclaimer</TextLink> explains this in more detail.
        </Body>

        <SectionHeading>Limitation of liability</SectionHeading>
        <Body>
          To the extent the law allows, I’m not liable for any indirect or consequential loss arising from your use of
          the site — including lost opportunities, lost drafts (for example after clearing your browser), or decisions
          made by employers. Because the service is free, my total liability for any claim relating to it is limited
          to the amount you paid to use it, which is nothing. Nothing in these terms limits any rights you have that
          can’t legally be excluded.
        </Body>

        <SectionHeading>Privacy</SectionHeading>
        <Body>
          How the site handles information is set out in the <TextLink href="/privacy">privacy policy</TextLink>, which
          forms part of these terms.
        </Body>

        <SectionHeading>Changes to these terms</SectionHeading>
        <Body>
          I may update these terms as the site changes. The date at the top shows when they last changed. If you keep
          using the site after an update, the new terms apply.
        </Body>

        <SectionHeading>Governing law</SectionHeading>
        <Body>
          These terms are governed by the laws of {JURISDICTION}, and any disputes will be handled by the courts of{" "}
          {JURISDICTION}. If you’re a consumer living elsewhere, you keep any protections your local law gives you.
        </Body>

        <SectionHeading>Contact</SectionHeading>
        <Body>
          Questions about these terms? Email <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>.
        </Body>
      </Article>
    </MarketingPage>
  );
}

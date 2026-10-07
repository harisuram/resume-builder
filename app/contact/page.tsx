import { Article, Body, Lead, List, MarketingPage, PageTitle, SectionHeading, TextLink } from "@/components/site/MarketingPage";
import { CONTACT_EMAIL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/contact");

export default function ContactPage() {
  return (
    <MarketingPage>
      <Article>
        <PageTitle>Contact</PageTitle>
        <Lead>
          Found a bug, a template that prints oddly, or a mistake in one of the guides? Have an idea for something the
          builder should do? I’d like to hear it. The site is run by one person, and messages from people actually using
          it are the most useful feedback I get.
        </Lead>

        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Email</p>
          <p className="mt-2 font-display text-[18px] font-semibold tracking-tight break-all">
            <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
            I read every message and try to reply within a few working days.
          </p>
        </div>

        <SectionHeading>Reporting a bug</SectionHeading>
        <Body>A few details make it much quicker to find and fix:</Body>
        <List
          items={[
            "what you were doing when it went wrong, step by step;",
            "your device and browser — for example, “Android phone, Chrome” or “Windows laptop, Edge”;",
            "which template you had selected, if it’s about the preview or the PDF;",
            "a screenshot, if you can take one.",
          ]}
        />
        <Body>
          Please don’t send your whole resume or any personal details I don’t need. A screenshot with your name and
          contact details blurred out is perfect.
        </Body>

        <SectionHeading>Corrections to the guides</SectionHeading>
        <Body>
          If something in a guide is wrong, outdated, or doesn’t match how hiring works in your country or industry,
          tell me which guide and what you’d change. I update guides when readers point out problems.
        </Body>

        <SectionHeading>Privacy questions</SectionHeading>
        <Body>
          Your resume drafts are stored in your browser, not with me, so I can’t look up, recover, or delete them —
          but I’m happy to answer any question about how the site handles data. The{" "}
          <TextLink href="/privacy">privacy policy</TextLink> covers the details.
        </Body>

        <SectionHeading>What I can’t help with</SectionHeading>
        <Body>
          I’m not able to review individual resumes, write resumes for people, or pass applications on to employers —
          and I’m not connected to any company or job portal. For writing help, the{" "}
          <TextLink href="/guides">resume guides</TextLink> are the best place to start.
        </Body>
      </Article>
    </MarketingPage>
  );
}

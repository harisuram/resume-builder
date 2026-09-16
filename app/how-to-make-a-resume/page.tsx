import Link from "next/link";
import { BuilderCta } from "@/components/site/BuilderCta";
import { Article, Body, Lead, MarketingPage, PageTitle, SectionHeading } from "@/components/site/MarketingPage";
import { HOW_TO_STEPS, howToJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/how-to-make-a-resume");

export default function HowToMakeAResumePage() {
  return (
    <MarketingPage jsonLd={howToJsonLd()}>
      <Article>
        <PageTitle>How to make a resume in about ten minutes</PageTitle>
        <Lead>
          You don’t need an account. This walkthrough matches the real editor: name and contact (with a country-code
          phone), suggestions for any field, only the sections that belong, a template, then a PDF. Same steps if you’re
          making a CV or a free curriculum vitae.
        </Lead>

        <ol className="mt-10 space-y-8">
          {HOW_TO_STEPS.map((step, i) => (
            <li id={`step-${i + 1}`} key={step.name} className="list-none">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                Step {i + 1}
              </p>
              <h2 className="mt-1 font-display text-[18px] font-semibold text-[var(--color-ink)]">{step.name}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">{step.text}</p>
            </li>
          ))}
        </ol>

        <SectionHeading>What you can skip</SectionHeading>
        <Body>
          Every content section is optional. Internships, patents, hobbies, a photo — if it isn’t on this resume, skip
          it. Skipped sections never print an empty heading. That’s the whole product: make a resume from only the
          parts you need.
        </Body>

        <SectionHeading>After you download</SectionHeading>
        <Body>
          The PDF is the live preview you already checked. If you want a different look, switch templates and download
          again. For a private, no-account workflow see{" "}
          <Link href="/private" className="font-medium text-[var(--color-accent)] hover:underline">
            how data stays on your device
          </Link>
          , or browse{" "}
          <Link href="/templates" className="font-medium text-[var(--color-accent)] hover:underline">
            free resume templates
          </Link>
          .
        </Body>

        <div className="mt-10">
          <BuilderCta>Make a resume</BuilderCta>
        </div>
      </Article>
    </MarketingPage>
  );
}

import { BuilderCta } from "@/components/site/BuilderCta";
import { Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/templates");

export default function TemplatesPage() {
  return (
    <MarketingPage>
      <div className="mx-auto w-full max-w-4xl">
        <PageTitle>Free resume templates (and CV layouts)</PageTitle>
        <Lead>
          Twenty-one free resume templates, including curriculum vitae layouts. Switch designs in the live preview —
          the PDF is the same view. This list is the gallery; the editor is where you actually pick one.
        </Lead>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <li
              key={template.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <h2 className="font-display text-[16px] font-semibold text-[var(--color-ink)]">{template.name}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{template.description}</p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">
          Make a resume with any of these, or use them as a free curriculum vitae. Empty sections are omitted, so a
          skipped block never leaves a blank heading on the page.
        </p>

        <div className="mt-8">
          <BuilderCta>Make a resume with these templates</BuilderCta>
        </div>
      </div>
    </MarketingPage>
  );
}

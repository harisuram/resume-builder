import { BuilderCta } from "@/components/site/BuilderCta";
import { Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { TemplatesGallery } from "@/components/site/TemplatesGallery";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/templates");

export default function TemplatesPage() {
  return (
    <MarketingPage>
      <div className="mx-auto w-full max-w-4xl">
        <PageTitle>Free resume templates (and CV layouts)</PageTitle>
        <Lead>
          Twenty-one free resume templates, including curriculum vitae layouts. Open a preview to see the section
          layout — names stay, content is a skeleton — then take that design into the editor. The PDF is the same
          view.
        </Lead>

        <TemplatesGallery />

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

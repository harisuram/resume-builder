import { Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { TemplatesGallery } from "@/components/site/TemplatesGallery";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/templates");

export default function TemplatesPage() {
  return (
    <MarketingPage>
      <div className="mx-auto w-full min-w-0 max-w-6xl pb-10">
        <div className="animate-fade-up mx-auto w-full max-w-3xl md:mx-0">
          <PageTitle>Free resume templates (and CV layouts)</PageTitle>
          <Lead>
            {TEMPLATES.length} free resume templates, including curriculum vitae layouts. Each tile is a picture of
            that layout filled with sample text — the same look you&apos;ll get as a PDF. Open a sheet for a closer look, or send
            one straight to the builder.
          </Lead>
        </div>

        <TemplatesGallery />
      </div>
    </MarketingPage>
  );
}

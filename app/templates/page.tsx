import { Lead, MarketingPage, PageTitle } from "@/components/site/MarketingPage";
import { TemplatesGallery } from "@/components/site/TemplatesGallery";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/templates");

export default function TemplatesPage() {
  return (
    <MarketingPage>
      <div className="mx-auto w-full min-w-0 max-w-6xl pb-28">
        <div className="animate-fade-up mx-auto w-full max-w-3xl md:mx-0">
          <PageTitle>Free resume templates (and CV layouts)</PageTitle>
          <Lead>
            Twenty-one free resume templates, including curriculum vitae layouts. Each tile is a live layout preview —
            names stay, content is a skeleton of the PDF. Select one, then continue into the builder.
          </Lead>
        </div>

        <TemplatesGallery />
      </div>
    </MarketingPage>
  );
}

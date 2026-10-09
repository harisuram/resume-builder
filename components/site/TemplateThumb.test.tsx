import { existsSync } from "fs";
import { join } from "path";
import { renderToString } from "react-dom/server";
import Home from "@/app/page";
import TemplatesPage from "@/app/templates/page";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { GALLERY_SAMPLE_RESUME } from "@/lib/sampleResume";
import { templateThumbSrc } from "./TemplateThumb";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe("template thumbnails", () => {
  it("has a picture for every template — run `npm run thumbs` after adding one", () => {
    const missing = TEMPLATES.filter(
      (template) => !existsSync(join(__dirname, "../../public", templateThumbSrc(template.id))),
    ).map((template) => template.id);
    expect(missing).toEqual([]);
  });

  /* Live tiles put the whole sample résumé into the page text once per
   * template — near-duplicate filler to a crawler or an AdSense reviewer. */
  it.each([
    ["the templates gallery", () => <TemplatesPage />],
    ["the homepage strip", () => <Home />],
  ])("keeps the sample résumé text out of %s", (_label, page) => {
    const html = renderToString(page());
    expect(html).not.toContain(GALLERY_SAMPLE_RESUME.sections.summary as string);
    expect(html).not.toContain("Massachusetts Institute of Technology");
    expect(html).toContain(templateThumbSrc(TEMPLATES[0].id));
  });
});

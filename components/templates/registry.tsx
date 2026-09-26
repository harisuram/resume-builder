import type { ResumeData, TemplateId } from "@/lib/types";
import { TEMPLATES, canonicalTemplateId, getTheme } from "./shared/theme";
import { TemplateRenderer } from "./TemplateRenderer";
import { NocturneTemplate } from "./NocturneTemplate";

export { TEMPLATES as TEMPLATE_LIST } from "./shared/theme";

/** The candidate name is the document's `<h1>` in the live builder preview
 * and the printed PDF — both render exactly one template as the whole page.
 * Marketing-site previews (template strip, gallery, modal) render several
 * templates at once as decorative thumbnails, so they pass `"p"` to avoid
 * multiple `<h1>`s on one page. Defaults to `"h1"` so every existing caller
 * (builder pane, export, empty state) keeps today's behavior untouched. */
export type NameHeadingLevel = "h1" | "p";

export type TemplateComponent = (props: {
  data: ResumeData;
  headingLevel?: NameHeadingLevel;
}) => React.ReactElement;

function makeTemplate(id: TemplateId): TemplateComponent {
  const theme = getTheme(id);
  return function Template({ data, headingLevel }: { data: ResumeData; headingLevel?: NameHeadingLevel }) {
    return <TemplateRenderer data={data} theme={theme} headingLevel={headingLevel} />;
  };
}

export const TEMPLATE_COMPONENTS: Record<TemplateId, TemplateComponent> = Object.fromEntries(
  TEMPLATES.map((theme) => [
    theme.id,
    theme.id === "nocturne" ? NocturneTemplate : makeTemplate(theme.id),
  ]),
);

export function getTemplateComponent(id: TemplateId): TemplateComponent {
  return TEMPLATE_COMPONENTS[canonicalTemplateId(id)] ?? TEMPLATE_COMPONENTS[TEMPLATES[0].id];
}

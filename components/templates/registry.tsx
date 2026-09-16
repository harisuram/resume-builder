import type { ResumeData, TemplateId } from "@/lib/types";
import { TEMPLATES, getTheme } from "./shared/theme";
import { TemplateRenderer } from "./TemplateRenderer";
import { VitaeTemplate } from "./VitaeTemplate";

export { TEMPLATES as TEMPLATE_LIST } from "./shared/theme";

export type TemplateComponent = (props: { data: ResumeData }) => React.ReactElement;

function makeTemplate(id: TemplateId): TemplateComponent {
  const theme = getTheme(id);
  return function Template({ data }: { data: ResumeData }) {
    return <TemplateRenderer data={data} theme={theme} />;
  };
}

export const TEMPLATE_COMPONENTS: Record<TemplateId, TemplateComponent> = Object.fromEntries(
  TEMPLATES.map((theme) => [
    theme.id,
    theme.id === "jsonresume-vitae" ? VitaeTemplate : makeTemplate(theme.id),
  ]),
);

export function getTemplateComponent(id: TemplateId): TemplateComponent {
  return TEMPLATE_COMPONENTS[id] ?? TEMPLATE_COMPONENTS[TEMPLATES[0].id];
}

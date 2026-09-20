import type { ResumeData } from "@/lib/types";
import { AsymmetricLayout } from "./layouts/AsymmetricLayout";
import { LabeledLayout } from "./layouts/LabeledLayout";
import { SidebarLayout } from "./layouts/SidebarLayout";
import { SingleColumnLayout } from "./layouts/SingleColumnLayout";
import type { NameHeadingLevel } from "./registry";
import type { TemplateTheme } from "./shared/theme";

export function TemplateRenderer({
  data,
  theme,
  headingLevel,
}: {
  data: ResumeData;
  theme: TemplateTheme;
  headingLevel?: NameHeadingLevel;
}) {
  switch (theme.layout) {
    case "sidebar":
      return <SidebarLayout data={data} theme={theme} headingLevel={headingLevel} />;
    case "asymmetric":
      return <AsymmetricLayout data={data} theme={theme} headingLevel={headingLevel} />;
    case "labeled":
      return <LabeledLayout data={data} theme={theme} headingLevel={headingLevel} />;
    case "single":
    default:
      return <SingleColumnLayout data={data} theme={theme} headingLevel={headingLevel} />;
  }
}

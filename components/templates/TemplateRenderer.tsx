import type { ResumeData } from "@/lib/types";
import { AsymmetricLayout } from "./layouts/AsymmetricLayout";
import { LabeledLayout } from "./layouts/LabeledLayout";
import { SidebarLayout } from "./layouts/SidebarLayout";
import { SingleColumnLayout } from "./layouts/SingleColumnLayout";
import type { TemplateTheme } from "./shared/theme";

export function TemplateRenderer({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  switch (theme.layout) {
    case "sidebar":
      return <SidebarLayout data={data} theme={theme} />;
    case "asymmetric":
      return <AsymmetricLayout data={data} theme={theme} />;
    case "labeled":
      return <LabeledLayout data={data} theme={theme} />;
    case "single":
    default:
      return <SingleColumnLayout data={data} theme={theme} />;
  }
}

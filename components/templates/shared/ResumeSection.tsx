import { resumeSectionTitle } from "@/lib/persona";
import { NARROW_SECTION_KEYS } from "@/lib/resume";
import type { ResumeData, SectionKey } from "@/lib/types";
import {
  AdditionalList,
  CertificationList,
  ChipOrInline,
  EducationList,
  ExperienceList,
  itemBreaks,
  KeyAchievementsList,
  LanguageList,
  PatentList,
  ProjectList,
} from "./atoms";
import { SectionHeading } from "./SectionHeading";
import type { TemplateTheme } from "./theme";

export { NARROW_SECTION_KEYS };

/** The one place every layout asks "how do I draw this section?" —
 * SingleColumn, Sidebar, and Asymmetric all go through here so a new
 * section can't silently appear in one template family and not the others. */
export function ResumeSection({
  section,
  data,
  theme,
  light = false,
  preferInline = false,
}: {
  section: SectionKey;
  data: ResumeData;
  theme: TemplateTheme;
  light?: boolean;
  /** Force chip-style lists (skills, hobbies, soft skills) to a single
   * inline line — used in the asymmetric layout's narrow column, where
   * wrapping chips overflow the 32% width. */
  preferInline?: boolean;
}) {
  const title = resumeSectionTitle(section, data);
  const heading = <SectionHeading theme={theme} section={section} title={title} light={light} />;
  const compact = preferInline || theme.density === "compact";
  const breaks = itemBreaks(data, section);

  switch (section) {
    case "summary":
      return null;
    case "keyAchievements":
      return (
        <>
          {heading}
          <KeyAchievementsList items={data.sections.keyAchievements!} theme={theme} breaks={breaks} light={light} />
        </>
      );
    case "education":
      return (
        <>
          {heading}
          <EducationList items={data.sections.education!} theme={theme} breaks={breaks} light={light} />
        </>
      );
    case "experience":
    case "internships":
    case "partTime":
      return (
        <>
          {heading}
          <ExperienceList items={data.sections[section]!} theme={theme} breaks={breaks} light={light} />
        </>
      );
    case "projects":
      return (
        <>
          {heading}
          <ProjectList
            items={data.sections.projects!}
            theme={theme}
            accent={theme.accent}
            breaks={breaks}
            light={light}
          />
        </>
      );
    case "skills":
      return (
        <>
          {heading}
          <ChipOrInline items={data.sections.skills!} accent={theme.accent} compact={compact} light={light} />
        </>
      );
    case "certifications":
      return (
        <>
          {heading}
          <CertificationList items={data.sections.certifications!} breaks={breaks} light={light} />
        </>
      );
    case "patents":
      return (
        <>
          {heading}
          <PatentList items={data.sections.patents!} accent={theme.accent} breaks={breaks} light={light} />
        </>
      );
    case "languages":
      return (
        <>
          {heading}
          <LanguageList items={data.sections.languages!} breaks={breaks} light={light} />
        </>
      );
    case "hobbies":
      return (
        <>
          {heading}
          <ChipOrInline items={data.sections.hobbies!} accent={theme.accent} compact={compact} light={light} />
        </>
      );
    case "softSkills":
      return (
        <>
          {heading}
          <ChipOrInline items={data.sections.softSkills!} accent={theme.accent} compact={compact} light={light} />
        </>
      );
    case "additional":
      return (
        <>
          {heading}
          <AdditionalList items={data.sections.additional!.items} theme={theme} breaks={breaks} light={light} />
        </>
      );
  }
}

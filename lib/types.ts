export type SectionStatus = "not_started" | "complete" | "skipped";
export type TemplateId = string;

export interface BasicInfo {
  name: string;
  email: string;
  /** Digits only — the dial code lives in phoneCountryCode. */
  phone: string;
  /** E.164 dial code, e.g. "+1". Absent means the default (see
   * lib/countryCodes.ts) rather than "no country picked". */
  phoneCountryCode?: string;
  location: string;
  links: { linkedin?: string; github?: string; portfolio?: string };
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string; // absent = present
  gpa?: string;
  coursework?: string[];
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  /** When true, the end date is "Present" on the preview and PDF. Legacy
   * entries with no `current` flag still treat a missing end date as present. */
  current?: boolean;
  bullets: string[];
}

export interface Project {
  name: string;
  description: string;
  link?: string;
  technologies?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Patent {
  title: string;
  number?: string;
  date?: string;
  office?: string;
  link?: string;
}

export const LANGUAGE_LEVELS = ["Native", "Fluent", "Professional", "Intermediate", "Basic"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export interface Language {
  name: string;
  level: LanguageLevel;
}

export interface AdditionalItem {
  title: string;
  subtitle?: string;
  date?: string;
  bullets: string[];
}

/** One freeform block: a user-named heading plus a list of entries. */
export interface AdditionalSection {
  heading: string;
  items: AdditionalItem[];
}

/** Keys that carry list/text content, i.e. everything skippable. */
export interface ResumeSections {
  summary: string;
  keyAchievements: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  internships: Experience[];
  partTime: Experience[];
  skills: string[];
  certifications: Certification[];
  patents: Patent[];
  languages: Language[];
  hobbies: string[];
  softSkills: string[];
  additional: AdditionalSection;
}

export type SectionKey = keyof ResumeSections;

export interface ResumeData {
  basicInfo: BasicInfo;
  /** Cropped square headshot as a data URL. Optional — only templates with
   * an avatar slot (theme.showAvatar) render it. */
  photo?: string;
  sections: Partial<ResumeSections>;
  sectionStatus: Record<string, SectionStatus>;
  templateId: TemplateId;
  /** Content sections the user has explicitly chosen to start on a fresh
   * printed page, typically because a page break was otherwise falling
   * mid-section. Includes summary — rare, but the preview and both downloads
   * have to honor it the same way as any other section. */
  pageBreakSections?: SectionKey[];
  /** Individual list entries the user has pushed onto a fresh printed page,
   * as `"<sectionKey>:<index>"` — the third project is `"projects:2"`. The
   * finer-grained counterpart to pageBreakSections: when one entry straddles
   * a page boundary, moving just that entry is nearly always what's wanted,
   * where forcing its whole section down drags every earlier entry with it.
   * Indexed rather than keyed by identity because list entries carry no id;
   * removeListItem re-points these when entries above one are deleted. */
  pageBreakItems?: string[];
  /** Custom order for content sections, set once the user moves anything
   * via the section nav. Absent = use the default order (lib/persona.ts).
   * Summary is intentionally not part of this — see getNavSectionOrder. */
  sectionOrder?: SectionKey[];
}

import type { SectionKey } from "@/lib/types";

type IconProps = { className?: string };

function Base({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-3.5 w-3.5"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Brand marks (GitHub, LinkedIn) are solid glyphs, not the stroked line
 * icons the rest of this file draws — a stroked outline of a logo reads as
 * "broken", not "themed". `currentColor` keeps them monochrome so they don't
 * fight the resume's own accent color. */
function FilledBase({
  children,
  className,
  viewBox = "0 0 24 24",
}: {
  children: React.ReactNode;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg viewBox={viewBox} fill="currentColor" className={className ?? "h-3.5 w-3.5"} aria-hidden="true">
      {children}
    </svg>
  );
}

export function EducationIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 8.5 12 4l10 4.5-10 4.5-10-4.5Z" />
      <path d="M6 10.7v4.3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.3" />
      <path d="M21 8.5v6" />
    </Base>
  );
}

export function ExperienceIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </Base>
  );
}

export function ProjectIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 8-4 4 4 4" />
      <path d="m15 8 4 4-4 4" />
    </Base>
  );
}

export function SkillIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14.5 3.5 12 6l-1.5-1.5L8 7l1.5 1.5L3 15v3.5H6.5L14 11l1.5 1.5 2.5-2.5L16.5 8.5 19 6l-4.5-2.5Z" />
    </Base>
  );
}

export function KeyAchievementIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m12 3.5 2.3 4.7 5.2.75-3.75 3.65.9 5.2L12 15.3l-4.65 2.5.9-5.2-3.75-3.65 5.2-.75L12 3.5Z" />
    </Base>
  );
}

export function CertificationIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 6 5-2.5 5 2.5-1.5-6" />
    </Base>
  );
}

export function PatentIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 13h6" />
      <path d="M9 16.5h4" />
    </Base>
  );
}

export function LanguageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.2-3.7-8.5S9.6 5.8 12 3.5Z" />
    </Base>
  );
}

export function HobbyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5.5v-2" />
      <path d="M12 20.5v-2" />
      <path d="m7.4 7.4-1.4-1.4" />
      <path d="m18 18-1.4-1.4" />
      <path d="M5.5 12h-2" />
      <path d="M20.5 12h-2" />
      <path d="m7.4 16.6-1.4 1.4" />
      <path d="m18 6-1.4 1.4" />
    </Base>
  );
}

export function SoftSkillIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="2.4" />
      <circle cx="15.5" cy="8.5" r="2" />
      <path d="M4.5 18c.4-2.6 2.4-4 4.5-4s4.1 1.4 4.5 4" />
      <path d="M14 14.2c1.6-.3 3.4.6 4 2.8" />
    </Base>
  );
}

export function AdditionalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 6.5h14" />
      <path d="M5 12h14" />
      <path d="M5 17.5h9" />
    </Base>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.2-3.7-8.5S9.6 5.8 12 3.5Z" />
    </Base>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <FilledBase {...props} viewBox="0 0 16 16">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </FilledBase>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <FilledBase {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </FilledBase>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m4 7 8 6 8-6" />
    </Base>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h3l1.2 4-2 1.3a10.5 10.5 0 0 0 5 5l1.3-2 4 1.2v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 4.5 5.1 1.5 1.5 0 0 1 6 3.5Z" />
    </Base>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </Base>
  );
}

const SECTION_ICONS: Partial<Record<SectionKey, (p: IconProps) => React.ReactElement>> = {
  education: EducationIcon,
  experience: ExperienceIcon,
  internships: ExperienceIcon,
  partTime: ExperienceIcon,
  projects: ProjectIcon,
  skills: SkillIcon,
  certifications: CertificationIcon,
  keyAchievements: KeyAchievementIcon,
  patents: PatentIcon,
  languages: LanguageIcon,
  hobbies: HobbyIcon,
  softSkills: SoftSkillIcon,
  additional: AdditionalIcon,
};

export function SectionIcon({ section, className }: { section: SectionKey; className?: string }) {
  const Icon = SECTION_ICONS[section];
  if (!Icon) return null;
  return <Icon className={className} />;
}

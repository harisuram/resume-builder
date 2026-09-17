import type { CSSProperties } from "react";
import type { NavKey } from "./nav";

function Svg({ children, filled }: { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full overflow-visible"
    >
      {children}
    </svg>
  );
}

type IconProps = { filled?: boolean };

function BasicInfoIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.4 19c.7-3.2 3.1-5 6.6-5s5.9 1.8 6.6 5" />
    </Svg>
  );
}

function SummaryIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <rect x="4.5" y="6" width="15" height="2.4" rx="1.2" />
      <rect x="4.5" y="10.8" width="15" height="2.4" rx="1.2" />
      <rect x="4.5" y="15.6" width="9" height="2.4" rx="1.2" />
    </Svg>
  );
}

function PhotoIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M8 8 9.6 5h4.8L16 8" />
      <rect x="3.5" y="8" width="17" height="11.5" rx="2" />
      <circle cx="12" cy="13.8" r="3.1" className="nav-icon-cut" />
    </Svg>
  );
}

function KeyAchievementsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="m12 3.5 2.3 4.7 5.2.75-3.75 3.65.9 5.2L12 15.3l-4.65 2.5.9-5.2-3.75-3.65 5.2-.75L12 3.5Z" />
    </Svg>
  );
}

function ExperienceIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <rect x="3" y="7.5" width="18" height="12" rx="1.6" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" className="nav-icon-cut" />
    </Svg>
  );
}

function InternshipsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M9 7V5.4a3 3 0 0 1 6 0V7" />
      <rect x="6" y="7" width="12" height="13.5" rx="1.6" />
      <circle cx="12" cy="13" r="2" className="nav-icon-cut" />
      <path d="M8.6 18.2c.5-1.5 1.8-2.2 3.4-2.2s2.9.7 3.4 2.2" className="nav-icon-cut" />
    </Svg>
  );
}

function PartTimeIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.2v4.8" className="nav-icon-hand" />
      <path d="M12 12l3.4 2.2" className="nav-icon-hand" />
    </Svg>
  );
}

function ProjectsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="m8.5 8-4 4 4 4" fill="none" strokeWidth={filled ? 2.5 : 1.7} />
      <path d="m15.5 8 4 4-4 4" fill="none" strokeWidth={filled ? 2.5 : 1.7} />
    </Svg>
  );
}

function EducationIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M3 9.2 12 5l9 4.2-9 4.2-9-4.2Z" />
      <path d="M7 12.2v3.6c0 1.3 2.4 2.4 5 2.4s5-1.1 5-2.4v-3.6" />
      <path d="M20.2 9.4v5.8" className="nav-icon-tassel" />
    </Svg>
  );
}

function SkillsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M14.6 3.6 12 6.2 10.4 4.6 8 7l1.6 1.6L3.2 15.2V19h3.8L14.4 11l1.6 1.6 2.4-2.4-1.6-1.6 2.4-2.6-4.6-2.4Z" />
    </Svg>
  );
}

function CertificationsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <circle cx="12" cy="9" r="5.4" />
      <path d="m8.6 13.4-1.5 6.1 4.9-2.4 4.9 2.4-1.5-6.1" />
    </Svg>
  );
}

function PatentsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M7 3.6h7l4 4v12.8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1Z" />
      <path d="M14 3.6v4h4" />
      <path d="M9 13h6" className="nav-icon-cut" />
      <path d="M9 16.4h4" className="nav-icon-cut" />
    </Svg>
  );
}

function LanguagesIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8" className="nav-icon-cut" />
      <path d="M12 3.6c2.3 2.2 3.6 5.1 3.6 8.4s-1.3 6.2-3.6 8.4c-2.3-2.2-3.6-5.1-3.6-8.4S9.7 5.8 12 3.6Z" className="nav-icon-cut" />
    </Svg>
  );
}

function HobbiesIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M12 20s-7-4.3-7-9.1A4 4 0 0 1 12 7.8 4 4 0 0 1 19 10.9C19 15.7 12 20 12 20Z" />
    </Svg>
  );
}

function SoftSkillsIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <circle cx="9" cy="8" r="2.3" />
      <circle cx="15.6" cy="8.4" r="1.9" />
      <path d="M4.6 18c.4-2.5 2.3-3.9 4.4-3.9s4 1.4 4.4 3.9" />
      <path d="M14 14.3c1.6-.3 3.3.6 3.9 2.7" />
    </Svg>
  );
}

function AdditionalIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8" className="nav-icon-cut" />
      <path d="M8 12h8" className="nav-icon-cut" />
    </Svg>
  );
}

function ExportIcon({ filled }: IconProps) {
  return (
    <Svg filled={filled}>
      <path d="M7 3.6h7l4 4v12.8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1Z" />
      <path d="M14 3.6v4h4" />
      <path d="M12 10.8v6" className="nav-icon-arrow" />
      <path d="m9.6 14.4 2.4 2.4 2.4-2.4" className="nav-icon-arrow" />
    </Svg>
  );
}

const ICONS: Record<NavKey, (p: IconProps) => React.ReactElement> = {
  basicInfo: BasicInfoIcon,
  summary: SummaryIcon,
  photo: PhotoIcon,
  keyAchievements: KeyAchievementsIcon,
  experience: ExperienceIcon,
  internships: InternshipsIcon,
  partTime: PartTimeIcon,
  projects: ProjectsIcon,
  education: EducationIcon,
  skills: SkillsIcon,
  certifications: CertificationsIcon,
  patents: PatentsIcon,
  languages: LanguagesIcon,
  hobbies: HobbiesIcon,
  softSkills: SoftSkillsIcon,
  additional: AdditionalIcon,
  export: ExportIcon,
};

export function NavSectionIcon({
  navKey,
  active = false,
  skipped = false,
  delayMs = 0,
}: {
  navKey: NavKey;
  active?: boolean;
  skipped?: boolean;
  delayMs?: number;
}) {
  const Icon = ICONS[navKey];
  return (
    <span
      data-nav-icon={navKey}
      data-active={active ? "true" : undefined}
      className={`nav-section-icon ${skipped ? "text-[var(--color-ink-faint)] md:text-inherit" : ""}`}
      style={{ "--nav-icon-delay": `${delayMs}ms` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="nav-icon-motion">
        <Icon filled={active} />
      </span>
    </span>
  );
}

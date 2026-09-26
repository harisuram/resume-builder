import type { SectionKey } from "@/lib/types";
import { ICONS, LINE_ICON_STROKE, SECTION_ICON_NAMES, type IconDef, type IconName, type IconShape } from "./iconShapes";

type IconProps = { className?: string };

export function IconShapeElement({ shape }: { shape: IconShape }) {
  switch (shape.tag) {
    case "path":
      return <path d={shape.d} />;
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />;
    case "rect":
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
  }
}

/** Brand marks (GitHub, LinkedIn) are solid glyphs, not the stroked line
 * icons the rest of the set draws — a stroked outline of a logo reads as
 * "broken", not "themed". `currentColor` keeps them monochrome so they don't
 * fight the resume's own accent color. */
function Icon({ def, className }: { def: IconDef; className?: string }) {
  const shapes = def.shapes.map((shape, i) => <IconShapeElement key={i} shape={shape} />);
  if (def.filled) {
    return (
      <svg viewBox={def.viewBox} fill="currentColor" className={className ?? "h-3.5 w-3.5"} aria-hidden="true">
        {shapes}
      </svg>
    );
  }
  return (
    <svg
      viewBox={def.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={LINE_ICON_STROKE.width}
      strokeLinecap={LINE_ICON_STROKE.linecap}
      strokeLinejoin={LINE_ICON_STROKE.linejoin}
      className={className ?? "h-3.5 w-3.5"}
      aria-hidden="true"
    >
      {shapes}
    </svg>
  );
}

function named(name: IconName) {
  function NamedIcon(props: IconProps) {
    return <Icon def={ICONS[name]} {...props} />;
  }
  return NamedIcon;
}

export const EducationIcon = named("education");
export const ExperienceIcon = named("experience");
export const ProjectIcon = named("project");
export const SkillIcon = named("skill");
export const KeyAchievementIcon = named("keyAchievement");
export const CertificationIcon = named("certification");
export const PatentIcon = named("patent");
export const LanguageIcon = named("language");
export const HobbyIcon = named("hobby");
export const SoftSkillIcon = named("softSkill");
export const AdditionalIcon = named("additional");
export const GlobeIcon = named("globe");
export const GithubIcon = named("github");
export const LinkedInIcon = named("linkedin");
export const MailIcon = named("mail");
export const PhoneIcon = named("phone");
export const PinIcon = named("pin");

export function SectionIcon({ section, className }: { section: SectionKey; className?: string }) {
  const name = SECTION_ICON_NAMES[section];
  if (!name) return null;
  return <Icon def={ICONS[name]} className={className} />;
}

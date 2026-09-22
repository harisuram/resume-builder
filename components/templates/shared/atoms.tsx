import type {
  AdditionalItem,
  BasicInfo,
  Certification,
  Education,
  Experience,
  Language,
  Patent,
  Project,
  ResumeData,
  SectionKey,
} from "@/lib/types";
import { formatDateRange, formatMonth, isCurrentExperience } from "@/lib/date";
import { DEFAULT_DIAL_CODE } from "@/lib/countryCodes";
import { itemBreakKey } from "@/lib/resume";
import { CertificationIcon, GithubIcon, GlobeIcon, LinkedInIcon, MailIcon, PhoneIcon, PinIcon } from "./icons";
import type { TemplateTheme } from "./theme";

/** Section + empty forced set — forced item partitions were removed; kept so
 * call sites that still pass `itemBreaks(...)` compile unchanged. */
export interface ItemBreaks {
  section: SectionKey;
  forced: Set<number>;
}

export function itemBreaks(_data: ResumeData, section: SectionKey): ItemBreaks {
  return { section, forced: new Set() };
}

/** Per-entry DOM hooks for measure / guides (no forced page cuts). */
function itemAttrs(breaks: ItemBreaks, index: number, label: string) {
  return {
    "data-item-key": itemBreakKey(breaks.section, index),
    "data-item-label": label,
  };
}

/** A template opts into a decorative initials circle with theme.showAvatar,
 * but an uploaded photo shows on every template regardless — dropping it
 * would read as the upload having failed. Skipping Photo hides it the same
 * way a skipped section hides its block, without deleting the file. */
export function visiblePhoto(data: ResumeData): string | undefined {
  if (data.sectionStatus.photo === "skipped") return undefined;
  return data.photo;
}

export function hasAvatar(data: ResumeData, theme: TemplateTheme) {
  return Boolean(visiblePhoto(data) || theme.showAvatar);
}

export function Avatar({
  name,
  accent,
  photo,
  size = 64,
}: {
  name: string;
  accent: string;
  photo?: string;
  /** Rendered edge length in px. Inline rather than a Tailwind size class so
   * each layout can scale the slot to the space it actually has. */
  size?: number;
}) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- cropped data URL held in client state, not an optimizable next/image asset
      <img
        src={photo}
        alt=""
        className="max-w-none shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: accent, fontSize: Math.round(size * 0.28) }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/** Prefixes the saved digits with the dial code the user picked (or the
 * default, for phone numbers saved before that field existed). */
function formatPhone(info: BasicInfo): string {
  return `${info.phoneCountryCode || DEFAULT_DIAL_CODE} ${info.phone}`;
}

function contactItems(info: BasicInfo) {
  return [
    info.location && { icon: PinIcon, text: info.location },
    info.email && { icon: MailIcon, text: info.email },
    info.phone && { icon: PhoneIcon, text: formatPhone(info) },
    info.links.linkedin && { icon: LinkedInIcon, text: info.links.linkedin },
    info.links.github && { icon: GithubIcon, text: info.links.github },
    info.links.portfolio && { icon: GlobeIcon, text: info.links.portfolio },
  ].filter(Boolean) as { icon: (p: { className?: string }) => React.ReactElement; text: string }[];
}

export function ContactLine({
  info,
  light = false,
  stacked = false,
}: {
  info: BasicInfo;
  light?: boolean;
  stacked?: boolean;
}) {
  const items = contactItems(info);

  if (items.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-x-3 gap-y-1 text-[12px] ${stacked ? "w-full flex-col items-start" : "items-center"} ${light ? "text-white/85" : "text-[var(--r-ink-soft)]"}`}
    >
      {items.map((item, i) => (
        <span key={i} className={`flex items-start gap-1 ${stacked ? "w-full" : ""}`}>
          <item.icon className="mt-0.5 h-3 w-3 shrink-0 opacity-80" />
          <span className="min-w-0 break-words">{item.text}</span>
        </span>
      ))}
    </div>
  );
}

/** Two-column icon grid used by the labeled (European CV) layout's
 * Personal Information row. */
export function ContactGrid({ info }: { info: BasicInfo }) {
  const items = contactItems(info);
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[12px] text-[var(--r-ink-soft)] sm:grid-cols-2">
      {items.map((item, i) => (
        <span key={i} className="flex min-w-0 items-start gap-1.5">
          <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
          <span className="min-w-0 break-words">{item.text}</span>
        </span>
      ))}
    </div>
  );
}

export function SummaryText({ text }: { text?: string }) {
  if (!text) return null;
  // Fragmentable: print already sets `p { break-inside: auto }`. Keeping
  // break-inside-avoid here made the preview pull the cut to the paragraph
  // top and leave a blank band the PDF never had.
  return (
    <p className="text-[12.5px] leading-relaxed text-[var(--r-ink)]">{text}</p>
  );
}

/** Heading title for the three Experience-shaped sections — kept separate
 * from lib/persona.ts's SECTION_META labels, which are sentence-cased for
 * the builder nav rather than title-cased for a resume heading. */
export function experienceTitle(key: "experience" | "internships" | "partTime"): string {
  switch (key) {
    case "experience":
      return "Experience";
    case "internships":
      return "Internships";
    case "partTime":
      return "Part-Time Work";
  }
}

function densityGap(density: TemplateTheme["density"]) {
  // `space-y-*` (margin), not flex `gap`: flex items don’t fragment cleanly
  // across printed pages, so a tall role was jumping whole to the next sheet
  // and leaving Internships (etc.) stranded below a half-empty page.
  return density === "compact" ? "space-y-2.5" : "space-y-3.5";
}

/** Bullet marks follow the template's heading style so a boxed resume
 * doesn't suddenly look like a disc list. */
export type BulletKind = "chevron" | "square" | "diamond" | "dash" | "arrow";

export function bulletKind(theme: TemplateTheme): BulletKind {
  switch (theme.headingStyle) {
    case "boxed":
      return "square";
    case "tracked":
      return "dash";
    case "rule-partial":
      return "diamond";
    case "rule-full":
      return "arrow";
    case "icon":
    case "plain":
    default:
      return "chevron";
  }
}

function BulletGlyph({ kind }: { kind: BulletKind }) {
  const common = "h-2 w-2";
  switch (kind) {
    case "square":
      return (
        <svg viewBox="0 0 10 10" className={common} aria-hidden="true">
          <rect x="2" y="2" width="6" height="6" rx="0.6" fill="currentColor" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 10 10" className={common} aria-hidden="true">
          <path d="M5 1.2 8.8 5 5 8.8 1.2 5Z" fill="currentColor" />
        </svg>
      );
    case "dash":
      return (
        <svg viewBox="0 0 10 10" className={common} aria-hidden="true">
          <path d="M1.2 5h7.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "arrow":
      return (
        <svg viewBox="0 0 10 10" className={common} aria-hidden="true">
          <path
            d="M1.4 5h6.2M5.2 2.6 8.6 5 5.2 7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 10 10" className={common} aria-hidden="true">
          <path
            d="M3.2 2.2 7.2 5 3.2 7.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function BulletList({
  items,
  theme,
  light = false,
  className,
}: {
  items: string[];
  theme: TemplateTheme;
  light?: boolean;
  className?: string;
}) {
  const cleaned = items.filter(Boolean);
  if (cleaned.length === 0) return null;
  const kind = bulletKind(theme);
  const markColor = light ? "currentColor" : theme.accent;
  return (
    <ul className={`space-y-0.5 text-[12px] leading-snug ${tone(light, "strong")} ${className ?? ""}`}>
      {cleaned.map((item, j) => (
        <li key={j} className="flex gap-1.5" data-bullet-kind={kind}>
          <span className="mt-[0.35em] shrink-0" style={{ color: markColor }} aria-hidden="true">
            <BulletGlyph kind={kind} />
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Text tone for resume body copy. `light` renders on a solid-color sidebar
 * (see theme.sidebarStyle) rather than the resume's own white/paper surface,
 * where the --r-ink-* tokens (tuned for that white surface) read as
 * low-contrast mud instead of legible text. */
function tone(light: boolean, tier: "strong" | "soft" | "faint") {
  if (light) {
    return tier === "strong" ? "text-white" : tier === "soft" ? "text-white/80" : "text-white/60";
  }
  return tier === "strong" ? "text-[var(--r-ink)]" : tier === "soft" ? "text-[var(--r-ink-soft)]" : "text-[var(--r-ink-faint)]";
}

export function EducationList({
  items,
  theme,
  breaks,
  light = false,
}: {
  items: Education[];
  theme: TemplateTheme;
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className={densityGap(theme.density)}>
      {items.map((edu, i) => (
        <div key={i} className="break-inside-avoid" {...itemAttrs(breaks, i, edu.institution)}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className={`text-[13px] font-semibold ${tone(light, "strong")}`}>{edu.institution}</p>
            <p className={`text-[11.5px] ${tone(light, "faint")}`}>{formatDateRange(edu.startDate, edu.endDate)}</p>
          </div>
          <p className={`text-[12px] ${tone(light, "soft")}`}>
            {edu.degree}
            {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
            {edu.gpa ? ` · GPA ${edu.gpa}` : ""}
          </p>
          {edu.coursework && edu.coursework.length > 0 && (
            <p className={`mt-0.5 text-[11.5px] ${tone(light, "faint")}`}>
              <span className={`font-medium ${tone(light, "soft")}`}>Coursework: </span>
              {edu.coursework.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function ExperienceList({
  items,
  theme,
  breaks,
  light = false,
}: {
  items: Experience[];
  theme: TemplateTheme;
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className={densityGap(theme.density)}>
      {items.map((exp, i) => (
        // Fragmentable on purpose: a tall role+bullets card with
        // break-inside-avoid was pushed whole to the next sheet and left a
        // half-empty page. Print already splits `li`/`p`; preview snaps to
        // line boxes instead. Parent is block + space-y (not flex) so the
        // print engine can split mid-card instead of jumping the whole item.
        <div key={i} {...itemAttrs(breaks, i, exp.role)}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className={`text-[13px] font-semibold ${tone(light, "strong")}`}>
              {exp.role} <span className={`font-normal ${tone(light, "soft")}`}>{exp.company ? ` ${exp.company}` : ""}</span>
            </p>
            <p className={`text-[11.5px] ${tone(light, "faint")}`}>
              {formatDateRange(exp.startDate, exp.endDate, isCurrentExperience(exp))}
            </p>
          </div>
          {exp.bullets.length > 0 && <BulletList items={exp.bullets} theme={theme} light={light} className="mt-1" />}
        </div>
      ))}
    </div>
  );
}

export function ProjectList({
  items,
  theme,
  accent,
  breaks,
  light = false,
}: {
  items: Project[];
  theme: TemplateTheme;
  accent: string;
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className={densityGap(theme.density)}>
      {items.map((project, i) => (
        <div key={i} {...itemAttrs(breaks, i, project.name)}>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className={`text-[13px] font-semibold ${tone(light, "strong")}`}>{project.name}</p>
            {project.link && (
              <a
                href={project.link}
                className="text-[11px] underline decoration-dotted underline-offset-2"
                style={{ color: light ? "white" : accent }}
              >
                {project.link.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
          <p className={`text-[12px] leading-snug ${tone(light, "strong")}`}>{project.description}</p>
          {project.technologies && project.technologies.length > 0 && (
            <p className={`mt-0.5 text-[11px] ${tone(light, "faint")}`}>{project.technologies.join(" · ")}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsInline({ items, light = false }: { items: string[]; light?: boolean }) {
  return <p className={`text-[12px] leading-relaxed ${tone(light, "strong")}`}>{items.join("  ·  ")}</p>;
}

export function KeyAchievementsList({
  items,
  theme,
  breaks,
  light = false,
}: {
  items: string[];
  theme: TemplateTheme;
  breaks: ItemBreaks;
  light?: boolean;
}) {
  const cleaned = items.filter(Boolean);
  if (cleaned.length === 0) return null;
  const kind = bulletKind(theme);
  const markColor = light ? "currentColor" : theme.accent;
  return (
    <ul className={`space-y-0.5 text-[12px] leading-snug ${tone(light, "strong")}`}>
      {cleaned.map((item, i) => (
        <li
          key={i}
          className="flex gap-1.5"
          data-bullet-kind={kind}
          {...itemAttrs(breaks, i, item)}
        >
          <span className="mt-[0.35em] shrink-0" style={{ color: markColor }} aria-hidden="true">
            <BulletGlyph kind={kind} />
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillChips({ items, accent }: { items: string[]; accent: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((skill, i) => (
        <span
          key={i}
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: `color-mix(in srgb, ${accent} 14%, white)`, color: accent }}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export function CertificationList({
  items,
  breaks,
  light = false,
}: {
  items: Certification[];
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((cert, i) => (
        <div key={i} className="flex items-start gap-1.5 text-[12px] break-inside-avoid" {...itemAttrs(breaks, i, cert.name)}>
          <CertificationIcon className={`mt-0.5 h-3 w-3 shrink-0 ${tone(light, "faint")}`} />
          <p className={tone(light, "strong")}>
            <span className={`font-semibold ${tone(light, "strong")}`}>{cert.name}</span> — {cert.issuer}
            <span className={tone(light, "faint")}> · {formatMonth(cert.date)}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

export function PatentList({
  items,
  accent,
  breaks,
  light = false,
}: {
  items: Patent[];
  accent: string;
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((patent, i) => (
        <div key={i} className="break-inside-avoid text-[12px]" {...itemAttrs(breaks, i, patent.title)}>
          <p className={`font-semibold ${tone(light, "strong")}`}>{patent.title}</p>
          <p className={tone(light, "soft")}>
            {[patent.number, patent.office, patent.date ? formatMonth(patent.date) : ""]
              .filter(Boolean)
              .join(" · ")}
            {patent.link && (
              <>
                {" · "}
                <a
                  href={patent.link}
                  className="underline decoration-dotted underline-offset-2"
                  style={{ color: light ? "white" : accent }}
                >
                  {patent.link.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

export function LanguageList({
  items,
  breaks,
  light = false,
}: {
  items: Language[];
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((lang, i) => (
        <p
          key={i}
          className={`text-[12px] break-inside-avoid ${tone(light, "strong")}`}
          {...itemAttrs(breaks, i, lang.name)}
        >
          <span className="font-semibold">{lang.name}</span>
          <span className={tone(light, "faint")}> — {lang.level}</span>
        </p>
      ))}
    </div>
  );
}

export function AdditionalList({
  items,
  theme,
  breaks,
  light = false,
}: {
  items: AdditionalItem[];
  theme: TemplateTheme;
  breaks: ItemBreaks;
  light?: boolean;
}) {
  return (
    <div className={densityGap(theme.density)}>
      {items.map((item, i) => (
        <div key={i} className="break-inside-avoid" {...itemAttrs(breaks, i, item.title)}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className={`text-[13px] font-semibold ${tone(light, "strong")}`}>
              {item.title}
              {item.subtitle ? <span className={`font-normal ${tone(light, "soft")}`}> · {item.subtitle}</span> : null}
            </p>
            {item.date && <p className={`text-[11.5px] ${tone(light, "faint")}`}>{item.date}</p>}
          </div>
          {item.bullets.length > 0 && <BulletList items={item.bullets} theme={theme} light={light} className="mt-1" />}
        </div>
      ))}
    </div>
  );
}

export function ChipOrInline({
  items,
  accent,
  compact,
  light = false,
}: {
  items: string[];
  accent: string;
  compact: boolean;
  light?: boolean;
}) {
  if (light || compact) return <SkillsInline items={items} light={light} />;
  return <SkillChips items={items} accent={accent} />;
}

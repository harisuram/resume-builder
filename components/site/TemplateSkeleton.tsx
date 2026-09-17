import { resumeSectionTitle, SUMMARY_COPY } from "@/lib/persona";
import { PAGE_HEIGHT_PX } from "@/lib/page";
import { NARROW_SECTION_KEYS } from "@/lib/resume";
import type { SectionKey } from "@/lib/types";
import { SectionHeading } from "@/components/templates/shared/SectionHeading";
import { tint, type TemplateTheme } from "@/components/templates/shared/theme";

/** Representative sections for a gallery preview — enough to show heading
 * style and column split without dumping every optional block. */
const GALLERY_SECTIONS: SectionKey[] = ["summary", "experience", "projects", "education", "skills"];

function partitionSections(sections: SectionKey[]): { rail: SectionKey[]; main: SectionKey[] } {
  return {
    rail: sections.filter((key) => key !== "summary" && NARROW_SECTION_KEYS.has(key)),
    main: sections.filter((key) => key === "summary" || !NARROW_SECTION_KEYS.has(key)),
  };
}

function Bone({ className, light = false }: { className: string; light?: boolean }) {
  return (
    <div
      className={`skeleton-bone rounded-full ${className}`}
      data-skeleton-light={light || undefined}
      aria-hidden="true"
    />
  );
}

function AvatarSlot({ accent, size, light = false }: { accent: string; size: number; light?: boolean }) {
  return (
    <div
      className="skeleton-bone shrink-0 rounded-full"
      data-skeleton-light={light || undefined}
      style={{
        width: size,
        height: size,
        background: light ? "rgba(255,255,255,0.22)" : tint(accent, 18),
        boxShadow: light ? "inset 0 0 0 2px rgba(255,255,255,0.35)" : undefined,
      }}
      aria-hidden="true"
    />
  );
}

function ContactBones({ light = false, stacked = false }: { light?: boolean; stacked?: boolean }) {
  const bones = stacked ? (
    <>
      <Bone className="h-2 w-28" light={light} />
      <Bone className="h-2 w-24" light={light} />
      <Bone className="h-2 w-20" light={light} />
    </>
  ) : (
    <>
      <Bone className="h-2 w-24" light={light} />
      <Bone className="h-2 w-20" light={light} />
      <Bone className="h-2 w-16" light={light} />
    </>
  );
  return <div className={stacked ? "flex flex-col gap-1.5" : "flex flex-wrap gap-2"}>{bones}</div>;
}

function NarrativeBones({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Bone className="h-2.5 w-[42%]" light={light} />
        <Bone className="h-2 w-14" light={light} />
      </div>
      <Bone className="h-2 w-full" light={light} />
      {!compact && <Bone className="h-2 w-[88%]" light={light} />}
    </div>
  );
}

function EducationBones({ light = false }: { light?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Bone className="h-2.5 w-4/5" light={light} />
      <Bone className="h-2 w-3/5" light={light} />
    </div>
  );
}

function SkillBones({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Bone className="h-5 w-14 rounded-md" light={light} />
      <Bone className="h-5 w-20 rounded-md" light={light} />
      <Bone className="h-5 w-12 rounded-md" light={light} />
      {!compact && <Bone className="h-5 w-16 rounded-md" light={light} />}
    </div>
  );
}

function SectionBody({
  section,
  light = false,
  compact = false,
}: {
  section: SectionKey;
  light?: boolean;
  compact?: boolean;
}) {
  if (section === "summary") {
    return (
      <div className="space-y-1.5">
        <Bone className="h-2 w-full" light={light} />
        <Bone className="h-2 w-[94%]" light={light} />
        {!compact && <Bone className="h-2 w-3/4" light={light} />}
      </div>
    );
  }
  if (section === "skills" || section === "hobbies" || section === "softSkills") {
    return <SkillBones light={light} compact={compact} />;
  }
  if (section === "education" || section === "certifications" || section === "languages") {
    return <EducationBones light={light} />;
  }
  return (
    <div className="space-y-3">
      <NarrativeBones light={light} compact={compact} />
      {!compact && <NarrativeBones light={light} />}
    </div>
  );
}

function PreviewSection({
  theme,
  section,
  light = false,
  compact = false,
  animate = false,
  index = 0,
  additionalTitle,
}: {
  theme: TemplateTheme;
  section: SectionKey;
  light?: boolean;
  compact?: boolean;
  animate?: boolean;
  index?: number;
  additionalTitle?: string;
}) {
  const title =
    section === "summary"
      ? SUMMARY_COPY.label
      : section === "additional" && additionalTitle?.trim()
        ? additionalTitle.trim()
        : resumeSectionTitle(section);
  return (
    <section
      data-preview-section={section}
      className={animate ? "skeleton-section" : undefined}
      style={animate ? { animationDelay: `${Math.min(index, 14) * 45}ms` } : undefined}
    >
      <SectionHeading theme={theme} section={section} title={title} light={light} />
      <SectionBody section={section} light={light} compact={compact} />
    </section>
  );
}

function NameBone({
  theme,
  light = false,
  sizeClass,
}: {
  theme: TemplateTheme;
  light?: boolean;
  sizeClass: string;
}) {
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  return (
    <div className={`${fontClass} ${sizeClass}`}>
      <Bone className="h-5 w-44 max-w-full" light={light} />
    </div>
  );
}

interface SkeletonBodyProps {
  theme: TemplateTheme;
  sections: SectionKey[];
  rail: SectionKey[];
  main: SectionKey[];
  compact: boolean;
  animate: boolean;
  fullPage: boolean;
  showAvatar: boolean;
  additionalTitle?: string;
}

function SingleColumnSkeleton({
  theme,
  sections,
  compact,
  animate,
  fullPage,
  showAvatar,
  additionalTitle,
}: SkeletonBodyProps) {
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const gap = compact ? "gap-3.5" : theme.density === "compact" ? "gap-4" : "gap-5";
  return (
    <div className={`resume-surface min-h-full ${fontClass}`} style={fullPage ? { minHeight: PAGE_HEIGHT_PX } : undefined}>
      <div
        className={`flex items-center gap-6 ${theme.darkHeader ? "resume-dark-header px-8 py-7" : "px-8 pt-8"}`}
        style={theme.darkHeader ? { background: theme.accent } : undefined}
      >
        <div className="min-w-0 flex-1 space-y-2.5">
          <NameBone theme={theme} light={theme.darkHeader} sizeClass="text-[26px]" />
          <ContactBones light={theme.darkHeader} />
        </div>
        {showAvatar && <AvatarSlot accent={theme.darkHeader ? "#ffffff" : theme.accent} size={84} light={theme.darkHeader} />}
      </div>
      <div className={`flex flex-col px-8 pb-8 ${theme.darkHeader ? "pt-6" : "pt-5"} ${gap}`}>
        {sections.map((key, index) => (
          <PreviewSection
            key={key}
            theme={theme}
            section={key}
            compact={compact}
            animate={animate}
            index={index}
            additionalTitle={additionalTitle}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton({
  theme,
  rail,
  main,
  compact,
  animate,
  fullPage,
  showAvatar,
  additionalTitle,
}: SkeletonBodyProps) {
  const solid = theme.sidebarStyle === "solid";
  const right = theme.sidebarSide === "right";
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const railBg = solid ? theme.accent : tint(theme.accent, 8);
  const gap = compact ? "gap-4" : "gap-5";
  const railCol = (
    <div
      data-resume-column="rail"
      className={`flex w-[34%] shrink-0 flex-col ${gap} self-stretch p-6 ${solid ? "text-white" : ""}`}
      style={{ background: railBg }}
    >
      {!theme.darkHeader && (
        <div className="flex flex-col items-start gap-3">
          {showAvatar && <AvatarSlot accent={theme.accent} size={72} light={solid} />}
          <NameBone theme={theme} light={solid} sizeClass="text-[19px]" />
          <ContactBones light={solid} stacked />
        </div>
      )}
      {rail.map((key, index) => (
        <PreviewSection
          key={key}
          theme={theme}
          section={key}
          light={solid}
          compact={compact}
          animate={animate}
          index={index}
          additionalTitle={additionalTitle}
        />
      ))}
    </div>
  );
  const mainCol = (
    <div data-resume-column="main" className={`flex flex-1 flex-col ${gap} p-8`}>
      {main.map((key, index) => (
        <PreviewSection
          key={key}
          theme={theme}
          section={key}
          compact={compact}
          animate={animate}
          index={rail.length + index}
          additionalTitle={additionalTitle}
        />
      ))}
    </div>
  );
  const columns = (
    <div className={`flex min-h-0 w-full flex-1 items-stretch ${right ? "flex-row-reverse" : ""}`}>
      {railCol}
      {mainCol}
    </div>
  );
  const pageStyle = fullPage
    ? { minHeight: PAGE_HEIGHT_PX, ["--resume-rail-bg" as string]: railBg }
    : undefined;

  if (theme.darkHeader) {
    return (
      <div
        className={`resume-surface flex flex-col ${fontClass} ${fullPage ? "resume-sidebar-page min-h-full" : "min-h-full"}`}
        style={pageStyle}
      >
        <div className="resume-dark-header flex items-center gap-6 px-8 py-6" style={{ background: theme.accent }}>
          <div className="min-w-0 flex-1 space-y-2">
            <NameBone theme={theme} light sizeClass="text-[24px]" />
            <ContactBones light />
          </div>
          {showAvatar && <AvatarSlot accent="#ffffff" size={76} light />}
        </div>
        {columns}
      </div>
    );
  }

  return (
    <div
      className={`resume-surface flex ${fontClass} ${fullPage ? "resume-sidebar-page min-h-full" : "min-h-full"}`}
      style={pageStyle}
    >
      {columns}
    </div>
  );
}

function AsymmetricSkeleton({
  theme,
  rail,
  main,
  compact,
  animate,
  fullPage,
  showAvatar,
  additionalTitle,
}: SkeletonBodyProps) {
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const gap = compact ? "gap-3.5" : "gap-4";
  return (
    <div
      className={`resume-surface px-8 py-7 ${fontClass} ${fullPage ? "resume-split-page min-h-full" : "min-h-full"}`}
      style={fullPage ? { minHeight: PAGE_HEIGHT_PX } : undefined}
    >
      <div className="flex items-center gap-5 border-b-2 pb-3" style={{ borderColor: theme.accent }}>
        <div className="min-w-0 flex-1 space-y-2">
          <NameBone theme={theme} sizeClass="text-[25px]" />
          <ContactBones />
        </div>
        {showAvatar && <AvatarSlot accent={theme.accent} size={76} />}
      </div>
      <div className="mt-5 flex w-full items-stretch">
        <div data-resume-column="rail" className="w-[32%] border-r border-[var(--r-border)] pr-5">
          <div className={`flex flex-col ${gap}`}>
            {rail.map((key, index) => (
              <PreviewSection
                key={key}
                theme={theme}
                section={key}
                compact={compact}
                animate={animate}
                index={index}
                additionalTitle={additionalTitle}
              />
            ))}
          </div>
        </div>
        <div data-resume-column="main" className="flex-1 pl-5">
          <div className={`flex flex-col ${gap}`}>
            {main.map((key, index) => (
              <PreviewSection
                key={key}
                theme={theme}
                section={key}
                compact={compact}
                animate={animate}
                index={rail.length + index}
                additionalTitle={additionalTitle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateSkeleton({
  theme,
  sections,
  additionalTitle,
  showAvatar,
  framed = true,
  animate = false,
  compact = false,
  fullPage = false,
}: {
  theme: TemplateTheme;
  /** When omitted, the gallery uses a short representative set. */
  sections?: SectionKey[];
  additionalTitle?: string;
  /** Defaults to the theme's avatar slot. */
  showAvatar?: boolean;
  framed?: boolean;
  animate?: boolean;
  compact?: boolean;
  /** Stretch to one A4 page so a sidebar rail fills the sheet. */
  fullPage?: boolean;
}) {
  const keys = sections ?? GALLERY_SECTIONS;
  const { rail, main } = partitionSections(keys);
  const avatar = showAvatar ?? Boolean(theme.showAvatar);
  const bodyProps: SkeletonBodyProps = {
    theme,
    sections: keys,
    rail,
    main,
    compact,
    animate,
    fullPage,
    showAvatar: avatar,
    additionalTitle,
  };
  const body =
    theme.layout === "sidebar" ? (
      <SidebarSkeleton {...bodyProps} />
    ) : theme.layout === "asymmetric" ? (
      <AsymmetricSkeleton {...bodyProps} />
    ) : (
      <SingleColumnSkeleton {...bodyProps} />
    );

  return (
    <div
      data-template-skeleton={theme.id}
      data-layout={theme.layout}
      className={`resume-surface overflow-hidden ${animate ? "skeleton-animate" : ""} ${
        framed ? "rounded-lg border border-[var(--r-border)] shadow-card" : ""
      }`}
    >
      {body}
    </div>
  );
}

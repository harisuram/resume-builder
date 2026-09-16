import { resumeSectionTitle, SUMMARY_COPY } from "@/lib/persona";
import type { SectionKey } from "@/lib/types";
import { SectionHeading } from "@/components/templates/shared/SectionHeading";
import { tint, type TemplateTheme } from "@/components/templates/shared/theme";

/** Representative sections for a gallery preview — enough to show heading
 * style and column split without dumping every optional block. */
const MAIN_SECTIONS: SectionKey[] = ["experience", "projects"];
const RAIL_SECTIONS: SectionKey[] = ["education", "skills"];
const SINGLE_SECTIONS: SectionKey[] = ["summary", ...MAIN_SECTIONS, ...RAIL_SECTIONS];

function Bone({ className, light = false }: { className: string; light?: boolean }) {
  return (
    <div
      className={`rounded-full ${className}`}
      style={{ background: light ? "rgba(255,255,255,0.32)" : "color-mix(in srgb, var(--r-ink) 13%, transparent)" }}
      aria-hidden="true"
    />
  );
}

function AvatarSlot({ accent, size, light = false }: { accent: string; size: number; light?: boolean }) {
  return (
    <div
      className="shrink-0 rounded-full"
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

function NarrativeBones({ light = false }: { light?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Bone className="h-2.5 w-[42%]" light={light} />
        <Bone className="h-2 w-14" light={light} />
      </div>
      <Bone className="h-2 w-full" light={light} />
      <Bone className="h-2 w-[88%]" light={light} />
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

function SkillBones({ light = false }: { light?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Bone className="h-5 w-14 rounded-md" light={light} />
      <Bone className="h-5 w-20 rounded-md" light={light} />
      <Bone className="h-5 w-12 rounded-md" light={light} />
      <Bone className="h-5 w-16 rounded-md" light={light} />
    </div>
  );
}

function SectionBody({ section, light = false }: { section: SectionKey; light?: boolean }) {
  if (section === "summary") {
    return (
      <div className="space-y-1.5">
        <Bone className="h-2 w-full" light={light} />
        <Bone className="h-2 w-[94%]" light={light} />
        <Bone className="h-2 w-3/4" light={light} />
      </div>
    );
  }
  if (section === "skills") return <SkillBones light={light} />;
  if (section === "education") return <EducationBones light={light} />;
  return (
    <div className="space-y-3">
      <NarrativeBones light={light} />
      <NarrativeBones light={light} />
    </div>
  );
}

function PreviewSection({
  theme,
  section,
  light = false,
}: {
  theme: TemplateTheme;
  section: SectionKey;
  light?: boolean;
}) {
  const title = section === "summary" ? SUMMARY_COPY.label : resumeSectionTitle(section);
  return (
    <section data-preview-section={section}>
      <SectionHeading theme={theme} section={section} title={title} light={light} />
      <SectionBody section={section} light={light} />
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

function SingleColumnSkeleton({ theme }: { theme: TemplateTheme }) {
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const gap = theme.density === "compact" ? "gap-4" : "gap-5";
  return (
    <div className={`resume-surface min-h-full ${fontClass}`}>
      <div
        className={`flex items-center gap-6 ${theme.darkHeader ? "resume-dark-header px-8 py-7" : "px-8 pt-8"}`}
        style={theme.darkHeader ? { background: theme.accent } : undefined}
      >
        <div className="min-w-0 flex-1 space-y-2.5">
          <NameBone theme={theme} light={theme.darkHeader} sizeClass="text-[26px]" />
          <ContactBones light={theme.darkHeader} />
        </div>
        {theme.showAvatar && <AvatarSlot accent={theme.darkHeader ? "#ffffff" : theme.accent} size={84} light={theme.darkHeader} />}
      </div>
      <div className={`flex flex-col px-8 pb-8 ${theme.darkHeader ? "pt-6" : "pt-5"} ${gap}`}>
        {SINGLE_SECTIONS.map((key) => (
          <PreviewSection key={key} theme={theme} section={key} />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton({ theme }: { theme: TemplateTheme }) {
  const solid = theme.sidebarStyle === "solid";
  const right = theme.sidebarSide === "right";
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const railBg = solid ? theme.accent : tint(theme.accent, 8);
  const rail = (
    <div
      data-resume-column="rail"
      className={`flex w-[34%] shrink-0 flex-col gap-5 self-stretch p-6 ${solid ? "text-white" : ""}`}
      style={{ background: railBg }}
    >
      {!theme.darkHeader && (
        <div className="flex flex-col items-start gap-3">
          {theme.showAvatar && <AvatarSlot accent={theme.accent} size={72} light={solid} />}
          <NameBone theme={theme} light={solid} sizeClass="text-[19px]" />
          <ContactBones light={solid} stacked />
        </div>
      )}
      {RAIL_SECTIONS.map((key) => (
        <PreviewSection key={key} theme={theme} section={key} light={solid} />
      ))}
    </div>
  );
  const main = (
    <div data-resume-column="main" className="flex flex-1 flex-col gap-5 p-8">
      <PreviewSection theme={theme} section="summary" />
      {MAIN_SECTIONS.map((key) => (
        <PreviewSection key={key} theme={theme} section={key} />
      ))}
    </div>
  );
  const columns = (
    <div className={`flex min-h-0 w-full flex-1 items-stretch ${right ? "flex-row-reverse" : ""}`}>
      {rail}
      {main}
    </div>
  );

  if (theme.darkHeader) {
    return (
      <div className={`resume-surface flex min-h-full flex-col ${fontClass}`}>
        <div className="resume-dark-header flex items-center gap-6 px-8 py-6" style={{ background: theme.accent }}>
          <div className="min-w-0 flex-1 space-y-2">
            <NameBone theme={theme} light sizeClass="text-[24px]" />
            <ContactBones light />
          </div>
          {theme.showAvatar && <AvatarSlot accent="#ffffff" size={76} light />}
        </div>
        {columns}
      </div>
    );
  }

  return (
    <div className={`resume-surface flex min-h-full ${fontClass}`}>{columns}</div>
  );
}

function AsymmetricSkeleton({ theme }: { theme: TemplateTheme }) {
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  return (
    <div className={`resume-surface min-h-full px-8 py-7 ${fontClass}`}>
      <div className="flex items-center gap-5 border-b-2 pb-3" style={{ borderColor: theme.accent }}>
        <div className="min-w-0 flex-1 space-y-2">
          <NameBone theme={theme} sizeClass="text-[25px]" />
          <ContactBones />
        </div>
        {theme.showAvatar && <AvatarSlot accent={theme.accent} size={76} />}
      </div>
      <div className="mt-5 flex w-full items-stretch">
        <div data-resume-column="rail" className="w-[32%] border-r border-[var(--r-border)] pr-5">
          <div className="flex flex-col gap-4">
            {RAIL_SECTIONS.map((key) => (
              <PreviewSection key={key} theme={theme} section={key} />
            ))}
          </div>
        </div>
        <div data-resume-column="main" className="flex-1 pl-5">
          <div className="flex flex-col gap-4">
            <PreviewSection theme={theme} section="summary" />
            {MAIN_SECTIONS.map((key) => (
              <PreviewSection key={key} theme={theme} section={key} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateSkeleton({ theme }: { theme: TemplateTheme }) {
  const body =
    theme.layout === "sidebar" ? (
      <SidebarSkeleton theme={theme} />
    ) : theme.layout === "asymmetric" ? (
      <AsymmetricSkeleton theme={theme} />
    ) : (
      <SingleColumnSkeleton theme={theme} />
    );

  return (
    <div
      data-template-skeleton={theme.id}
      data-layout={theme.layout}
      className="resume-surface overflow-hidden rounded-lg border border-[var(--r-border)] shadow-card"
    >
      {body}
    </div>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { SUMMARY_COPY } from "@/lib/persona";
import { getRenderableSections, hasSummary, sectionBreakProps } from "@/lib/resume";
import type { ResumeData } from "@/lib/types";
import type { NameHeadingLevel } from "../registry";
import { Avatar, ContactLine, hasAvatar, SummaryText, visiblePhoto } from "../shared/atoms";
import { ResumeSection } from "../shared/ResumeSection";
import { SectionHeading } from "../shared/SectionHeading";
import {
  CIVIC_BLUE,
  DISPLAY_FONT_CSS,
  KERNEL_PROMPT,
  TESSERA_GROUND,
  headerColor,
  monogramInitials,
  splitLastWord,
  tint,
  type TemplateTheme,
  type TemplateVariant,
} from "../shared/theme";

/** The eight bespoke single-column templates. Sections are the standard
 * ones (ResumeSection) — each variant changes only the header, the heading
 * style (from the theme) and a few section treatments in globals.css keyed
 * on `data-variant`. The PDF engine mirrors this in components/pdf/variantPages.tsx. */
export function VariantLayout({
  data,
  theme,
  headingLevel = "h1",
}: {
  data: ResumeData;
  theme: TemplateTheme & { variant: TemplateVariant };
  headingLevel?: NameHeadingLevel;
}) {
  const sections = getRenderableSections(data);
  const second = headerColor(theme);
  const surfaceStyle = {
    "--variant-accent": theme.accent,
    "--variant-second": second,
    "--variant-rule": tint(theme.accent, 22),
    ...(theme.variant === "tessera" ? { background: TESSERA_GROUND } : {}),
  } as CSSProperties;

  return (
    <div
      className={`resume-surface min-h-full ${theme.fontDisplay === "serif" ? "font-serif" : ""}`}
      data-layout={theme.layout}
      data-variant={theme.variant}
      style={surfaceStyle}
    >
      <VariantHeader data={data} theme={theme} headingLevel={headingLevel} />
      <div
        className={`resume-page-body relative flex flex-col ${
          theme.variant === "tessera" ? "gap-3.5 px-6 pb-6 pt-3.5" : "gap-5 px-8 pb-8 pt-6"
        }`}
      >
        {hasSummary(data) && (
          <section {...sectionBreakProps(data, "summary")}>
            <SectionHeading theme={theme} section="summary" title={SUMMARY_COPY.label} />
            <VariantSummary text={data.sections.summary} theme={theme} />
          </section>
        )}
        {sections.map((key) => (
          <section key={key} {...sectionBreakProps(data, key)}>
            <ResumeSection section={key} data={data} theme={theme} />
          </section>
        ))}
      </div>
    </div>
  );
}

function VariantSummary({ text, theme }: { text?: string; theme: TemplateTheme }) {
  // The display serifs read as a lead paragraph; the rest keep body text.
  if (theme.variant === "sterling" || theme.variant === "cameo" || theme.variant === "horizon") {
    return (
      <p
        className={`text-[16px] leading-relaxed text-[var(--r-ink)] ${theme.variant === "horizon" ? "" : "italic"} ${
          theme.variant === "cameo" ? "text-center" : ""
        }`}
        style={{ fontFamily: theme.displayFont ? DISPLAY_FONT_CSS[theme.displayFont] : undefined }}
      >
        {text}
      </p>
    );
  }
  return <SummaryText text={text} />;
}

function VariantHeader({
  data,
  theme,
  headingLevel,
}: {
  data: ResumeData;
  theme: TemplateTheme & { variant: TemplateVariant };
  headingLevel: NameHeadingLevel;
}) {
  const Name = headingLevel;
  const name = data.basicInfo.name || "Your Name";
  const second = headerColor(theme);
  const display = theme.displayFont ? DISPLAY_FONT_CSS[theme.displayFont] : undefined;
  const photo = visiblePhoto(data);
  const avatar = (size: number, fill: string): ReactNode =>
    hasAvatar(data, theme) ? <Avatar name={name} accent={fill} photo={photo} size={size} /> : null;

  switch (theme.variant) {
    case "horizon": {
      const [lead, last] = splitLastWord(name);
      return (
        // Contact sits under the name, never beside it: a long hyphenated
        // surname at display size would otherwise run into the column.
        <div className="border-b px-8 pb-6 pt-10" style={{ borderColor: tint(theme.accent, 15) }}>
          <div className="flex items-center gap-6">
            {avatar(76, theme.accent)}
            <Name
              className="min-w-0 flex-1 text-[40px] leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: display, fontWeight: 300, color: theme.accent }}
            >
              {lead ? <>{lead} </> : null}
              <em style={{ color: second }}>{last}</em>
            </Name>
          </div>
          <div className="mt-3">
            <ContactLine info={data.basicInfo} />
          </div>
        </div>
      );
    }
    case "pivot":
      return (
        <div className="relative flex items-center gap-6 px-8 pb-7 pt-10 text-white" style={{ background: second }}>
          <div className="min-w-0 flex-1">
            <Name className="text-[34px] font-semibold leading-tight" style={{ fontFamily: display }}>
              {name}
            </Name>
            <div className="mt-3">
              <ContactLine info={data.basicInfo} light />
            </div>
          </div>
          {avatar(80, "#ffffff33")}
          <span className="absolute bottom-0 left-8 h-[3px] w-16" style={{ background: theme.accent }} />
        </div>
      );
    case "laureate":
      return (
        <div className="flex flex-col items-center gap-3 px-8 pt-10 text-center">
          {avatar(72, theme.accent)}
          <Name className="text-[30px] font-semibold uppercase tracking-[0.14em]" style={{ color: second }}>
            {name}
          </Name>
          <div className="flex justify-center [&>div]:justify-center">
            <ContactLine info={data.basicInfo} />
          </div>
          <div
            className="mt-2 h-[4px] w-full border-y"
            style={{ borderColor: theme.accent }}
            aria-hidden="true"
          />
        </div>
      );
    case "sterling":
      return (
        <div className="px-8 pt-10">
          <div className="flex items-center gap-6">
            {avatar(76, theme.accent)}
            <Name
              className="min-w-0 flex-1 text-[46px] leading-[1.05]"
              style={{ fontFamily: display, fontWeight: 500, color: second }}
            >
              {name}
            </Name>
          </div>
          <div className="mb-5 mt-3">
            <ContactLine info={data.basicInfo} />
          </div>
          <div className="border-t-2" style={{ borderColor: second }} aria-hidden="true" />
          <div className="mt-[3px] border-t" style={{ borderColor: theme.accent }} aria-hidden="true" />
        </div>
      );
    case "cameo":
      return (
        <div className="flex flex-col items-center px-8 pt-10 text-center">
          <div
            className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border"
            style={{ borderColor: theme.accent, boxShadow: `inset 0 0 0 4px #fff, inset 0 0 0 5px ${tint(theme.accent, 40)}` }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- cropped data URL held in client state
              <img src={photo} alt="" className="h-[70px] w-[70px] max-w-none rounded-full object-cover" />
            ) : (
              <span className="text-[28px] italic" style={{ fontFamily: display, color: second }}>
                {monogramInitials(name)}
              </span>
            )}
          </div>
          <Name
            className="mt-4 text-[30px] uppercase tracking-[0.28em]"
            style={{ fontFamily: display, fontWeight: 500, color: second }}
          >
            {name}
          </Name>
          <div className="mt-2 flex justify-center [&>div]:justify-center">
            <ContactLine info={data.basicInfo} />
          </div>
        </div>
      );
    case "civic":
      return (
        <div>
          <div className="flex items-end gap-6 px-8 pb-6 pt-9 text-white" style={{ background: second }}>
            {avatar(72, "#ffffff33")}
            <Name className="min-w-0 flex-1 text-[28px] font-bold leading-tight">{name}</Name>
            <div className="max-w-[45%] shrink-0">
              <ContactLine info={data.basicInfo} light stacked />
            </div>
          </div>
          <div
            className="h-[5px]"
            style={{ background: `linear-gradient(90deg, ${theme.accent} 0 33.3%, #ffffff 33.3% 66.6%, ${CIVIC_BLUE} 66.6%)` }}
            aria-hidden="true"
          />
        </div>
      );
    case "kernel":
      return (
        <div className="px-8 pt-8">
          <div className="flex items-center gap-5 rounded-[10px] px-6 py-5 text-white" style={{ background: second }}>
            <div className="min-w-0 flex-1" style={{ fontFamily: DISPLAY_FONT_CSS.mono }}>
              <div className="mb-3 flex gap-1.5" aria-hidden="true">
                <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
                <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
                <span className="h-[9px] w-[9px] rounded-full bg-[#28c840]" />
              </div>
              <p className="text-[11.5px]" style={{ color: KERNEL_PROMPT }} aria-hidden="true">
                $ whoami
              </p>
              <Name className="mt-1 text-[28px] font-semibold leading-tight">
                {name}
                <span style={{ color: KERNEL_PROMPT }} aria-hidden="true">
                  _
                </span>
              </Name>
              <div className="mt-2">
                <ContactLine info={data.basicInfo} light />
              </div>
            </div>
            {avatar(72, "#ffffff22")}
          </div>
        </div>
      );
    case "tessera":
      return (
        <div className="px-6 pt-6">
          <div
            className="relative flex items-center gap-5 overflow-hidden rounded-[14px] px-7 py-6 text-white"
            style={{ background: second }}
          >
            <span
              className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full"
              style={{ background: `radial-gradient(circle, ${theme.accent}99, ${theme.accent}00 70%)` }}
              aria-hidden="true"
            />
            <div className="relative min-w-0 flex-1">
              <Name className="text-[30px] font-bold leading-tight tracking-[-0.01em]" style={{ fontFamily: display }}>
                {name}
              </Name>
              <div className="mt-2">
                <ContactLine info={data.basicInfo} light />
              </div>
            </div>
            <div className="relative">{avatar(76, "#ffffff22")}</div>
          </div>
        </div>
      );
  }
}

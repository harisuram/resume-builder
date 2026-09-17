import { SUMMARY_COPY } from "@/lib/persona";
import { getRenderableSections, hasSummary, sectionBreakProps } from "@/lib/resume";
import type { ResumeData } from "@/lib/types";
import { Avatar, ContactLine, hasAvatar, SummaryText, visiblePhoto } from "../shared/atoms";
import { ResumeSection } from "../shared/ResumeSection";
import { SectionHeading } from "../shared/SectionHeading";
import type { TemplateTheme } from "../shared/theme";

export function SingleColumnLayout({
  data,
  theme,
  resumeTheme,
}: {
  data: ResumeData;
  theme: TemplateTheme;
  /** Overrides the resume's own light/dark surface — used only by templates
   * that expose a dark-mode toggle (e.g. JSON Resume Vitae). */
  resumeTheme?: "light" | "dark";
}) {
  const sections = getRenderableSections(data);
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const nameSizeClass = theme.headingStyle === "tracked" ? "tracking-wide" : "";

  // With a photo the header becomes a two-column row — name and contact keep
  // the left, the photo sits opposite them. Without one it collapses back to
  // the plain stacked header (a lone flex child spans the same width).
  const header = (
    <div
      className={`flex items-center gap-6 ${
        theme.darkHeader ? "resume-dark-header px-8 py-7 text-white" : "px-8 pt-8"
      }`}
      style={theme.darkHeader ? { background: theme.accent } : undefined}
    >
      <div className="min-w-0 flex-1">
        <h1
          className={`${fontClass} ${nameSizeClass} text-[26px] font-semibold ${
            resumeTheme === "dark" && !theme.darkHeader ? "text-[var(--r-ink)]" : ""
          }`}
          style={!theme.darkHeader && resumeTheme !== "dark" ? { color: theme.accent } : undefined}
        >
          {data.basicInfo.name || "Your Name"}
        </h1>
        <div className="mt-2">
          <ContactLine info={data.basicInfo} light={theme.darkHeader} />
        </div>
      </div>
      {hasAvatar(data, theme) && (
        <Avatar
          name={data.basicInfo.name || "?"}
          accent={theme.darkHeader ? "#ffffff33" : theme.accent}
          photo={visiblePhoto(data)}
          size={84}
        />
      )}
    </div>
  );

  return (
    <div className="resume-surface min-h-full" data-resume-theme={resumeTheme}>
      {header}
      <div className={`resume-page-body flex flex-col px-8 ${theme.darkHeader ? "pt-6" : "pt-5"} pb-8 ${theme.density === "compact" ? "gap-4" : "gap-5"}`}>
        {hasSummary(data) && (
          <section {...sectionBreakProps(data, "summary")}>
            <SectionHeading theme={theme} section="summary" title={SUMMARY_COPY.label} />
            <SummaryText text={data.sections.summary} />
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

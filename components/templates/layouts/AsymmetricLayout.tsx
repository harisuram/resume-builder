import { SUMMARY_COPY } from "@/lib/persona";
import { getRenderableSections, hasSummary, sectionBreakProps } from "@/lib/resume";
import type { ResumeData } from "@/lib/types";
import { Avatar, ContactLine, hasAvatar, SummaryText, visiblePhoto } from "../shared/atoms";
import { NARROW_SECTION_KEYS, ResumeSection } from "../shared/ResumeSection";
import { SectionHeading } from "../shared/SectionHeading";
import type { TemplateTheme } from "../shared/theme";

/** Deedy-style dense two-column CV: a brief narrow column (education, skills,
 * languages, and other compact lists) beside a dominant wide column carrying
 * the career narrative (summary, experience, projects, patents). */
export function AsymmetricLayout({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  const sections = getRenderableSections(data);
  const narrow = sections.filter((k) => NARROW_SECTION_KEYS.has(k));
  const wide = sections.filter((k) => !NARROW_SECTION_KEYS.has(k));

  return (
    <div className="resume-surface resume-split-page min-h-full px-8 py-7" data-layout={theme.layout}>
      <div className="flex items-center gap-5 border-b-2 pb-3" style={{ borderColor: theme.accent }}>
        <div className="min-w-0 flex-1">
          <h1 className="text-[25px] font-semibold tracking-tight" style={{ color: theme.accent }}>
            {data.basicInfo.name || "Your Name"}
          </h1>
          <div className="mt-1.5">
            <ContactLine info={data.basicInfo} />
          </div>
        </div>
        {hasAvatar(data, theme) && (
          <Avatar name={data.basicInfo.name || "?"} accent={theme.accent} photo={visiblePhoto(data)} size={76} />
        )}
      </div>

      <table className="resume-split-columns mt-5 w-full" role="presentation">
        <thead className="resume-split-page-pad">
          <tr>
            <th className="resume-split-pad-narrow" aria-hidden="true">
              {"\u00a0"}
            </th>
            <th className="resume-split-pad-wide" aria-hidden="true">
              {"\u00a0"}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-resume-column="rail" className="resume-split-narrow relative w-[32%] align-top">
              <div className="flex flex-col gap-4 border-r border-[var(--r-border)] pr-5">
                {narrow.map((key) => (
                  <section key={key} {...sectionBreakProps(data, key)}>
                    <ResumeSection section={key} data={data} theme={theme} preferInline />
                  </section>
                ))}
              </div>
            </td>
            <td data-resume-column="main" className="resume-split-wide relative align-top">
              <div className="flex flex-col gap-4 pl-1">
                {hasSummary(data) && (
                  <section {...sectionBreakProps(data, "summary")}>
                    <SectionHeading theme={theme} section="summary" title={SUMMARY_COPY.label} />
                    <SummaryText text={data.sections.summary} />
                  </section>
                )}
                {wide.map((key) => (
                  <section key={key} {...sectionBreakProps(data, key)}>
                    <ResumeSection section={key} data={data} theme={theme} />
                  </section>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

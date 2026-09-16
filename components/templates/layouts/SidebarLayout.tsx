import type { CSSProperties } from "react";
import { SUMMARY_COPY } from "@/lib/persona";
import { getRenderableSections, hasSummary, sectionBreakProps } from "@/lib/resume";
import type { ResumeData } from "@/lib/types";
import { Avatar, ContactLine, hasAvatar, SummaryText } from "../shared/atoms";
import { NARROW_SECTION_KEYS, ResumeSection } from "../shared/ResumeSection";
import { SectionHeading } from "../shared/SectionHeading";
import { tint, type TemplateTheme } from "../shared/theme";

export function SidebarLayout({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  const sections = getRenderableSections(data);
  const sidebarSections = sections.filter((k) => NARROW_SECTION_KEYS.has(k));
  const mainSections = sections.filter((k) => !NARROW_SECTION_KEYS.has(k));
  const solid = theme.sidebarStyle === "solid";
  const side = theme.sidebarSide ?? "left";
  const fontClass = theme.fontDisplay === "serif" ? "font-display" : "font-sans";
  const railBg = solid ? theme.accent : tint(theme.accent, 8);
  const pageStyle = { "--resume-rail-bg": railBg } as CSSProperties;
  const right = side === "right";

  const sidebar = (
    <td
      data-resume-column="rail"
      className={`resume-sidebar-rail flex w-[34%] shrink-0 flex-col gap-5 self-stretch p-6 ${solid ? "text-white" : ""}`}
      style={{ background: railBg }}
    >
      {!theme.darkHeader && (
        <div className="flex flex-col items-start gap-3">
          {hasAvatar(data, theme) && (
            <Avatar
              name={data.basicInfo.name || "?"}
              accent={solid ? "#ffffff33" : theme.accent}
              photo={data.photo}
              size={72}
            />
          )}
          <h1 className={`${fontClass} text-[19px] font-semibold`} style={{ color: solid ? "#ffffff" : theme.accent }}>
            {data.basicInfo.name || "Your Name"}
          </h1>
          <ContactLine info={data.basicInfo} light={solid} stacked />
        </div>
      )}
      {sidebarSections.map((key) => (
        <section key={key} {...sectionBreakProps(data, key)}>
          <ResumeSection section={key} data={data} theme={theme} light={solid} />
        </section>
      ))}
    </td>
  );

  const main = (
    <td data-resume-column="main" className="resume-main-column flex flex-1 flex-col gap-5 p-8">
      {hasSummary(data) && (
        <section {...sectionBreakProps(data, "summary")}>
          <SectionHeading theme={theme} section="summary" title={SUMMARY_COPY.label} />
          <SummaryText text={data.sections.summary} />
        </section>
      )}
      {mainSections.map((key) => (
        <section key={key} {...sectionBreakProps(data, key)}>
          <ResumeSection section={key} data={data} theme={theme} />
        </section>
      ))}
    </td>
  );

  const columns = (
    <table
      className={`resume-sidebar-columns flex min-h-0 w-full flex-1 items-stretch ${right ? "resume-sidebar-columns--right flex-row-reverse" : ""}`}
      role="presentation"
    >
      <thead className="resume-sidebar-page-pad">
        <tr>
          <th className="resume-sidebar-pad-rail" aria-hidden="true">
            {"\u00a0"}
          </th>
          <th className="resume-sidebar-pad-main" aria-hidden="true">
            {"\u00a0"}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {sidebar}
          {main}
        </tr>
      </tbody>
    </table>
  );

  if (theme.darkHeader) {
    return (
      <div className="resume-surface resume-sidebar-page flex min-h-full flex-col" style={pageStyle}>
        <div className="resume-dark-header flex items-center gap-6 px-8 py-6 text-white" style={{ background: theme.accent }}>
          <div className="min-w-0 flex-1">
            <h1 className={`${fontClass} text-[24px] font-semibold`}>{data.basicInfo.name || "Your Name"}</h1>
            <div className="mt-1.5">
              <ContactLine info={data.basicInfo} light />
            </div>
          </div>
          {hasAvatar(data, theme) && (
            <Avatar name={data.basicInfo.name || "?"} accent="#ffffff33" photo={data.photo} size={76} />
          )}
        </div>
        {columns}
      </div>
    );
  }

  return (
    <div className="resume-surface resume-sidebar-page flex min-h-full" style={pageStyle}>
      {columns}
    </div>
  );
}

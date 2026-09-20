import type { CSSProperties } from "react";
import { PAGE_PAD_X_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { SUMMARY_COPY } from "@/lib/persona";
import { getRenderableSections, hasSummary, sectionBreakProps } from "@/lib/resume";
import type { ResumeData } from "@/lib/types";
import type { NameHeadingLevel } from "../registry";
import { Avatar, ContactLine, hasAvatar, SummaryText, visiblePhoto } from "../shared/atoms";
import { NARROW_SECTION_KEYS, ResumeSection } from "../shared/ResumeSection";
import { SectionHeading } from "../shared/SectionHeading";
import { tint, type TemplateTheme } from "../shared/theme";

/** The rail is 34% of the page. Kept as a resolved px number for the print
 * fill, which is positioned against the sheet rather than this 760px root. */
const RAIL_WIDTH_PX = Math.round(PAGE_WIDTH_PX * 0.34 * 100) / 100;

/** Even 4% content inset on all four sides, every page. Page 1 (and any
 * standalone single-page render — gallery thumbnails, the empty skeleton)
 * gets it straight from this padding, since it's the box's real top/bottom
 * edge. Page 2+ can't repeat real padding at an internal print page-break,
 * so the same 4% reappears there as a repeating table head/foot band the
 * columns table paints per column color — text gets the gap, the rail's
 * color runs straight through it (see `.resume-sidebar-page-pad` in
 * app/globals.css and the matching band in ResumePreviewFrame). */
const COL_PAD_STYLE: CSSProperties = {
  paddingTop: PAGE_PAD_Y_PX,
  paddingRight: PAGE_PAD_X_PX,
  paddingBottom: PAGE_PAD_Y_PX,
  paddingLeft: PAGE_PAD_X_PX,
};

export function SidebarLayout({
  data,
  theme,
  headingLevel = "h1",
}: {
  data: ResumeData;
  theme: TemplateTheme;
  /** "h1" for the real document (builder pane, PDF export); "p" for
   * decorative marketing-site thumbnails so a page never gets more than
   * one real `<h1>`. */
  headingLevel?: NameHeadingLevel;
}) {
  const NameHeading = headingLevel;
  const sections = getRenderableSections(data);
  const sidebarSections = sections.filter((k) => NARROW_SECTION_KEYS.has(k));
  const mainSections = sections.filter((k) => !NARROW_SECTION_KEYS.has(k));
  const solid = theme.sidebarStyle === "solid";
  const side = theme.sidebarSide ?? "left";
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const railBg = solid ? theme.accent : tint(theme.accent, 8);
  const right = side === "right";
  const pageStyle = {
    "--resume-rail-bg": railBg,
    "--resume-pad-y": `${PAGE_PAD_Y_PX}px`,
    "--resume-pad-x": `${PAGE_PAD_X_PX}px`,
    // Repeating page-2+ band matches the real 4% content inset above —
    // same number on every page, not the single-column family's 5%.
    "--resume-page-inset": `${PAGE_PAD_Y_PX}px`,
  } as CSSProperties;

  const sidebar = (
    <td
      data-resume-column="rail"
      className={`resume-sidebar-rail relative w-[34%] ${solid ? "text-white" : ""}`}
      style={{ backgroundColor: railBg, verticalAlign: "top", padding: 0 }}
    >
      <div
        className="resume-col-pad flex flex-col gap-5"
        style={{ ...COL_PAD_STYLE, backgroundColor: railBg }}
      >
        {!theme.darkHeader && (
          <div className="flex flex-col items-start gap-3">
            {hasAvatar(data, theme) && (
              <Avatar
                name={data.basicInfo.name || "?"}
                accent={solid ? "#ffffff33" : theme.accent}
                photo={visiblePhoto(data)}
                size={72}
              />
            )}
            <NameHeading className={`${fontClass} text-[19px] font-semibold`} style={{ color: solid ? "#ffffff" : theme.accent }}>
              {data.basicInfo.name || "Your Name"}
            </NameHeading>
            <ContactLine info={data.basicInfo} light={solid} stacked />
          </div>
        )}
        {sidebarSections.map((key) => (
          <section key={key} {...sectionBreakProps(data, key)}>
            <ResumeSection section={key} data={data} theme={theme} light={solid} />
          </section>
        ))}
      </div>
    </td>
  );

  const main = (
    <td
      data-resume-column="main"
      className="resume-main-column relative"
      style={{ verticalAlign: "top", padding: 0, backgroundColor: "#ffffff" }}
    >
      <div className="resume-col-pad flex flex-col gap-5" style={COL_PAD_STYLE}>
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
      </div>
    </td>
  );

  /* Print-only rail paint. A fragmented box only paints its background as
   * far as its own content reaches, so on the last sheet the rail stopped
   * at the last line of text and left a white band below it. A fixed-position
   * strip is repeated by the print engine on *every* sheet, full height, so
   * the rail runs edge to edge on all of them regardless of where content
   * ends. `display: none` off-print keeps it out of the screen preview.
   *
   * Geometry is resolved px off PAGE_WIDTH, never a percentage: a fixed box
   * resolves percentages against the *sheet*, which is wider than this
   * 760px root, and 34% of the sheet is a visibly wider rail than the 34%
   * column it has to sit under. */
  const printRail = (
    <div
      className="resume-rail-print-fill"
      aria-hidden="true"
      style={{
        backgroundColor: railBg,
        width: RAIL_WIDTH_PX,
        left: right ? PAGE_WIDTH_PX - RAIL_WIDTH_PX : 0,
      }}
    />
  );

  /* thead repeats on every printed page; margin-top pulls it off page 1
   * (its own real .resume-col-pad padding covers that page instead).
   * Pad cells match column colors so the 4% band isn’t a white “patch”. */
  const columns = (
    <table
      className={`resume-sidebar-columns w-full ${right ? "resume-sidebar-columns--right" : ""}`}
      role="presentation"
    >
      {/* Fixed table layout otherwise sizes columns off the *first* row —
       * the hidden thead's pad cells, which carry no width outside
       * @media print — and silently falls back to an even 50/50 split on
       * screen. An explicit colgroup pins 34/66 in every mode. */}
      <colgroup>
        <col style={{ width: "34%" }} />
        <col style={{ width: "66%" }} />
      </colgroup>
      <thead className="resume-sidebar-page-pad">
        <tr>
          <th className="resume-sidebar-pad-rail" aria-hidden="true" style={{ backgroundColor: railBg }}>
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
      <div
        className={`resume-surface resume-sidebar-page flex min-h-full flex-col ${right ? "resume-sidebar-page--right" : ""}`}
        data-layout={theme.layout}
        style={pageStyle}
      >
        {printRail}
        <div
          className="resume-dark-header relative z-[1] flex items-center gap-6 text-white"
          style={{ background: theme.accent, padding: `${PAGE_PAD_Y_PX}px ${PAGE_PAD_X_PX * 2}px` }}
        >
          <div className="min-w-0 flex-1">
            <NameHeading className={`${fontClass} text-[24px] font-semibold`}>{data.basicInfo.name || "Your Name"}</NameHeading>
            <div className="mt-1.5">
              <ContactLine info={data.basicInfo} light />
            </div>
          </div>
          {hasAvatar(data, theme) && (
            <Avatar name={data.basicInfo.name || "?"} accent="#ffffff33" photo={visiblePhoto(data)} size={76} />
          )}
        </div>
        {columns}
      </div>
    );
  }

  return (
    <div
      className={`resume-surface resume-sidebar-page min-h-full ${right ? "resume-sidebar-page--right" : ""}`}
      data-layout={theme.layout}
      style={pageStyle}
    >
      {printRail}
      {columns}
    </div>
  );
}

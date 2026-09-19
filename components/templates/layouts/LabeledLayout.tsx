import { resumeSectionTitle } from "@/lib/persona";
import { getRenderableSections, hasSummary, sectionBreakProps } from "@/lib/resume";
import type { ResumeData, SectionKey } from "@/lib/types";
import { Avatar, ContactGrid, hasAvatar, SummaryText, visiblePhoto } from "../shared/atoms";
import { ResumeSection } from "../shared/ResumeSection";
import type { TemplateTheme } from "../shared/theme";

/** European-style CV: centered name, section titles in a left label column,
 * content in a wide right column. Hairline rules sit on the content column
 * at the top of every section after the first — kept inside the section so
 * page-gap spacers move the divider with its label and body. */
export function LabeledLayout({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  const sections = getRenderableSections(data);
  const fontClass = theme.fontDisplay === "serif" ? "font-serif" : "font-sans";
  const gap = theme.density === "compact" ? "gap-4" : "gap-5";
  const hasContact = Boolean(
    data.basicInfo.location ||
      data.basicInfo.email ||
      data.basicInfo.phone ||
      data.basicInfo.links.linkedin ||
      data.basicInfo.links.github ||
      data.basicInfo.links.portfolio,
  );

  let rowIndex = 0;

  return (
    <div className={`resume-surface min-h-full px-8 pb-8 pt-8 ${fontClass}`} data-layout={theme.layout}>
      <div className="flex flex-col items-center gap-3 text-center">
        {hasAvatar(data, theme) && (
          <Avatar name={data.basicInfo.name || "?"} accent={theme.accent} photo={visiblePhoto(data)} size={72} />
        )}
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: theme.accent }}>
          {data.basicInfo.name || "Your Name"}
        </h1>
      </div>

      <div className={`resume-page-body mt-6 flex flex-col ${gap}`}>
        {hasContact && (
          <LabeledRow title="Personal Information" ruled={rowIndex++ > 0}>
            <ContactGrid info={data.basicInfo} />
          </LabeledRow>
        )}
        {hasSummary(data) && (
          <LabeledRow title="Profile" ruled={rowIndex++ > 0} {...sectionBreakProps(data, "summary")}>
            <SummaryText text={data.sections.summary} />
          </LabeledRow>
        )}
        {sections.map((key) => (
          <LabeledRow
            key={key}
            title={labeledSectionTitle(key, data)}
            ruled={rowIndex++ > 0}
            {...sectionBreakProps(data, key)}
          >
            <ResumeSection section={key} data={data} theme={theme} hideHeading />
          </LabeledRow>
        ))}
      </div>
    </div>
  );
}

const labeledRowClass =
  "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(7.5rem,22%)_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-0";

const labeledTitleClass =
  "text-[13px] font-semibold leading-snug text-[var(--r-ink)] break-after-avoid sm:pt-0.5";

/** Matches the reference hairline (~#8a8377). */
const RULE = "border-t border-[var(--r-ink-faint)]";

function LabeledRow({
  title,
  children,
  ruled,
  "data-section-key": sectionKey,
  "data-force-break": forceBreak,
}: {
  title: string;
  children: React.ReactNode;
  /** Content-column top rule for every section after the first. */
  ruled: boolean;
  "data-section-key"?: string;
  "data-force-break"?: true;
}) {
  return (
    <section
      data-section-key={sectionKey}
      data-force-break={forceBreak}
      data-labeled-ruled={ruled || undefined}
      className={labeledRowClass}
    >
      <h3 className={labeledTitleClass}>{title}</h3>
      <div className={`min-w-0 ${ruled ? `${RULE} pt-4` : ""}`}>{children}</div>
    </section>
  );
}

function labeledSectionTitle(key: SectionKey, data: ResumeData): string {
  if (key === "experience") return "Work experience";
  return resumeSectionTitle(key, data);
}

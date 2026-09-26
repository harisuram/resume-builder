import { Image, Page, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";
import { hasAvatar, visiblePhoto } from "@/components/templates/shared/atoms";
import {
  CIVIC_BLUE,
  KERNEL_PROMPT,
  TESSERA_GROUND,
  headerColor,
  monogramInitials,
  splitLastWord,
  type TemplateTheme,
  type TemplateVariant,
} from "@/components/templates/shared/theme";
import { formatDateRange, isCurrentExperience } from "@/lib/date";
import { PAGE_INSET_PX, PAGE_PAD_Y_PX } from "@/lib/page";
import { mixHex, tintHex } from "@/lib/pdf/color";
import { SUMMARY_COPY, resumeSectionTitle } from "@/lib/persona";
import { getRenderableSections, hasSummary } from "@/lib/resume";
import type { BasicInfo, ResumeData, SectionKey } from "@/lib/types";
import { PDF_DISPLAY, PDF_SERIF } from "./fonts";
import { PdfIcon } from "./PdfIcon";
import {
  Avatar,
  Bullets,
  ContactLine,
  INK_SOFT,
  PdfSection,
  SectionHeading,
  WHITE,
  contactItems,
  itemGap,
  onPaper,
  pageBase,
  pt,
  text,
  type Ink,
} from "./ResumePdfDocument";

type VariantTheme = TemplateTheme & { variant: TemplateVariant };

/** A4 width less the 32px side margins, in pt. Explicit widths instead of
 * `flex: 1` inside breakable blocks: react-pdf can lay out a zero-height
 * fragment for a stretching child at a page break and divide by it. */
const PAGE_WIDTH_PT = 595.28;
const bodyWidth = (sidePx: number) => PAGE_WIDTH_PT - 2 * pt(sidePx);

/** Mirrors components/templates/layouts/VariantLayout.tsx — same headers and
 * the same section treatments globals.css applies under `data-variant`. */
export function VariantPages({ data, theme }: { data: ResumeData; theme: VariantTheme }) {
  const sections = getRenderableSections(data);
  const ink = onPaper(theme);
  const tessera = theme.variant === "tessera";
  const side = tessera ? 24 : 32;
  const surface = tessera ? { ...ink, surface: WHITE } : ink;
  return (
    <Page
      size="A4"
      style={{
        ...pageBase,
        ...(theme.variant === "laureate" ? { fontFamily: PDF_SERIF } : {}),
        ...(tessera ? { backgroundColor: TESSERA_GROUND } : {}),
        paddingTop: pt(PAGE_INSET_PX),
        paddingBottom: pt(PAGE_PAD_Y_PX),
      }}
    >
      <VariantHeader data={data} theme={theme} />
      <View
        style={{
          paddingHorizontal: pt(side),
          paddingTop: pt(tessera ? 14 : 24),
          // No paddingBottom: the Page's own paddingBottom reserves the margin.
          // Body padding that doesn't fit below the last line makes react-pdf
          // start a new page holding only the padding — a blank last page.
          gap: pt(tessera ? 14 : 20),
        }}
      >
        {hasSummary(data) && (
          <Card on={tessera}>
            <SectionHeading theme={theme} section="summary" title={SUMMARY_COPY.label} ink={surface} />
            <VariantSummary text={data.sections.summary ?? ""} theme={theme} />
          </Card>
        )}
        {sections.map((key) => (
          <Card key={key} on={tessera}>
            <VariantSection section={key} data={data} theme={theme} ink={surface} width={bodyWidth(side)} />
          </Card>
        ))}
      </View>
    </Page>
  );
}

function Card({ on, children }: { on: boolean; children: ReactNode }) {
  if (!on) return <View>{children}</View>;
  return (
    <View style={{ backgroundColor: WHITE, borderRadius: pt(12), paddingVertical: pt(18), paddingHorizontal: pt(20) }}>
      {children}
    </View>
  );
}

function VariantSummary({ text: body, theme }: { text: string; theme: VariantTheme }) {
  const lead = theme.variant === "sterling" || theme.variant === "cameo" || theme.variant === "horizon";
  if (!lead) return <Text style={{ ...text(12.5), lineHeight: 1.625 }}>{body}</Text>;
  return (
    <Text
      style={{
        ...text(16, 1.6),
        fontFamily: theme.displayFont ? PDF_DISPLAY[theme.displayFont] : undefined,
        fontWeight: theme.displayFont === "fraunces" ? 300 : 500,
        fontStyle: theme.variant === "horizon" ? "normal" : "italic",
        textAlign: theme.variant === "cameo" ? "center" : "left",
      }}
    >
      {body}
    </Text>
  );
}

/* --------------------------------------------------------------- sections */

const TIMELINE_SECTIONS = new Set<SectionKey>(["experience", "internships", "partTime", "education"]);
const DATE_COLUMN_PX = 88;
const DATE_GAP_PX = 12;

function VariantSection({
  section,
  data,
  theme,
  ink,
  width,
}: {
  section: SectionKey;
  data: ResumeData;
  theme: VariantTheme;
  ink: Ink;
  width: number;
}) {
  if (theme.variant === "horizon" && TIMELINE_SECTIONS.has(section)) {
    return <TimelineSection section={section} data={data} theme={theme} ink={ink} width={width} />;
  }
  if (theme.variant === "pivot" && section === "keyAchievements") {
    return <ResultsGrid data={data} theme={theme} ink={ink} width={width} />;
  }
  if (theme.variant === "sterling" && section === "skills") {
    return <CompetencyGrid data={data} theme={theme} ink={ink} width={width} />;
  }
  if (theme.variant === "kernel" && section === "skills") {
    return <MonoChips data={data} theme={theme} ink={ink} />;
  }
  return <PdfSection section={section} data={data} theme={theme} ink={ink} />;
}

/** Horizon: dates in a left column, entries along a line with a ring each. */
function TimelineSection({
  section,
  data,
  theme,
  ink,
  width,
}: {
  section: SectionKey;
  data: ResumeData;
  theme: VariantTheme;
  ink: Ink;
  width: number;
}) {
  const second = headerColor(theme);
  const s = data.sections;
  const rows: { date: string; body: ReactNode }[] =
    section === "education"
      ? (s.education ?? []).map((edu) => ({
          date: formatDateRange(edu.startDate, edu.endDate),
          body: (
            <>
              <Text style={{ ...text(13), fontWeight: 600, color: ink.strong }}>{edu.institution}</Text>
              <Text style={{ ...text(12), color: ink.soft }}>
                {`${edu.degree}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}${edu.gpa ? ` · GPA ${edu.gpa}` : ""}`}
              </Text>
              {edu.coursework && edu.coursework.length > 0 && (
                <Text style={{ marginTop: pt(2), ...text(11.5), color: ink.faint }}>
                  <Text style={{ fontWeight: 500, color: ink.soft }}>Coursework: </Text>
                  {edu.coursework.join(", ")}
                </Text>
              )}
            </>
          ),
        }))
      : ((section === "experience" || section === "internships" || section === "partTime" ? s[section] : undefined) ?? []).map(
          (exp) => ({
            date: formatDateRange(exp.startDate, exp.endDate, isCurrentExperience(exp)),
            body: (
              <>
                <Text style={{ ...text(13), fontWeight: 600, color: ink.strong }}>
                  {exp.role}
                  <Text style={{ fontWeight: 400, color: ink.soft }}>{exp.company ? ` ${exp.company}` : ""}</Text>
                </Text>
                <Bullets items={exp.bullets} theme={theme} ink={ink} />
              </>
            ),
          }),
        );
  const contentWidth = width - pt(DATE_COLUMN_PX) - pt(DATE_GAP_PX);
  return (
    <>
      <SectionHeading theme={theme} section={section} title={sectionTitle(section, data)} ink={ink} />
      <View>
        {rows.map((row, i) => (
          // Pass `wrap` only when it's false. react-pdf reads a present prop
          // as-is (`'wrap' in props ? props.wrap : true`), so `wrap={undefined}`
          // made every experience entry unbreakable: a long role jumped whole
          // to the next page and stranded most of the one before it.
          <View key={i} {...(section === "education" ? { wrap: false } : {})} style={{ flexDirection: "row" }}>
            <Text
              style={{
                width: pt(DATE_COLUMN_PX),
                marginRight: pt(DATE_GAP_PX),
                paddingTop: pt(2),
                textAlign: "right",
                ...text(10.5),
                fontWeight: 600,
                color: second,
              }}
            >
              {row.date}
            </Text>
            <View
              style={{
                width: contentWidth,
                borderLeftWidth: pt(1),
                borderLeftColor: tintHex(second, 55),
                paddingLeft: pt(20),
                paddingBottom: i === rows.length - 1 ? 0 : itemGap(theme),
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: -pt(5),
                  top: pt(4),
                  width: pt(9),
                  height: pt(9),
                  borderRadius: pt(4.5),
                  borderWidth: pt(1.5),
                  borderColor: second,
                  backgroundColor: WHITE,
                }}
              />
              {row.body}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

/** Pivot: key achievements as a two-column grid of accent-barred results. */
function ResultsGrid({ data, theme, ink, width }: { data: ResumeData; theme: VariantTheme; ink: Ink; width: number }) {
  const gap = pt(24);
  const cell = (width - gap) / 2;
  return (
    <>
      <SectionHeading theme={theme} section="keyAchievements" title={sectionTitle("keyAchievements", data)} ink={ink} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: gap, rowGap: pt(10) }}>
        {(data.sections.keyAchievements ?? []).filter(Boolean).map((item, i) => (
          <View key={i} wrap={false} style={{ width: cell, borderLeftWidth: pt(3), borderLeftColor: theme.accent, paddingLeft: pt(10) }}>
            <Text style={{ ...text(12), lineHeight: 1.375, color: ink.strong }}>{item}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

/** Sterling: skills as a ruled three-column list of competencies. */
function CompetencyGrid({ data, theme, ink, width }: { data: ResumeData; theme: VariantTheme; ink: Ink; width: number }) {
  const gap = pt(20);
  const cell = (width - 2 * gap) / 3;
  const rule = tintHex(theme.accent, 22);
  return (
    <>
      <SectionHeading theme={theme} section="skills" title={sectionTitle("skills", data)} ink={ink} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: gap, borderTopWidth: pt(1), borderTopColor: rule }}>
        {(data.sections.skills ?? []).map((skill, i) => (
          // Whole cells only — a page break through a bordered cell tears it.
          <Text
            key={i}
            wrap={false}
            style={{ width: cell, paddingVertical: pt(7), borderBottomWidth: pt(1), borderBottomColor: rule, ...text(12), color: ink.strong }}
          >
            {skill}
          </Text>
        ))}
      </View>
    </>
  );
}

/** Kernel: the stack as monospace chips. */
function MonoChips({ data, theme, ink }: { data: ResumeData; theme: VariantTheme; ink: Ink }) {
  return (
    <>
      <SectionHeading theme={theme} section="skills" title={sectionTitle("skills", data)} ink={ink} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: pt(6) }}>
        {(data.sections.skills ?? []).map((skill, i) => (
          // One unit, as in ChipOrInline: a split chip leaves an empty pill.
          <Text
            key={i}
            wrap={false}
            style={{
              ...text(11),
              fontFamily: PDF_DISPLAY.mono,
              color: theme.accent,
              backgroundColor: tintHex(theme.accent, 14),
              paddingHorizontal: pt(8),
              paddingVertical: pt(2),
              borderRadius: pt(4),
            }}
          >
            {skill}
          </Text>
        ))}
      </View>
    </>
  );
}

/** Same heading wording every other template uses. */
const sectionTitle = (section: SectionKey, data: ResumeData) => resumeSectionTitle(section, data);

/* ---------------------------------------------------------------- headers */

function VariantHeader({ data, theme }: { data: ResumeData; theme: VariantTheme }) {
  const info = data.basicInfo;
  const name = info.name || "Your Name";
  const second = headerColor(theme);
  const display = theme.displayFont ? PDF_DISPLAY[theme.displayFont] : undefined;
  const photo = visiblePhoto(data);
  const avatar = (sizePx: number, fill: string) =>
    hasAvatar(data, theme) ? <Avatar name={name} photo={photo} fill={fill} size={pt(sizePx)} /> : null;
  // A band runs up to the paper edge and takes the page's top inset inside
  // itself, as the plain single-column band does.
  const band = (topPx: number, bottomPx: number): Style => ({
    backgroundColor: second,
    marginTop: -pt(PAGE_INSET_PX),
    paddingTop: pt(PAGE_INSET_PX + topPx),
    paddingBottom: pt(bottomPx),
  });

  switch (theme.variant) {
    case "horizon": {
      const [lead, last] = splitLastWord(name);
      return (
        // Contact under the name, never beside it: react-pdf never breaks a
        // word, so a long hyphenated surname would run into a side column.
        <View
          style={{
            marginHorizontal: pt(32),
            paddingTop: pt(16),
            paddingBottom: pt(24),
            borderBottomWidth: pt(1),
            borderBottomColor: tintHex(theme.accent, 15),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: pt(24) }}>
            {avatar(76, theme.accent)}
            <Text style={{ flex: 1, fontFamily: display, fontWeight: 300, ...text(40, 1.05), color: theme.accent }}>
              {lead ? `${lead} ` : ""}
              <Text style={{ fontStyle: "italic", color: second }}>{last}</Text>
            </Text>
          </View>
          <View style={{ marginTop: pt(12) }}>
            <ContactLine info={info} color={INK_SOFT} />
          </View>
        </View>
      );
    }
    case "pivot":
      return (
        <View style={{ ...band(40, 28), paddingHorizontal: pt(32), flexDirection: "row", alignItems: "center", gap: pt(24) }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: display, fontWeight: 600, ...text(34, 1.25), color: WHITE }}>{name}</Text>
            <View style={{ marginTop: pt(12) }}>
              <ContactLine info={info} color={mixHex(WHITE, 85, second)} />
            </View>
          </View>
          {avatar(80, mixHex(WHITE, 20, second))}
          <View style={{ position: "absolute", left: pt(32), bottom: 0, width: pt(64), height: pt(3), backgroundColor: theme.accent }} />
        </View>
      );
    case "laureate":
      return (
        <View style={{ paddingHorizontal: pt(32), paddingTop: pt(16), alignItems: "center", gap: pt(12) }}>
          {avatar(72, theme.accent)}
          <Text
            style={{
              fontFamily: PDF_SERIF,
              fontWeight: 600,
              ...text(30, 1.25),
              textTransform: "uppercase",
              letterSpacing: pt(30) * 0.14,
              color: second,
              textAlign: "center",
            }}
          >
            {name}
          </Text>
          <CenteredContact info={info} />
          <View
            style={{
              alignSelf: "stretch",
              marginTop: pt(8),
              height: pt(4),
              borderTopWidth: pt(1),
              borderBottomWidth: pt(1),
              borderColor: theme.accent,
            }}
          />
        </View>
      );
    case "sterling":
      return (
        <View style={{ paddingHorizontal: pt(32), paddingTop: pt(16) }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: pt(24) }}>
            {avatar(76, theme.accent)}
            <Text style={{ flex: 1, fontFamily: display, fontWeight: 500, ...text(46, 1.05), color: second }}>{name}</Text>
          </View>
          <View style={{ marginTop: pt(12), marginBottom: pt(20) }}>
            <ContactLine info={info} color={INK_SOFT} />
          </View>
          <View style={{ height: pt(2), backgroundColor: second }} />
          <View style={{ marginTop: pt(3), height: pt(1), backgroundColor: theme.accent }} />
        </View>
      );
    case "cameo":
      return (
        <View style={{ paddingHorizontal: pt(32), paddingTop: pt(16), alignItems: "center" }}>
          <View
            style={{
              width: pt(84),
              height: pt(84),
              borderRadius: pt(42),
              borderWidth: pt(1),
              borderColor: theme.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: pt(74),
                height: pt(74),
                borderRadius: pt(37),
                borderWidth: pt(1),
                borderColor: tintHex(theme.accent, 40),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {photo ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF drawing primitive, not an <img>
                <Image src={photo} style={{ width: pt(66), height: pt(66), borderRadius: pt(33), objectFit: "cover" }} />
              ) : (
                <Text style={{ fontFamily: display, fontWeight: 500, fontStyle: "italic", ...text(28, 1.1), color: second }}>
                  {monogramInitials(name)}
                </Text>
              )}
            </View>
          </View>
          <Text
            style={{
              marginTop: pt(16),
              fontFamily: display,
              fontWeight: 500,
              ...text(30, 1.25),
              textTransform: "uppercase",
              letterSpacing: pt(30) * 0.28,
              color: second,
              textAlign: "center",
            }}
          >
            {name}
          </Text>
          <View style={{ marginTop: pt(8) }}>
            <CenteredContact info={info} />
          </View>
        </View>
      );
    case "civic":
      return (
        <View>
          <View style={{ ...band(36, 24), paddingHorizontal: pt(32), flexDirection: "row", alignItems: "flex-end", gap: pt(24) }}>
            {avatar(72, mixHex(WHITE, 20, second))}
            <Text style={{ flex: 1, fontWeight: 600, ...text(28, 1.25), color: WHITE }}>{name}</Text>
            <View style={{ width: "40%" }}>
              <ContactLine info={info} color={mixHex(WHITE, 85, second)} stacked />
            </View>
          </View>
          <View style={{ flexDirection: "row", height: pt(5) }}>
            <View style={{ width: "33.33%", backgroundColor: theme.accent }} />
            <View style={{ width: "33.34%", backgroundColor: WHITE }} />
            <View style={{ width: "33.33%", backgroundColor: CIVIC_BLUE }} />
          </View>
        </View>
      );
    case "kernel":
      return (
        <View style={{ paddingHorizontal: pt(32), paddingTop: pt(16) }}>
          <View
            style={{
              backgroundColor: second,
              borderRadius: pt(10),
              paddingHorizontal: pt(24),
              paddingVertical: pt(20),
              flexDirection: "row",
              alignItems: "center",
              gap: pt(20),
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: pt(6), marginBottom: pt(12) }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((dot) => (
                  <View key={dot} style={{ width: pt(9), height: pt(9), borderRadius: pt(4.5), backgroundColor: dot }} />
                ))}
              </View>
              <Text style={{ fontFamily: PDF_DISPLAY.mono, ...text(11.5), color: KERNEL_PROMPT }}>$ whoami</Text>
              <Text style={{ marginTop: pt(4), fontFamily: PDF_DISPLAY.mono, fontWeight: 600, ...text(28, 1.25), color: WHITE }}>
                {name}
                <Text style={{ color: KERNEL_PROMPT }}>_</Text>
              </Text>
              <View style={{ marginTop: pt(8) }}>
                <ContactLine info={info} color={mixHex(WHITE, 72, second)} />
              </View>
            </View>
            {avatar(72, mixHex(WHITE, 14, second))}
          </View>
        </View>
      );
    case "tessera":
      return (
        <View style={{ paddingHorizontal: pt(24), paddingTop: pt(8) }}>
          <View
            style={{
              backgroundColor: second,
              borderRadius: pt(14),
              paddingHorizontal: pt(28),
              paddingVertical: pt(24),
              flexDirection: "row",
              alignItems: "center",
              gap: pt(20),
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                right: -pt(48),
                top: -pt(48),
                width: pt(176),
                height: pt(176),
                borderRadius: pt(88),
                backgroundColor: theme.accent,
                opacity: 0.2,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: display, fontWeight: 700, ...text(30, 1.25), color: WHITE }}>{name}</Text>
              <View style={{ marginTop: pt(8) }}>
                <ContactLine info={info} color={mixHex(WHITE, 85, second)} />
              </View>
            </View>
            {avatar(76, mixHex(WHITE, 14, second))}
          </View>
        </View>
      );
  }
}

/** Contact items centred on the line (Laureate, Cameo). */
function CenteredContact({ info }: { info: BasicInfo }) {
  const items = contactItems(info);
  if (items.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: pt(12), rowGap: pt(4) }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: pt(4) }}>
          <View style={{ marginTop: pt(2) }}>
            <PdfIcon name={item.icon} size={pt(12)} color={INK_SOFT} opacity={0.8} />
          </View>
          <Text style={{ ...text(12), color: INK_SOFT }}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

import { Document, Image, Link, Page, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";
import { bulletKind, hasAvatar, visiblePhoto } from "@/components/templates/shared/atoms";
import { SECTION_ICON_NAMES, type IconName } from "@/components/templates/shared/iconShapes";
import { getTheme, headerColor, railBackground, type TemplateTheme } from "@/components/templates/shared/theme";
import { DEFAULT_DIAL_CODE } from "@/lib/countryCodes";
import { formatDateRange, formatMonth, isCurrentExperience } from "@/lib/date";
import { PAGE_INSET_PX, PAGE_PAD_X_PX, PAGE_PAD_Y_PX } from "@/lib/page";
import { mixHex, tintHex } from "@/lib/pdf/color";
import { SUMMARY_COPY, resumeSectionTitle } from "@/lib/persona";
import { NARROW_SECTION_KEYS, getRenderableSections, hasSummary } from "@/lib/resume";
import type { BasicInfo, ResumeData, SectionKey } from "@/lib/types";
import { PDF_DISPLAY, PDF_SANS, PDF_SERIF } from "./fonts";
import { VariantPages } from "./variantPages";
import { PdfBullet, PdfIcon } from "./PdfIcon";

/** The HTML templates are designed in CSS px on a 794px-wide A4 sheet
 * (lib/page.ts); a PDF page is 595.28pt wide. 1px = 0.75pt, so every size
 * below is the HTML value passed through `pt()` — keeping the two engines on
 * the same proportions rather than two hand-tuned sets of numbers. */
export const pt = (px: number) => px * 0.75;

/** Font size plus line height for one run of text. Tailwind's preflight
 * gives all HTML text a 1.5 line height unless a leading-* class says
 * otherwise; react-pdf would fall back to the font's tighter metrics. Set per
 * text style rather than once on the page, because react-pdf resolves an
 * inherited multiplier against the ancestor's font size — a 26px name would
 * get the 12px body's line box and collide with the line below it. */
export const text = (px: number, lineHeight = 1.5) => ({ fontSize: pt(px), lineHeight });

export const INK = "#1b1812";
export const INK_SOFT = "#57524a";
export const INK_FAINT = "#8a8377";
const RULE = "#e4dfd2";
export const WHITE = "#ffffff";

/** How text reads on the surface it sits on: the resume's own paper, or a
 * solid-colour sidebar where the HTML switches to `text-white`, `/80`, `/60`
 * (resolved here against the rail colour, since react-pdf has no alpha text). */
export interface Ink {
  strong: string;
  soft: string;
  faint: string;
  /** Bullet marks, links and heading colour. */
  mark: string;
  /** True on a solid rail: headings go white and chip lists go inline. */
  light: boolean;
  /** The colour under the text, for blending the translucent heading chrome. */
  surface: string;
}

export const onPaper = (theme: TemplateTheme): Ink => ({
  strong: INK,
  soft: INK_SOFT,
  faint: INK_FAINT,
  mark: theme.accent,
  light: false,
  surface: WHITE,
});

const onRail = (rail: string): Ink => ({
  strong: WHITE,
  soft: mixHex(WHITE, 80, rail),
  faint: mixHex(WHITE, 60, rail),
  mark: WHITE,
  light: true,
  surface: rail,
});

export function ResumePdfDocument({ data }: { data: ResumeData }) {
  const theme = getTheme(data.templateId);
  const name = data.basicInfo.name || "Your Name";
  return (
    <Document title={name} author={name} creator="Free Resume Builder" producer="Free Resume Builder">
      {theme.layout === "sidebar" ? (
        <SidebarPages data={data} theme={theme} />
      ) : theme.layout === "asymmetric" ? (
        <TwoColumnPages data={data} theme={theme} />
      ) : theme.layout === "labeled" ? (
        <LabeledPages data={data} theme={theme} />
      ) : (
        <SingleColumnPages data={data} theme={theme} />
      )}
    </Document>
  );
}

export const pageBase: Style = { fontFamily: PDF_SANS, ...text(12), color: INK, backgroundColor: WHITE };

/* ---------------------------------------------------------------- single */

function SingleColumnPages({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  // The bespoke single-column templates draw their own header and a few
  // section treatments (components/pdf/variantPages.tsx).
  if (theme.variant) return <VariantPages data={data} theme={{ ...theme, variant: theme.variant }} />;
  const band = theme.darkHeader ? headerColor(theme) : undefined;
  const sections = getRenderableSections(data);
  const ink = onPaper(theme);
  return (
    <Page
      size="A4"
      style={{
        ...pageBase,
        // Every page starts below the same top inset the HTML print uses.
        paddingTop: pt(PAGE_INSET_PX),
        paddingBottom: pt(PAGE_PAD_Y_PX),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: pt(24),
          paddingHorizontal: pt(32),
          // Page 1 keeps the same top inset as every other page, like the
          // HTML print. A colour band instead runs up to the paper edge and
          // takes the inset inside itself, as sheet 1 does in the preview.
          ...(band
            ? {
                backgroundColor: band,
                marginTop: -pt(PAGE_INSET_PX),
                paddingTop: pt(PAGE_INSET_PX + 28),
                paddingBottom: pt(28),
              }
            : { paddingTop: pt(32) }),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.fontDisplay === "serif" ? PDF_SERIF : PDF_SANS,
              ...text(26),
              fontWeight: 600,
              color: band ? WHITE : headerColor(theme),
              letterSpacing: theme.headingStyle === "tracked" ? pt(26) * 0.025 : 0,
            }}
          >
            {data.basicInfo.name || "Your Name"}
          </Text>
          <View style={{ marginTop: pt(8) }}>
            <ContactLine info={data.basicInfo} color={band ? mixHex(WHITE, 85, band) : INK_SOFT} />
          </View>
        </View>
        {hasAvatar(data, theme) && (
          <Avatar
            name={data.basicInfo.name || "?"}
            photo={visiblePhoto(data)}
            fill={band ? mixHex(WHITE, 20, band) : theme.accent}
            size={pt(84)}
          />
        )}
      </View>

      <View
        style={{
          paddingHorizontal: pt(32),
          paddingTop: pt(band ? 24 : 20),
          // No bottom padding: the page's own bottom inset already reserves
          // the margin. Padding here trails the last section, and when that
          // section ends just above the inset react-pdf carries the padding
          // alone onto a new, blank page.
          gap: pt(theme.density === "compact" ? 16 : 20),
        }}
      >
        <Summary data={data} theme={theme} ink={ink} />
        {sections.map((key) => (
          <View key={key}>
            <PdfSection section={key} data={data} theme={theme} ink={ink} />
          </View>
        ))}
      </View>
    </Page>
  );
}

/* --------------------------------------------------------------- sidebar */

/** Rail share of the page width, as in SidebarLayout's 34/66 colgroup. */
const RAIL_SHARE = 0.34;
const PAGE_WIDTH_PT = 595.28;

function SidebarPages({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  const sections = getRenderableSections(data);
  const railSections = sections.filter((k) => NARROW_SECTION_KEYS.has(k));
  const mainSections = sections.filter((k) => !NARROW_SECTION_KEYS.has(k));
  const solid = theme.sidebarStyle === "solid";
  const right = theme.sidebarSide === "right";
  const railBg = railBackground(theme);
  // railBackground() may hand back a CSS color-mix() for tinted rails; the
  // PDF needs the resolved hex.
  const railFill = solid ? railBg : tintHex(theme.railColor ?? theme.accent, 8);
  const railInk = solid ? onRail(railFill) : onPaper(theme);
  const mainInk = onPaper(theme);
  const band = theme.darkHeader ? headerColor(theme) : undefined;
  const railWidth = PAGE_WIDTH_PT * RAIL_SHARE;
  const colPad = { paddingHorizontal: pt(PAGE_PAD_X_PX) };

  return (
    <Page
      size="A4"
      style={{
        ...pageBase,
        // 4% top and bottom inset on every sheet — the HTML's repeating
        // thead/tfoot bands (page 1's top comes from the column padding).
        paddingTop: pt(PAGE_PAD_Y_PX),
        paddingBottom: pt(PAGE_PAD_Y_PX),
      }}
    >
      {/* The rail colour, repeated full-height on every page — the PDF twin
          of the print stylesheet's fixed .resume-rail-print-fill strip, so
          the rail never stops short where a page's text runs out. */}
      <View
        fixed
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: railWidth,
          ...(right ? { right: 0 } : { left: 0 }),
          backgroundColor: railFill,
        }}
      />

      {band && (
        <View
          style={{
            marginTop: -pt(PAGE_PAD_Y_PX),
            backgroundColor: band,
            paddingVertical: pt(PAGE_PAD_Y_PX),
            paddingHorizontal: pt(PAGE_PAD_X_PX * 2),
            flexDirection: "row",
            alignItems: "center",
            gap: pt(24),
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: theme.fontDisplay === "serif" ? PDF_SERIF : PDF_SANS,
                ...text(24),
                fontWeight: 600,
                color: WHITE,
              }}
            >
              {data.basicInfo.name || "Your Name"}
            </Text>
            <View style={{ marginTop: pt(6) }}>
              <ContactLine info={data.basicInfo} color={mixHex(WHITE, 85, band)} />
            </View>
          </View>
          {hasAvatar(data, theme) && (
            <Avatar name={data.basicInfo.name || "?"} photo={visiblePhoto(data)} fill={mixHex(WHITE, 20, band)} size={pt(76)} />
          )}
        </View>
      )}

      <View
        style={{
          flexDirection: right ? "row-reverse" : "row",
          // Under a name band the columns take page 1's top inset themselves.
          paddingTop: band ? pt(PAGE_PAD_Y_PX) : 0,
        }}
      >
        <View style={{ width: railWidth, ...colPad, gap: pt(20), color: railInk.strong }}>
          {!band && (
            <View style={{ alignItems: "flex-start", gap: pt(12) }}>
              {hasAvatar(data, theme) && (
                <Avatar
                  name={data.basicInfo.name || "?"}
                  photo={visiblePhoto(data)}
                  fill={solid ? mixHex(WHITE, 20, railFill) : theme.accent}
                  size={pt(72)}
                />
              )}
              <Text
                style={{
                  fontFamily: theme.fontDisplay === "serif" ? PDF_SERIF : PDF_SANS,
                  ...text(19),
                  fontWeight: 600,
                  color: solid ? WHITE : headerColor(theme),
                }}
              >
                {data.basicInfo.name || "Your Name"}
              </Text>
              <ContactLine info={data.basicInfo} color={solid ? mixHex(WHITE, 85, railFill) : INK_SOFT} stacked />
            </View>
          )}
          {railSections.map((key) => (
            <View key={key}>
              <PdfSection section={key} data={data} theme={theme} ink={railInk} />
            </View>
          ))}
        </View>
        <View style={{ width: PAGE_WIDTH_PT - railWidth, ...colPad, gap: pt(20) }}>
          <Summary data={data} theme={theme} ink={mainInk} />
          {mainSections.map((key) => (
            <View key={key}>
              <PdfSection section={key} data={data} theme={theme} ink={mainInk} />
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

/* ------------------------------------------------------------ two column */

/** Top/bottom band on every sheet of the two-column family (print's 56px
 * repeating thead/tfoot). Page 1's header sits higher, at the layout's own
 * 28px (py-7) padding. */
const SPLIT_BAND_PX = 56;
const SPLIT_TOP_PX = 28;

function TwoColumnPages({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  const sections = getRenderableSections(data);
  const narrow = sections.filter((k) => NARROW_SECTION_KEYS.has(k));
  const wide = sections.filter((k) => !NARROW_SECTION_KEYS.has(k));
  const ink = onPaper(theme);

  return (
    <Page
      size="A4"
      style={{
        ...pageBase,
        paddingTop: pt(SPLIT_BAND_PX),
        paddingBottom: pt(SPLIT_BAND_PX),
        paddingHorizontal: pt(32),
      }}
    >
      <View
        style={{
          marginTop: -pt(SPLIT_BAND_PX - SPLIT_TOP_PX),
          flexDirection: "row",
          alignItems: "center",
          gap: pt(20),
          borderBottomWidth: pt(2),
          borderBottomColor: theme.accent,
          paddingBottom: pt(12),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ ...text(25), fontWeight: 600, letterSpacing: -pt(25) * 0.025, color: headerColor(theme) }}>
            {data.basicInfo.name || "Your Name"}
          </Text>
          <View style={{ marginTop: pt(6) }}>
            <ContactLine info={data.basicInfo} color={INK_SOFT} />
          </View>
        </View>
        {hasAvatar(data, theme) && (
          <Avatar name={data.basicInfo.name || "?"} photo={visiblePhoto(data)} fill={theme.accent} size={pt(76)} />
        )}
      </View>

      <View style={{ marginTop: pt(20), flexDirection: "row" }}>
        <View style={{ width: "32%", borderRightWidth: pt(1), borderRightColor: RULE, paddingRight: pt(20), gap: pt(16) }}>
          {narrow.map((key) => (
            <View key={key}>
              <PdfSection section={key} data={data} theme={theme} ink={ink} preferInline />
            </View>
          ))}
        </View>
        <View style={{ width: "68%", paddingLeft: pt(4), gap: pt(16) }}>
          <Summary data={data} theme={theme} ink={ink} />
          {wide.map((key) => (
            <View key={key}>
              <PdfSection section={key} data={data} theme={theme} ink={ink} />
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

/* --------------------------------------------------------------- labeled */

/** Label column: `minmax(7.5rem, 22%)` of the 730px content width. */
const LABEL_COLUMN_PX = Math.max(120, (794 - 64) * 0.22);

function LabeledPages({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  const sections = getRenderableSections(data);
  const ink = onPaper(theme);
  const info = data.basicInfo;
  const hasContact = Boolean(
    info.location || info.email || info.phone || info.links.linkedin || info.links.github || info.links.portfolio,
  );
  const rows: { key: string; title: string; body: ReactNode }[] = [];
  if (hasContact) rows.push({ key: "contact", title: "Personal Information", body: <ContactGrid info={info} /> });
  if (hasSummary(data)) {
    rows.push({
      key: "summary",
      title: "Profile",
      body: <Text style={{ ...text(12.5), lineHeight: 1.625 }}>{data.sections.summary}</Text>,
    });
  }
  for (const key of sections) {
    rows.push({
      key,
      title: key === "experience" ? "Work experience" : resumeSectionTitle(key, data),
      body: <PdfSection section={key} data={data} theme={theme} ink={ink} hideHeading />,
    });
  }

  return (
    <Page
      size="A4"
      style={{
        ...pageBase,
        // The whole CV takes the template's face, not only the name.
        fontFamily: theme.fontDisplay === "serif" ? PDF_SERIF : PDF_SANS,
        paddingTop: pt(PAGE_INSET_PX),
        paddingBottom: pt(PAGE_PAD_Y_PX),
        paddingHorizontal: pt(32),
      }}
    >
      <View style={{ paddingTop: pt(32), alignItems: "center", gap: pt(12) }}>
        {hasAvatar(data, theme) && (
          <Avatar name={info.name || "?"} photo={visiblePhoto(data)} fill={theme.accent} size={pt(72)} />
        )}
        <Text style={{ ...text(26), fontWeight: 600, letterSpacing: -pt(26) * 0.025, color: headerColor(theme), textAlign: "center" }}>
          {info.name || "Your Name"}
        </Text>
      </View>

      <View style={{ marginTop: pt(24), gap: pt(theme.density === "compact" ? 16 : 20) }}>
        {rows.map((row, i) => (
          // The keep-with-next rule sits on the label, not the row: on the
          // row (a whole section) react-pdf moved the entire section to the
          // next page whenever it didn't fit, stranding most of a page.
          <View key={row.key} style={{ flexDirection: "row", columnGap: pt(24) }}>
            <Text minPresenceAhead={pt(40)} style={{ width: pt(LABEL_COLUMN_PX), paddingTop: pt(2), ...text(13, 1.375), fontWeight: 600 }}>
              {row.title}
            </Text>
            <View
              style={{
                flex: 1,
                // A hairline over every section's content after the first.
                ...(i > 0 ? { borderTopWidth: pt(1), borderTopColor: INK_FAINT, paddingTop: pt(16) } : {}),
              }}
            >
              {row.body}
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}

/** The labeled CV's Personal Information row: contact items in two columns. */
function ContactGrid({ info }: { info: BasicInfo }) {
  const items = contactItems(info);
  if (items.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: pt(6) }}>
      {items.map((item, i) => (
        <View key={i} style={{ width: "50%", paddingRight: pt(12), flexDirection: "row", alignItems: "flex-start", gap: pt(6) }}>
          <View style={{ marginTop: pt(2) }}>
            <PdfIcon name={item.icon} size={pt(14)} color={INK_SOFT} opacity={0.8} />
          </View>
          <Text style={{ flex: 1, ...text(12), color: INK_SOFT }}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- pieces */

export function Summary({ data, theme, ink }: { data: ResumeData; theme: TemplateTheme; ink: Ink }) {
  if (!hasSummary(data)) return null;
  return (
    <View>
      <SectionHeading theme={theme} section="summary" title={SUMMARY_COPY.label} ink={ink} />
      <Text style={{ ...text(12.5), lineHeight: 1.625, color: ink.strong }}>{data.sections.summary}</Text>
    </View>
  );
}

function formatPhone(info: BasicInfo): string {
  return `${info.phoneCountryCode || DEFAULT_DIAL_CODE} ${info.phone}`;
}

export function contactItems(info: BasicInfo): { icon: IconName; text: string }[] {
  return [
    info.location && { icon: "pin" as const, text: info.location },
    info.email && { icon: "mail" as const, text: info.email },
    info.phone && { icon: "phone" as const, text: formatPhone(info) },
    info.links.linkedin && { icon: "linkedin" as const, text: info.links.linkedin },
    info.links.github && { icon: "github" as const, text: info.links.github },
    info.links.portfolio && { icon: "globe" as const, text: info.links.portfolio },
  ].filter(Boolean) as { icon: IconName; text: string }[];
}

export function ContactLine({ info, color, stacked = false }: { info: BasicInfo; color: string; stacked?: boolean }) {
  const items = contactItems(info);
  if (items.length === 0) return null;
  return (
    <View
      style={
        stacked
          ? { flexDirection: "column", alignSelf: "stretch", rowGap: pt(4) }
          : { flexDirection: "row", flexWrap: "wrap", columnGap: pt(12), rowGap: pt(4) }
      }
    >
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: pt(4) }}>
          <View style={{ marginTop: pt(2) }}>
            <PdfIcon name={item.icon} size={pt(12)} color={color} opacity={0.8} />
          </View>
          <Text style={{ ...text(12), color, ...(stacked ? { flex: 1 } : {}) }}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

export function Avatar({ name, photo, fill, size }: { name: string; photo?: string; fill: string; size: number }) {
  if (photo) {
    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF drawing primitive, not an <img>; it takes no alt
    return <Image src={photo} style={{ width: size, height: size, borderRadius: size / 2, objectFit: "cover" }} />;
  }
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: WHITE, fontWeight: 600, fontSize: Math.round(size * 0.28) }}>{initials}</Text>
    </View>
  );
}

export function SectionHeading({ theme, section, title, ink }: { theme: TemplateTheme; section: SectionKey; title: string; ink: Ink }) {
  const { accent, headingStyle, italicHeadings } = theme;
  const color = ink.light ? WHITE : accent;
  const titleStyle: Style = {
    ...text(12.5),
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: pt(12.5) * (headingStyle === "tracked" ? 0.2 : headingStyle === "plain" ? 0 : 0.025),
    fontStyle: italicHeadings ? "italic" : "normal",
    color,
  };
  // Headings never end a page on their own — the HTML print does the same
  // with `break-after: avoid`.
  const keep = { marginBottom: pt(8), minPresenceAhead: pt(40) };
  const iconName = SECTION_ICON_NAMES[section];

  switch (headingStyle) {
    case "icon":
      return (
        <View
          minPresenceAhead={keep.minPresenceAhead}
          style={{
            marginBottom: keep.marginBottom,
            flexDirection: "row",
            alignItems: "center",
            gap: pt(6),
            borderBottomWidth: pt(1),
            borderBottomColor: ink.light ? mixHex(WHITE, 35, ink.surface) : tintHex(accent, 35),
            paddingBottom: pt(4),
          }}
        >
          {iconName && <PdfIcon name={iconName} size={pt(14)} color={color} />}
          <Text style={titleStyle}>{title}</Text>
        </View>
      );
    case "rule-partial":
      return (
        <View minPresenceAhead={keep.minPresenceAhead} style={{ marginBottom: keep.marginBottom }}>
          <Text style={titleStyle}>{title}</Text>
          <View style={{ marginTop: pt(4), height: pt(2), width: pt(36), backgroundColor: color }} />
        </View>
      );
    case "rule-full":
      return (
        <View
          minPresenceAhead={keep.minPresenceAhead}
          style={{ marginBottom: keep.marginBottom, borderBottomWidth: pt(2), borderBottomColor: color, paddingBottom: pt(4) }}
        >
          <Text style={titleStyle}>{title}</Text>
        </View>
      );
    case "boxed":
      return (
        <View
          minPresenceAhead={keep.minPresenceAhead}
          style={{
            marginBottom: keep.marginBottom,
            alignSelf: "flex-start",
            backgroundColor: ink.light ? mixHex(WHITE, 16, ink.surface) : tintHex(accent, 16),
            paddingHorizontal: pt(8),
            paddingVertical: pt(2),
            borderRadius: pt(4),
          }}
        >
          <Text style={titleStyle}>{title}</Text>
        </View>
      );
    case "tracked-rule":
      return (
        // The hairline runs the full width behind the title, which masks it
        // with the paper colour — no stretching flex child (react-pdf can
        // divide by a zero-height fragment for one at a page break).
        <View minPresenceAhead={keep.minPresenceAhead} style={{ marginBottom: pt(10) }}>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: pt(8),
              height: pt(1),
              backgroundColor: ink.light ? mixHex(WHITE, 35, ink.surface) : tintHex(accent, 22),
            }}
          />
          <Text
            wrap={false}
            style={{
              alignSelf: "flex-start",
              paddingRight: pt(12),
              backgroundColor: ink.surface,
              ...text(11),
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: pt(11) * 0.28,
              color,
            }}
          >
            {title}
          </Text>
        </View>
      );
    case "serif-title":
      return (
        <View minPresenceAhead={keep.minPresenceAhead} style={{ marginBottom: pt(10) }}>
          <Text
            style={{
              ...text(17, 1.25),
              fontFamily: theme.displayFont ? PDF_DISPLAY[theme.displayFont] : undefined,
              fontWeight: 600,
              color: ink.light ? WHITE : headerColor(theme),
            }}
          >
            {title}
          </Text>
        </View>
      );
    case "centered":
      return (
        <View
          minPresenceAhead={keep.minPresenceAhead}
          style={{ marginBottom: pt(10), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: pt(12) }}
        >
          <View style={{ width: pt(40), height: pt(1), backgroundColor: tintHex(accent, 45) }} />
          <Text style={{ ...text(11.5), fontWeight: 600, textTransform: "uppercase", letterSpacing: pt(11.5) * 0.24, color }}>
            {title}
          </Text>
          <View style={{ width: pt(40), height: pt(1), backgroundColor: tintHex(accent, 45) }} />
        </View>
      );
    case "code":
      return (
        <View minPresenceAhead={keep.minPresenceAhead} style={{ marginBottom: pt(10) }}>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: pt(9),
              height: 0,
              borderTopWidth: pt(1),
              borderTopStyle: "dashed",
              borderTopColor: tintHex(headerColor(theme), 22),
            }}
          />
          <Text
            wrap={false}
            style={{
              alignSelf: "flex-start",
              paddingRight: pt(10),
              backgroundColor: ink.surface,
              ...text(12),
              fontFamily: PDF_DISPLAY.mono,
              fontWeight: 600,
              color: headerColor(theme),
            }}
          >
            <Text style={{ color: accent }}>~/</Text>
            {title.toLowerCase()}
          </Text>
        </View>
      );
    case "bar":
      return (
        <View
          minPresenceAhead={keep.minPresenceAhead}
          style={{ marginBottom: pt(10), borderLeftWidth: pt(3), borderLeftColor: accent, paddingLeft: pt(10) }}
        >
          <Text
            style={{ ...text(11.5), fontWeight: 600, textTransform: "uppercase", letterSpacing: pt(11.5) * 0.2, color: headerColor(theme) }}
          >
            {title}
          </Text>
        </View>
      );
    case "tile":
      return (
        <View
          minPresenceAhead={keep.minPresenceAhead}
          style={{ marginBottom: pt(10), flexDirection: "row", alignItems: "center", gap: pt(8) }}
        >
          <View style={{ width: pt(8), height: pt(8), borderRadius: pt(2), backgroundColor: accent }} />
          <Text
            style={{
              ...text(12),
              fontFamily: theme.displayFont ? PDF_DISPLAY[theme.displayFont] : undefined,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: pt(12) * 0.14,
              color: headerColor(theme),
            }}
          >
            {title}
          </Text>
        </View>
      );
    case "tracked":
    case "plain":
    default:
      return (
        <View minPresenceAhead={keep.minPresenceAhead} style={{ marginBottom: keep.marginBottom }}>
          <Text style={titleStyle}>{title}</Text>
        </View>
      );
  }
}

/** Title-and-date row shared by education, experience and additional. Kept
 * together with the first line under it so a role never ends a page alone. */
export function EntryHeader({ title, date, ink }: { title: ReactNode; date?: string; ink: Ink }) {
  return (
    <View
      wrap={false}
      minPresenceAhead={pt(18)}
      style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", columnGap: pt(12) }}
    >
      <Text style={{ ...text(13), fontWeight: 600, color: ink.strong }}>{title}</Text>
      {date ? <Text style={{ ...text(11.5), color: ink.faint }}>{date}</Text> : null}
    </View>
  );
}

export function Bullets({ items, theme, ink, first = false }: { items: string[]; theme: TemplateTheme; ink: Ink; first?: boolean }) {
  const cleaned = items.filter(Boolean);
  if (cleaned.length === 0) return null;
  const kind = bulletKind(theme);
  return (
    <View style={{ marginTop: first ? 0 : pt(4), gap: pt(2) }}>
      {cleaned.map((item, i) => (
        // One unit: react-pdf splits a row's children independently, so a
        // bullet whose text didn't fit left its mark alone at the foot of the
        // page and started the next one with an unmarked line.
        <View key={i} wrap={false} style={{ flexDirection: "row", gap: pt(6) }}>
          <View style={{ marginTop: pt(12 * 0.35) }}>
            <PdfBullet kind={kind} size={pt(8)} color={ink.mark} />
          </View>
          <Text style={{ flex: 1, ...text(12), lineHeight: 1.375, color: ink.strong }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function itemGap(theme: TemplateTheme) {
  return pt(theme.density === "compact" ? 10 : 14);
}

export function displayLink(url: string) {
  return url.replace(/^https?:\/\//, "");
}

export function PdfSection({
  section,
  data,
  theme,
  ink,
  preferInline = false,
  hideHeading = false,
}: {
  section: SectionKey;
  data: ResumeData;
  theme: TemplateTheme;
  ink: Ink;
  /** Chip lists as one inline line — the two-column layout's narrow column. */
  preferInline?: boolean;
  /** The layout draws the title itself (the labeled CV's label column). */
  hideHeading?: boolean;
}) {
  const title = resumeSectionTitle(section, data);
  const heading = hideHeading ? null : <SectionHeading theme={theme} section={section} title={title} ink={ink} />;
  const compact = preferInline || theme.density === "compact";
  const s = data.sections;

  switch (section) {
    case "summary":
      return null;
    case "keyAchievements":
      return (
        <>
          {heading}
          <Bullets items={s.keyAchievements!} theme={theme} ink={ink} first />
        </>
      );
    case "education":
      return (
        <>
          {heading}
          <View style={{ gap: itemGap(theme) }}>
            {s.education!.map((edu, i) => (
              <View key={i} wrap={false}>
                <EntryHeader title={edu.institution} date={formatDateRange(edu.startDate, edu.endDate)} ink={ink} />
                {/* One string: separate text children let react-pdf break a
                    line before the comma (", Computer Architecture"). */}
                <Text style={{ ...text(12), color: ink.soft }}>
                  {`${edu.degree}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}${edu.gpa ? ` · GPA ${edu.gpa}` : ""}`}
                </Text>
                {edu.coursework && edu.coursework.length > 0 && (
                  <Text style={{ marginTop: pt(2), ...text(11.5), color: ink.faint }}>
                    <Text style={{ fontWeight: 500, color: ink.soft }}>Coursework: </Text>
                    {edu.coursework.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </>
      );
    case "experience":
    case "internships":
    case "partTime":
      return (
        <>
          {heading}
          <View style={{ gap: itemGap(theme) }}>
            {s[section]!.map((exp, i) => (
              // Fragmentable, like the HTML: a long role splits across pages
              // between bullets instead of jumping whole to the next sheet.
              <View key={i}>
                <EntryHeader
                  title={
                    <>
                      {exp.role}
                      <Text style={{ fontWeight: 400, color: ink.soft }}>{exp.company ? ` ${exp.company}` : ""}</Text>
                    </>
                  }
                  date={formatDateRange(exp.startDate, exp.endDate, isCurrentExperience(exp))}
                  ink={ink}
                />
                <Bullets items={exp.bullets} theme={theme} ink={ink} />
              </View>
            ))}
          </View>
        </>
      );
    case "projects":
      return (
        <>
          {heading}
          <View style={{ gap: itemGap(theme) }}>
            {s.projects!.map((project, i) => (
              <View key={i}>
                <View
                  wrap={false}
                  minPresenceAhead={pt(18)}
                  style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: pt(8) }}
                >
                  <Text style={{ ...text(13), fontWeight: 600, color: ink.strong }}>{project.name}</Text>
                  {project.link && (
                    <Link src={project.link} style={{ ...text(11), color: ink.mark, textDecoration: "underline" }}>
                      {displayLink(project.link)}
                    </Link>
                  )}
                </View>
                <Text style={{ ...text(12), lineHeight: 1.375, color: ink.strong }}>{project.description}</Text>
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={{ marginTop: pt(2), ...text(11), color: ink.faint }}>{project.technologies.join(" · ")}</Text>
                )}
              </View>
            ))}
          </View>
        </>
      );
    case "skills":
    case "hobbies":
    case "softSkills":
      return (
        <>
          {heading}
          <ChipOrInline items={s[section]!} accent={theme.accent} inline={compact || ink.light} ink={ink} />
        </>
      );
    case "certifications":
      return (
        <>
          {heading}
          <View style={{ gap: pt(6) }}>
            {s.certifications!.map((cert, i) => (
              <View key={i} wrap={false} style={{ flexDirection: "row", alignItems: "flex-start", gap: pt(6) }}>
                <View style={{ marginTop: pt(2) }}>
                  <PdfIcon name="certification" size={pt(12)} color={ink.faint} />
                </View>
                <Text style={{ flex: 1, ...text(12), color: ink.strong }}>
                  <Text style={{ fontWeight: 600 }}>{cert.name}</Text> — {cert.issuer}
                  <Text style={{ color: ink.faint }}> · {formatMonth(cert.date)}</Text>
                </Text>
              </View>
            ))}
          </View>
        </>
      );
    case "patents":
      return (
        <>
          {heading}
          <View style={{ gap: pt(6) }}>
            {s.patents!.map((patent, i) => (
              <View key={i} wrap={false}>
                <Text style={{ ...text(12), fontWeight: 600, color: ink.strong }}>{patent.title}</Text>
                <Text style={{ ...text(12), color: ink.soft }}>
                  {[patent.number, patent.office, patent.date ? formatMonth(patent.date) : ""].filter(Boolean).join(" · ")}
                  {patent.link && (
                    <>
                      {" · "}
                      <Link src={patent.link} style={{ color: ink.mark, textDecoration: "underline" }}>
                        {displayLink(patent.link)}
                      </Link>
                    </>
                  )}
                </Text>
              </View>
            ))}
          </View>
        </>
      );
    case "languages":
      return (
        <>
          {heading}
          <View style={{ gap: pt(2) }}>
            {s.languages!.map((lang, i) => (
              <Text key={i} wrap={false} style={{ ...text(12), color: ink.strong }}>
                <Text style={{ fontWeight: 600 }}>{lang.name}</Text>
                <Text style={{ color: ink.faint }}> — {lang.level}</Text>
              </Text>
            ))}
          </View>
        </>
      );
    case "additional":
      return (
        <>
          {heading}
          <View style={{ gap: itemGap(theme) }}>
            {s.additional!.items.map((item, i) => (
              <View key={i} wrap={false}>
                <EntryHeader
                  title={
                    <>
                      {item.title}
                      {item.subtitle ? <Text style={{ fontWeight: 400, color: ink.soft }}> · {item.subtitle}</Text> : null}
                    </>
                  }
                  date={item.date}
                  ink={ink}
                />
                <Bullets items={item.bullets} theme={theme} ink={ink} />
              </View>
            ))}
          </View>
        </>
      );
  }
}

export function ChipOrInline({ items, accent, inline, ink }: { items: string[]; accent: string; inline: boolean; ink: Ink }) {
  if (inline) {
    return <Text style={{ ...text(12), lineHeight: 1.625, color: ink.strong }}>{items.join("  ·  ")}</Text>;
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: pt(6) }}>
      {items.map((item, i) => (
        // wrap={false}: a chip is one unit. Split by a page break, its
        // background stayed at the foot of the page as an empty pill and its
        // label started the next page on a torn half.
        <Text
          key={i}
          wrap={false}
          style={{
            ...text(11),
            fontWeight: 500,
            color: accent,
            backgroundColor: tintHex(accent, 14),
            paddingHorizontal: pt(8),
            paddingVertical: pt(2),
            borderRadius: 999,
          }}
        >
          {item}
        </Text>
      ))}
    </View>
  );
}

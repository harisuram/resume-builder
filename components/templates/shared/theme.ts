export type LayoutKind = "single" | "sidebar" | "asymmetric";
export type HeadingStyle = "plain" | "icon" | "rule-partial" | "rule-full" | "boxed" | "tracked";

export interface TemplateTheme {
  id: string;
  name: string;
  source: string;
  description: string;
  layout: LayoutKind;
  sidebarSide?: "left" | "right";
  accent: string;
  headingStyle: HeadingStyle;
  density: "compact" | "relaxed";
  fontDisplay: "serif" | "sans";
  darkHeader?: boolean;
  showAvatar?: boolean;
  supportsDarkToggle?: boolean;
  italicHeadings?: boolean;
  /** For layout "sidebar": a bold solid-color block (white text) vs a pale
   * tint of the accent (dark text). Defaults to "tint". */
  sidebarStyle?: "solid" | "tint";
}

/** A light tint of the accent, mixed at render time — avoids hand-picking a
 * second hex per template just to get a chip/sidebar background. */
export function tint(accent: string, weight = 12) {
  return `color-mix(in srgb, ${accent} ${weight}%, white)`;
}

export const TEMPLATES: TemplateTheme[] = [
  {
    id: "jakes-resume",
    name: "Atlas",
    source: "Inspired by jakegut/resume (MIT)",
    description: "Classic engineering column",
    layout: "single",
    accent: "#1B1812",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "bre-cool",
    name: "Harbor",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Calm steel-blue titles",
    layout: "single",
    accent: "#2F5D8A",
    headingStyle: "tracked",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "bre-creative",
    name: "Ember",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Warm coral sidebar",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#D9713C",
    headingStyle: "icon",
    density: "relaxed",
    fontDisplay: "sans",
    showAvatar: true,
    sidebarStyle: "solid",
  },
  {
    id: "bre-green",
    name: "Grove",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Quiet green serif",
    layout: "single",
    accent: "#3F6B4F",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "bre-purple",
    name: "Violet",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Boxed violet titles",
    layout: "single",
    accent: "#6A4C93",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "bre-sidebar",
    name: "Slate",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Compact slate rail",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#3A4750",
    headingStyle: "rule-partial",
    density: "compact",
    fontDisplay: "sans",
    sidebarStyle: "solid",
  },
  {
    id: "bre-leftright",
    name: "Aisle",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Right-hand details rail",
    layout: "sidebar",
    sidebarSide: "right",
    accent: "#8A6240",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "bre-material-dark",
    name: "Marquee",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Gold name band",
    layout: "single",
    accent: "#C9932F",
    headingStyle: "rule-full",
    density: "relaxed",
    fontDisplay: "sans",
    darkHeader: true,
  },
  {
    id: "bre-oblique",
    name: "Lean",
    source: "Inspired by best-resume-ever (MIT)",
    description: "Italic orange titles",
    layout: "single",
    accent: "#B5522A",
    headingStyle: "tracked",
    density: "relaxed",
    fontDisplay: "serif",
    italicHeadings: true,
  },
  {
    id: "start-bootstrap-resume",
    name: "Navy",
    source: "Inspired by StartBootstrap/startbootstrap-resume (MIT)",
    description: "Navy photo sidebar",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#26415E",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "sans",
    showAvatar: true,
  },
  {
    id: "deedy-reversed",
    name: "Twin",
    source: "Inspired by ZDTaylor/Deedy-Resume-Reversed (Apache-2.0)",
    description: "Dense two columns",
    layout: "asymmetric",
    accent: "#7A2E2E",
    headingStyle: "tracked",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "billryan",
    name: "Glyph",
    source: "Inspired by billryan/resume (MIT)",
    description: "Serif with heading marks",
    layout: "single",
    accent: "#46637A",
    headingStyle: "icon",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "online-resume",
    name: "Folio",
    source: "Inspired by tarrex/online-resume (MIT)",
    description: "Print-first and clean",
    layout: "single",
    accent: "#22333B",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "simple-cv",
    name: "Index",
    source: "Inspired by dcetin/Simple-CV (MIT)",
    description: "High-density serif",
    layout: "single",
    accent: "#33322E",
    headingStyle: "plain",
    density: "compact",
    fontDisplay: "serif",
  },
  {
    id: "rendercv-classic",
    name: "Thesis",
    source: "Inspired by sinaatalay/rendercv (MIT)",
    description: "Traditional academic",
    layout: "single",
    accent: "#1D3557",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "rendercv-sb2nov",
    name: "Spine",
    source: "Inspired by sinaatalay/rendercv (MIT)",
    description: "Full-width title rules",
    layout: "single",
    accent: "#23486B",
    headingStyle: "rule-full",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "rendercv-moderncv",
    name: "Campus",
    source: "Inspired by sinaatalay/rendercv (MIT)",
    description: "Teal header and sidebar",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#2F5D55",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "sans",
    darkHeader: true,
  },
  {
    id: "rendercv-engineering",
    name: "Gauge",
    source: "Inspired by sinaatalay/rendercv (MIT)",
    description: "Compact engineering",
    layout: "single",
    accent: "#41454c",
    headingStyle: "tracked",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "jsonresume-flat",
    name: "Air",
    source: "Inspired by erming/jsonresume-theme-flat (MIT)",
    description: "Light and scannable",
    layout: "single",
    accent: "#4A6FA5",
    headingStyle: "plain",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "jsonresume-vitae",
    name: "Vitae",
    source: "Inspired by jsonresume-theme-vitae (MIT)",
    description: "Clean, with light/dark",
    layout: "single",
    accent: "#4A4A4A",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "sans",
    supportsDarkToggle: true,
  },
  {
    id: "jsonresume-futura",
    name: "Nova",
    source: "Inspired by jsonresume-theme-futura (MIT)",
    description: "Boxed gold titles",
    layout: "single",
    accent: "#A67C00",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "sans",
  },
];

export function getTheme(id: string): TemplateTheme {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

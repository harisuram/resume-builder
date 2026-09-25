export type LayoutKind = "single" | "sidebar" | "asymmetric" | "labeled";
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
  /** Second colour for two-tone templates: the name band (with darkHeader)
   * or the name itself. Headings, rules and chips keep `accent`. Defaults
   * to `accent`. */
  headerColor?: string;
  /** Colour the sidebar rail is tinted from. Defaults to `accent`. */
  railColor?: string;
}

export function headerColor(theme: TemplateTheme): string {
  return theme.headerColor ?? theme.accent;
}

export function railBackground(theme: TemplateTheme): string {
  const base = theme.railColor ?? theme.accent;
  return theme.sidebarStyle === "solid" ? base : tint(base, 8);
}

/** A light tint of the accent, mixed at render time — avoids hand-picking a
 * second hex per template just to get a chip/sidebar background. */
export function tint(accent: string, weight = 12) {
  return `color-mix(in srgb, ${accent} ${weight}%, white)`;
}

/* Display order for the gallery, home strip, picker and rail. Mixed on
 * purpose so neighbours differ in layout and colour — never two sidebars in
 * a row, at most two single columns in a row. Atlas stays first: it's the
 * default and the fallback for unknown ids. */
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
    id: "tidewater",
    name: "Tidewater",
    source: "Original layout",
    description: "Navy band, terracotta titles",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#AE472F",
    headerColor: "#0F2A44",
    railColor: "#0F2A44",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "sans",
    darkHeader: true,
  },
  {
    id: "prism",
    name: "Prism",
    source: "Original layout",
    description: "Indigo split with photo",
    layout: "asymmetric",
    accent: "#3F3D9B",
    headingStyle: "icon",
    density: "relaxed",
    fontDisplay: "sans",
    showAvatar: true,
  },
  {
    id: "oxford",
    name: "Oxford",
    source: "Original layout",
    description: "Navy name, crimson titles",
    layout: "single",
    accent: "#B23A48",
    headerColor: "#1D3557",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
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
    id: "plum",
    name: "Plum",
    source: "Original layout",
    description: "Aubergine band, rose titles",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#B83A72",
    headerColor: "#3B1F4A",
    railColor: "#3B1F4A",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "serif",
    darkHeader: true,
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
    id: "copper",
    name: "Copper",
    source: "Original layout",
    description: "Warm copper name band",
    layout: "single",
    accent: "#A65D32",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "serif",
    darkHeader: true,
  },
  {
    id: "pacific",
    name: "Pacific",
    source: "Original layout",
    description: "Ocean photo sidebar",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#0A6B7C",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "sans",
    showAvatar: true,
    sidebarStyle: "solid",
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
    id: "dossier",
    name: "Dossier",
    source: "Original layout",
    description: "Label-rail European CV",
    layout: "labeled",
    accent: "#8B6F47",
    headingStyle: "rule-full",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "regent",
    name: "Regent",
    source: "Original layout",
    description: "Indigo band, gold titles",
    layout: "single",
    accent: "#9C6B00",
    headerColor: "#2A2350",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
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
    id: "evergreen",
    name: "Evergreen",
    source: "Original layout",
    description: "Forest band, ochre titles",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#8C5A12",
    headerColor: "#1F3D36",
    railColor: "#1F3D36",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "sans",
    darkHeader: true,
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
    id: "laurel",
    name: "Laurel",
    source: "Original layout",
    description: "Pine name, sienna titles",
    layout: "single",
    accent: "#A0522D",
    headerColor: "#2F4F3E",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "atelier",
    name: "Atelier",
    source: "Original layout",
    description: "Portrait burgundy rail",
    layout: "sidebar",
    sidebarSide: "right",
    accent: "#8B2942",
    headingStyle: "icon",
    density: "relaxed",
    fontDisplay: "serif",
    showAvatar: true,
    sidebarStyle: "solid",
  },
  {
    id: "summit",
    name: "Summit",
    source: "Original layout",
    description: "Executive navy column",
    layout: "single",
    accent: "#0B1F3A",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "sans",
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
    id: "mulberry",
    name: "Mulberry",
    source: "Original layout",
    description: "Wine band, teal titles",
    layout: "single",
    accent: "#2F6F73",
    headerColor: "#5B1A3A",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
    darkHeader: true,
  },
  {
    id: "quill",
    name: "Quill",
    source: "Original layout",
    description: "Editorial italic serif",
    layout: "single",
    accent: "#1A5C45",
    headingStyle: "tracked",
    density: "relaxed",
    fontDisplay: "serif",
    italicHeadings: true,
  },
  {
    id: "lagoon",
    name: "Lagoon",
    source: "Original layout",
    description: "Slate band, teal right rail",
    layout: "sidebar",
    sidebarSide: "right",
    accent: "#0F766E",
    headerColor: "#1E293B",
    railColor: "#1E293B",
    headingStyle: "rule-partial",
    density: "compact",
    fontDisplay: "sans",
    darkHeader: true,
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
    id: "meridian",
    name: "Meridian",
    source: "Original layout",
    description: "Balanced two-column CV",
    layout: "asymmetric",
    accent: "#1E4D6B",
    headingStyle: "rule-partial",
    density: "compact",
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
    id: "inkwell",
    name: "Inkwell",
    source: "Original layout",
    description: "Midnight header rail",
    layout: "sidebar",
    sidebarSide: "left",
    accent: "#111827",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "sans",
    darkHeader: true,
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
    id: "ledger",
    name: "Ledger",
    source: "Original layout",
    description: "Tight charcoal finance",
    layout: "single",
    accent: "#25282B",
    headingStyle: "plain",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "sable",
    name: "Sable",
    source: "Original layout",
    description: "Espresso compact rail",
    layout: "sidebar",
    sidebarSide: "right",
    accent: "#3C241F",
    headingStyle: "boxed",
    density: "compact",
    fontDisplay: "serif",
  },
];

export function getTheme(id: string): TemplateTheme {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function isTemplateId(id: string): boolean {
  return TEMPLATES.some((t) => t.id === id);
}

export function layoutLabel(layout: LayoutKind): string {
  if (layout === "sidebar") return "Sidebar";
  if (layout === "asymmetric") return "Two column";
  if (layout === "labeled") return "Labeled";
  return "Single column";
}

/** Reads `?template=` from a query string. Unknown ids are ignored so a
 * mistyped or stale link can't silently fall back to the default theme. */
export function requestedTemplateId(search: string): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const id = new URLSearchParams(query).get("template");
  return id && isTemplateId(id) ? id : null;
}

/** Sidebar and two-column templates lay their columns out as a real table
 * (same model print uses). Any surface that renders one outside the builder's
 * paginated sheets has to opt into that model too — see
 * `PRINT_LAYOUT_SIM_CLASS`. */
export function isMultiColumnTemplate(id: string): boolean {
  const { layout } = getTheme(id);
  return layout === "sidebar" || layout === "asymmetric";
}

export type LayoutKind = "single" | "sidebar" | "asymmetric" | "labeled";
export type HeadingStyle =
  | "plain"
  | "icon"
  | "rule-partial"
  | "rule-full"
  | "boxed"
  | "tracked"
  /** Letter-spaced capitals followed by a hairline to the right edge. */
  | "tracked-rule"
  /** Title-case heading in the template's display face. */
  | "serif-title"
  /** Centred capitals between two short rules. */
  | "centered"
  /** `~/section` in monospace over a dashed rule. */
  | "code"
  /** Accent bar on the left of letter-spaced capitals. */
  | "bar"
  /** Small accent square before letter-spaced capitals. */
  | "tile";

/** A single-column template with its own header and section treatment.
 * Each one draws only the resume's existing fields. */
export type TemplateVariant =
  | "horizon"
  | "pivot"
  | "laureate"
  | "sterling"
  | "cameo"
  | "civic"
  | "kernel"
  | "tessera";

/** Display typeface for the name (and, for some heading styles, section
 * titles). Body text stays in the template's sans or serif. */
export type DisplayFont = "fraunces" | "playfair" | "cormorant" | "mono" | "syne";

export interface TemplateTheme {
  id: string;
  name: string;
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
  /** Single-column only: which bespoke header/section treatment to draw. */
  variant?: TemplateVariant;
  displayFont?: DisplayFont;
}

/** CSS stacks for the display faces (variables come from next/font in
 * app/layout.tsx). */
export const DISPLAY_FONT_CSS: Record<DisplayFont, string> = {
  fraunces: "var(--font-fraunces), Georgia, serif",
  playfair: "var(--font-playfair), Georgia, serif",
  cormorant: "var(--font-cormorant), Georgia, serif",
  mono: "var(--font-jetbrains-mono), ui-monospace, Menlo, monospace",
  syne: "var(--font-syne), var(--font-inter), system-ui, sans-serif",
};

/** Page ground for Tessera, whose sections sit on white cards. Shared by the
 * HTML layout and the PDF engine so both draw the same grey. */
export const TESSERA_GROUND = "#EEF1F6";
/** Kernel's code-card cursor and prompt colour (reads on the dark card). */
export const KERNEL_PROMPT = "#7EE2B8";
/** Civic's stripe under the band: accent, white, and this blue. */
export const CIVIC_BLUE = "#3C5A99";

/** Initials for Cameo's monogram ring — first and last word of the name. */
export function monogramInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Horizon sets the last word of the name in italic, in the second colour. */
export function splitLastWord(name: string): [string, string] {
  const trimmed = name.trim();
  const at = trimmed.lastIndexOf(" ");
  return at < 0 ? ["", trimmed] : [trimmed.slice(0, at), trimmed.slice(at + 1)];
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
    id: "atlas",
    name: "Atlas",
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
    description: "Navy name, crimson titles",
    layout: "single",
    accent: "#B23A48",
    headerColor: "#1D3557",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "ember",
    name: "Ember",
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
    id: "marquee",
    name: "Marquee",
    description: "Gold name band",
    layout: "single",
    accent: "#C9932F",
    headingStyle: "rule-full",
    density: "relaxed",
    fontDisplay: "sans",
    darkHeader: true,
  },
  {
    id: "horizon",
    name: "Horizon",
    description: "Timeline with copper dates",
    layout: "single",
    accent: "#0F4C4D",
    headerColor: "#A8662F",
    headingStyle: "tracked-rule",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "horizon",
    displayFont: "fraunces",
  },
  {
    id: "pacific",
    name: "Pacific",
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
    id: "grove",
    name: "Grove",
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
    id: "harbor",
    name: "Harbor",
    description: "Calm steel-blue titles",
    layout: "single",
    accent: "#2F5D8A",
    headingStyle: "tracked",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "pivot",
    name: "Pivot",
    description: "Midnight band, gold results",
    layout: "single",
    accent: "#8F6D2A",
    headerColor: "#121A2F",
    headingStyle: "serif-title",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "pivot",
    displayFont: "playfair",
  },
  {
    id: "dossier",
    name: "Dossier",
    description: "Label-rail European CV",
    layout: "labeled",
    accent: "#8B6F47",
    headingStyle: "rule-full",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "laureate",
    name: "Laureate",
    description: "Academic, oxblood rules",
    layout: "single",
    accent: "#6E2130",
    headerColor: "#1F1A17",
    headingStyle: "centered",
    density: "relaxed",
    fontDisplay: "serif",
    variant: "laureate",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Boxed violet titles",
    layout: "single",
    accent: "#6A4C93",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "twin",
    name: "Twin",
    description: "Dense two columns",
    layout: "asymmetric",
    accent: "#7A2E2E",
    headingStyle: "tracked",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "regent",
    name: "Regent",
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
    id: "lean",
    name: "Lean",
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
    id: "air",
    name: "Air",
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
    id: "sterling",
    name: "Sterling",
    description: "Executive, champagne rules",
    layout: "single",
    accent: "#8A6D33",
    headerColor: "#1C1C1E",
    headingStyle: "tracked-rule",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "sterling",
    displayFont: "cormorant",
  },
  {
    id: "summit",
    name: "Summit",
    description: "Executive navy column",
    layout: "single",
    accent: "#0B1F3A",
    headingStyle: "rule-full",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "slate",
    name: "Slate",
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
    id: "nova",
    name: "Nova",
    description: "Boxed gold titles",
    layout: "single",
    accent: "#A67C00",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "cameo",
    name: "Cameo",
    description: "Monogram ring, rose gold",
    layout: "single",
    accent: "#9A4F5B",
    headerColor: "#3D2233",
    headingStyle: "centered",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "cameo",
    displayFont: "cormorant",
  },
  {
    id: "meridian",
    name: "Meridian",
    description: "Balanced two-column CV",
    layout: "asymmetric",
    accent: "#1E4D6B",
    headingStyle: "rule-partial",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "quill",
    name: "Quill",
    description: "Editorial italic serif",
    layout: "single",
    accent: "#1A5C45",
    headingStyle: "tracked",
    density: "relaxed",
    fontDisplay: "serif",
    italicHeadings: true,
  },
  {
    id: "mulberry",
    name: "Mulberry",
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
    id: "aisle",
    name: "Aisle",
    description: "Right-hand details rail",
    layout: "sidebar",
    sidebarSide: "right",
    accent: "#8A6240",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "glyph",
    name: "Glyph",
    description: "Serif with heading marks",
    layout: "single",
    accent: "#46637A",
    headingStyle: "icon",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "civic",
    name: "Civic",
    description: "Navy band, tricolour stripe",
    layout: "single",
    accent: "#B22234",
    headerColor: "#0F2446",
    headingStyle: "bar",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "civic",
  },
  {
    id: "campus",
    name: "Campus",
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
    id: "nocturne",
    name: "Nocturne",
    description: "Clean, with light/dark",
    layout: "single",
    accent: "#4A4A4A",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "sans",
    supportsDarkToggle: true,
  },
  {
    id: "spine",
    name: "Spine",
    description: "Full-width title rules",
    layout: "single",
    accent: "#23486B",
    headingStyle: "rule-full",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "lagoon",
    name: "Lagoon",
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
    id: "gauge",
    name: "Gauge",
    description: "Compact engineering",
    layout: "single",
    accent: "#41454c",
    headingStyle: "tracked",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "kernel",
    name: "Kernel",
    description: "Code-card header, mono",
    layout: "single",
    accent: "#0B7352",
    headerColor: "#0D1117",
    headingStyle: "code",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "kernel",
    displayFont: "mono",
  },
  {
    id: "navy",
    name: "Navy",
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
    id: "folio",
    name: "Folio",
    description: "Print-first and clean",
    layout: "single",
    accent: "#22333B",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "sans",
  },
  {
    id: "index",
    name: "Index",
    description: "High-density serif",
    layout: "single",
    accent: "#33322E",
    headingStyle: "plain",
    density: "compact",
    fontDisplay: "serif",
  },
  {
    id: "inkwell",
    name: "Inkwell",
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
    id: "thesis",
    name: "Thesis",
    description: "Traditional academic",
    layout: "single",
    accent: "#1D3557",
    headingStyle: "rule-partial",
    density: "relaxed",
    fontDisplay: "serif",
  },
  {
    id: "tessera",
    name: "Tessera",
    description: "Sapphire cards on grey",
    layout: "single",
    accent: "#A35F00",
    headerColor: "#1B2B6B",
    headingStyle: "tile",
    density: "relaxed",
    fontDisplay: "sans",
    variant: "tessera",
    displayFont: "syne",
  },
  {
    id: "sable",
    name: "Sable",
    description: "Espresso compact rail",
    layout: "sidebar",
    sidebarSide: "right",
    accent: "#3C241F",
    headingStyle: "boxed",
    density: "compact",
    fontDisplay: "serif",
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "Tight charcoal finance",
    layout: "single",
    accent: "#25282B",
    headingStyle: "plain",
    density: "compact",
    fontDisplay: "sans",
  },
  {
    id: "copper",
    name: "Copper",
    description: "Warm copper name band",
    layout: "single",
    accent: "#A65D32",
    headingStyle: "boxed",
    density: "relaxed",
    fontDisplay: "serif",
    darkHeader: true,
  },
];

/** Ids templates had before they were renamed to match their display names.
 * Saved drafts and shared `?template=` links can still carry these, so they
 * resolve to the current id instead of silently falling back to the default. */
const RENAMED_TEMPLATE_IDS: Readonly<Record<string, string>> = {
  "jakes-resume": "atlas",
  "bre-cool": "harbor",
  "bre-creative": "ember",
  "bre-green": "grove",
  "bre-purple": "violet",
  "bre-sidebar": "slate",
  "bre-leftright": "aisle",
  "bre-material-dark": "marquee",
  "bre-oblique": "lean",
  "start-bootstrap-resume": "navy",
  "deedy-reversed": "twin",
  billryan: "glyph",
  "online-resume": "folio",
  "simple-cv": "index",
  "rendercv-classic": "thesis",
  "rendercv-sb2nov": "spine",
  "rendercv-moderncv": "campus",
  "rendercv-engineering": "gauge",
  "jsonresume-flat": "air",
  "jsonresume-vitae": "nocturne",
  "jsonresume-futura": "nova",
};

/** The current id for `id`, following a rename if there was one. */
export function canonicalTemplateId(id: string): string {
  return Object.hasOwn(RENAMED_TEMPLATE_IDS, id) ? RENAMED_TEMPLATE_IDS[id] : id;
}

export function getTheme(id: string): TemplateTheme {
  const current = canonicalTemplateId(id);
  return TEMPLATES.find((t) => t.id === current) ?? TEMPLATES[0];
}

export function isTemplateId(id: string): boolean {
  const current = canonicalTemplateId(id);
  return TEMPLATES.some((t) => t.id === current);
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
  return id && isTemplateId(id) ? canonicalTemplateId(id) : null;
}

/** Sidebar and two-column templates lay their columns out as a real table
 * (same model print uses). Any surface that renders one outside the builder's
 * paginated sheets has to opt into that model too — see
 * `PRINT_LAYOUT_SIM_CLASS`. */
export function isMultiColumnTemplate(id: string): boolean {
  const { layout } = getTheme(id);
  return layout === "sidebar" || layout === "asymmetric";
}

import { Font } from "@react-pdf/renderer";

/** The resume's two families, embedded as static TTFs from
 * `public/fonts/pdf/` (Latin + Latin Extended subsets, SIL OFL — licence
 * files sit beside them). The HTML templates use the same families through
 * next/font, so the PDF measures and wraps text with the same metrics. */
export const PDF_SANS = "Inter";
export const PDF_SERIF = "Source Serif 4";

/** Display faces for the bespoke single-column templates' names and titles
 * (theme `displayFont`). Same families the HTML loads through next/font. */
export const PDF_DISPLAY = {
  fraunces: "Fraunces",
  playfair: "Playfair Display",
  cormorant: "Cormorant Garamond",
  mono: "JetBrains Mono",
  syne: "Syne",
} as const;

const FACES: { family: string; file: string; fontWeight: number; fontStyle: "normal" | "italic" }[] = [
  { family: PDF_SANS, file: "inter-400.ttf", fontWeight: 400, fontStyle: "normal" },
  { family: PDF_SANS, file: "inter-500.ttf", fontWeight: 500, fontStyle: "normal" },
  { family: PDF_SANS, file: "inter-600.ttf", fontWeight: 600, fontStyle: "normal" },
  { family: PDF_SANS, file: "inter-400-italic.ttf", fontWeight: 400, fontStyle: "italic" },
  { family: PDF_SANS, file: "inter-600-italic.ttf", fontWeight: 600, fontStyle: "italic" },
  { family: PDF_SERIF, file: "source-serif-4-400.ttf", fontWeight: 400, fontStyle: "normal" },
  { family: PDF_SERIF, file: "source-serif-4-600.ttf", fontWeight: 600, fontStyle: "normal" },
  { family: PDF_SERIF, file: "source-serif-4-400-italic.ttf", fontWeight: 400, fontStyle: "italic" },
  { family: PDF_SERIF, file: "source-serif-4-600-italic.ttf", fontWeight: 600, fontStyle: "italic" },
  { family: PDF_DISPLAY.fraunces, file: "fraunces-300.ttf", fontWeight: 300, fontStyle: "normal" },
  { family: PDF_DISPLAY.fraunces, file: "fraunces-300-italic.ttf", fontWeight: 300, fontStyle: "italic" },
  { family: PDF_DISPLAY.playfair, file: "playfair-display-600.ttf", fontWeight: 600, fontStyle: "normal" },
  { family: PDF_DISPLAY.cormorant, file: "cormorant-garamond-500.ttf", fontWeight: 500, fontStyle: "normal" },
  { family: PDF_DISPLAY.cormorant, file: "cormorant-garamond-500-italic.ttf", fontWeight: 500, fontStyle: "italic" },
  { family: PDF_DISPLAY.mono, file: "jetbrains-mono-400.ttf", fontWeight: 400, fontStyle: "normal" },
  { family: PDF_DISPLAY.mono, file: "jetbrains-mono-600.ttf", fontWeight: 600, fontStyle: "normal" },
  { family: PDF_DISPLAY.syne, file: "syne-700.ttf", fontWeight: 700, fontStyle: "normal" },
];

let registeredBase: string | null = null;

/** Registers the families against `baseUrl` — `/fonts/pdf` in the browser,
 * the on-disk `public/fonts/pdf` directory under Node (tests). Idempotent per
 * base; react-pdf only fetches a face the first time a document uses it. */
export function registerPdfFonts(baseUrl: string): void {
  const base = baseUrl.replace(/\/$/, "");
  if (registeredBase === base) return;
  for (const family of [PDF_SANS, PDF_SERIF, ...Object.values(PDF_DISPLAY)]) {
    Font.register({
      family,
      fonts: FACES.filter((face) => face.family === family).map((face) => ({
        src: `${base}/${face.file}`,
        fontWeight: face.fontWeight,
        fontStyle: face.fontStyle,
      })),
    });
  }
  // The HTML never hyphenates; react-pdf does by default, which would wrap
  // lines differently from the preview the user is used to.
  Font.registerHyphenationCallback((word) => [word]);
  registeredBase = base;
}

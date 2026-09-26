import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { PDF_DISPLAY, PDF_SANS, PDF_SERIF, registerPdfFonts } from "./fonts";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const register = Font.register as jest.Mock;
const hyphenation = Font.registerHyphenationCallback as jest.Mock;
const FONT_DIR = path.join(process.cwd(), "public", "fonts", "pdf");

type Registration = { family: string; fonts: { src: string; fontWeight: number; fontStyle: string }[] };

describe("registerPdfFonts", () => {
  beforeAll(() => registerPdfFonts("/fonts/pdf/"));

  it("registers the two body families and every display face", () => {
    const families = register.mock.calls.map(([arg]: [Registration]) => arg.family);
    expect(families).toEqual([PDF_SANS, PDF_SERIF, ...Object.values(PDF_DISPLAY)]);
  });

  it("points every face at a bundled font file, without a doubled slash", () => {
    for (const [arg] of register.mock.calls as [Registration][]) {
      for (const face of arg.fonts) {
        expect(face.src).toMatch(/^\/fonts\/pdf\/[\w-]+\.ttf$/);
        expect(fs.existsSync(path.join(FONT_DIR, path.basename(face.src)))).toBe(true);
      }
    }
  });

  it("covers the weights and styles the document uses", () => {
    const faces = (register.mock.calls as [Registration][]).flatMap(([arg]) =>
      arg.fonts.map((f) => `${arg.family} ${f.fontWeight} ${f.fontStyle}`),
    );
    for (const needed of [
      `${PDF_SANS} 400 normal`,
      `${PDF_SANS} 500 normal`,
      `${PDF_SANS} 600 normal`,
      `${PDF_SANS} 600 italic`,
      `${PDF_SERIF} 600 normal`,
      `${PDF_SERIF} 600 italic`,
      `${PDF_DISPLAY.fraunces} 300 normal`,
      `${PDF_DISPLAY.fraunces} 300 italic`,
      `${PDF_DISPLAY.playfair} 600 normal`,
      `${PDF_DISPLAY.cormorant} 500 normal`,
      `${PDF_DISPLAY.cormorant} 500 italic`,
      `${PDF_DISPLAY.mono} 400 normal`,
      `${PDF_DISPLAY.mono} 600 normal`,
      `${PDF_DISPLAY.syne} 700 normal`,
    ]) {
      expect(faces).toContain(needed);
    }
  });

  it("ships the SIL Open Font License beside the fonts", () => {
    expect(fs.existsSync(path.join(FONT_DIR, "OFL-Inter.txt"))).toBe(true);
    expect(fs.existsSync(path.join(FONT_DIR, "OFL-SourceSerif4.txt"))).toBe(true);
    for (const licence of ["Fraunces", "PlayfairDisplay", "CormorantGaramond", "JetBrainsMono", "Syne"]) {
      expect(fs.existsSync(path.join(FONT_DIR, `OFL-${licence}.txt`))).toBe(true);
    }
  });

  it("turns hyphenation off so words wrap whole, as in the HTML", () => {
    const callback = hyphenation.mock.calls[0][0] as (word: string) => string[];
    expect(callback("infrastructure")).toEqual(["infrastructure"]);
  });

  it("registers only once per base URL", () => {
    const before = register.mock.calls.length;
    registerPdfFonts("/fonts/pdf");
    expect(register.mock.calls.length).toBe(before);
  });
});

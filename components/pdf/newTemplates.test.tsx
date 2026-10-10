import { render } from "@testing-library/react";
import { getRenderableSections } from "@/lib/resume";
import { resumeSectionTitle } from "@/lib/persona";
import { mixHex } from "@/lib/pdf/color";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { pdfStyle } from "@/test-utils/reactPdfMock";
import { TEMPLATES, getTheme, paperColor, type HeadingStyle } from "@/components/templates/shared/theme";
import { ResumePdfDocument } from "./ResumePdfDocument";
import { PDF_DISPLAY, PDF_SANS, PDF_SERIF } from "./fonts";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const PHOTO = "data:image/jpeg;base64,/9j/4AAQ";
const NEW_IDS = ["fern", "vellum", "orchid", "linen", "dune"] as const;
const NEW_HEADINGS: HeadingStyle[] = ["band", "divider", "marker", "diamond", "pill"];

function renderDoc(templateId: string) {
  const data = makeFullResumeData({ templateId, photo: PHOTO });
  return { data, ...render(<ResumePdfDocument data={data} />) };
}

function textEl(container: HTMLElement, value: string): HTMLElement {
  const el = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf="Text"]')).find((t) => t.textContent === value);
  if (!el) throw new Error(`No Text "${value}"`);
  return el;
}

describe("new templates in the PDF engine", () => {
  it("each uses one of the new heading styles", () => {
    expect(NEW_IDS.map((id) => getTheme(id).headingStyle)).toEqual(NEW_HEADINGS);
  });

  it.each(NEW_IDS)("%s draws every section title, each kept with what follows it", (id) => {
    const { container, data } = renderDoc(id);
    for (const key of getRenderableSections(data)) {
      const heading = textEl(container, resumeSectionTitle(key, data));
      // A heading never ends a page alone (react-pdf's minPresenceAhead).
      expect(heading.closest("[data-min-presence]")).not.toBeNull();
    }
    expect(container.textContent).toContain(data.basicInfo.name);
  });

  it("paints the paper colour on paper templates and white on every other", () => {
    for (const theme of TEMPLATES) {
      const { container, unmount } = renderDoc(theme.id);
      const page = container.querySelector('[data-pdf="Page"]')!;
      if (theme.variant) {
        // The bespoke variants paint their own grounds and are untouched.
        expect(theme.paper).toBeUndefined();
      } else {
        expect([theme.id, pdfStyle(page).backgroundColor]).toEqual([theme.id, paperColor(theme)]);
      }
      unmount();
    }
    expect(paperColor(getTheme("atlas"))).toBe("#ffffff");
    expect(paperColor(getTheme("vellum"))).toBe("#F7F3EA");
  });

  it("tints a paper template's rail toward its paper, and every white one toward white as before", () => {
    const dune = getTheme("dune");
    const strip = renderDoc("dune").container.querySelector('[data-fixed="true"]')!;
    expect(pdfStyle(strip).backgroundColor).toBe(mixHex(dune.railColor!, 8, dune.paper));

    const navy = getTheme("navy");
    const navyStrip = renderDoc("navy").container.querySelector('[data-fixed="true"]')!;
    expect(pdfStyle(navyStrip).backgroundColor).toBe(mixHex(navy.accent, 8));
  });

  it("sets Dune's name in its display face at the one weight that face ships in", () => {
    const { container, data } = renderDoc("dune");
    const style = pdfStyle(textEl(container, data.basicInfo.name));
    expect(style).toMatchObject({ fontFamily: PDF_DISPLAY.fraunces, fontWeight: 300 });
  });

  it("keeps every other sidebar name in its own body face at 600", () => {
    for (const theme of TEMPLATES.filter((t) => t.layout === "sidebar" && !t.displayFont)) {
      const { container, data, unmount } = renderDoc(theme.id);
      expect([theme.id, pdfStyle(textEl(container, data.basicInfo.name))]).toMatchObject([
        theme.id,
        { fontFamily: theme.fontDisplay === "serif" ? PDF_SERIF : PDF_SANS, fontWeight: 600 },
      ]);
      unmount();
    }
  });

  it("Fern's title bands turn white on the solid rail, with the rail colour as the text", () => {
    const { container } = renderDoc("fern");
    const railHeading = textEl(container, "Education");
    expect(pdfStyle(railHeading).color).toBe(getTheme("fern").accent);
    expect(pdfStyle(railHeading.parentElement!).backgroundColor).toBe("#ffffff");

    const mainHeading = textEl(container, "Experience");
    expect(pdfStyle(mainHeading).color).toBe("#ffffff");
    expect(pdfStyle(mainHeading.parentElement!).backgroundColor).toBe(getTheme("fern").accent);
  });

  it("Orchid keeps headings on the accent and its band on the header colour", () => {
    const theme = getTheme("orchid");
    const { container, data } = renderDoc("orchid");
    expect(pdfStyle(textEl(container, "Experience")).color).toBe(theme.accent);
    const band = Array.from(container.querySelectorAll('[data-pdf="Page"] > [data-pdf="View"]')).find(
      (v) => pdfStyle(v).backgroundColor === theme.headerColor,
    )!;
    expect(band.textContent).toContain(data.basicInfo.name);
  });

  it("Orchid's summary marker carries a glyph like every other section's", () => {
    const { container } = renderDoc("orchid");
    const row = textEl(container, "Summary").parentElement!;
    expect(row.querySelector('[data-pdf="Canvas"]')).not.toBeNull();
  });

  it("Linen's diamond is a rotated square in the accent", () => {
    const { container } = renderDoc("linen");
    const row = textEl(container, "Experience").parentElement!;
    const mark = row.querySelector('[data-pdf="View"]')!;
    expect(pdfStyle(mark)).toMatchObject({ transform: "rotate(45deg)", backgroundColor: getTheme("linen").accent });
  });

  it("Vellum rules a hairline above each section title", () => {
    const { container } = renderDoc("vellum");
    const wrap = textEl(container, "Experience").parentElement!;
    expect(pdfStyle(wrap).borderTopWidth).toBeGreaterThan(0);
  });
});

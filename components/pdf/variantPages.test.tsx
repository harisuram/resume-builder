import { render } from "@testing-library/react";
import { resumeSectionTitle } from "@/lib/persona";
import { PAGE_INSET_PX } from "@/lib/page";
import { getRenderableSections } from "@/lib/resume";
import { formatDateRange, isCurrentExperience } from "@/lib/date";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { pdfStyle } from "@/test-utils/reactPdfMock";
import { TESSERA_GROUND, getTheme, headerColor } from "@/components/templates/shared/theme";
import { ResumePdfDocument } from "./ResumePdfDocument";
import { PDF_DISPLAY, PDF_SERIF } from "./fonts";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const VARIANTS = ["horizon", "pivot", "laureate", "sterling", "cameo", "civic", "kernel", "tessera"] as const;

function renderVariant(id: string, overrides: Parameters<typeof makeFullResumeData>[0] = {}) {
  const data = makeFullResumeData({ templateId: id, ...overrides });
  return { data, ...render(<ResumePdfDocument data={data} />) };
}

const texts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-pdf="Text"]')).map((el) => el.textContent ?? "");

/** The Text whose own text is exactly `value`. */
const textEl = (container: HTMLElement, value: string) =>
  Array.from(container.querySelectorAll('[data-pdf="Text"]')).find((el) => el.textContent === value);

describe("bespoke single-column templates in the PDF", () => {
  it.each(VARIANTS)("%s draws one page flow with the name and every section in order", (id) => {
    const { container, data } = renderVariant(id);
    expect(container.querySelectorAll('[data-pdf="Page"]')).toHaveLength(1);
    expect(container.textContent).toContain(data.basicInfo.name);
    const all = texts(container);
    const titles = getRenderableSections(data).map((key) => {
      const title = resumeSectionTitle(key, data);
      return id === "kernel" ? `~/${title.toLowerCase()}` : title;
    });
    const positions = titles.map((title) => all.indexOf(title));
    for (const [i, title] of titles.entries()) expect([title, positions[i]]).not.toEqual([title, -1]);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("runs Pivot's and Civic's bands up to the paper edge in the second colour", () => {
    for (const id of ["pivot", "civic"] as const) {
      const { container, unmount } = renderVariant(id);
      const band = Array.from(container.querySelectorAll('[data-pdf="View"]')).find(
        (el) => pdfStyle(el).backgroundColor === headerColor(getTheme(id)),
      )!;
      expect(pdfStyle(band).marginTop).toBe(-PAGE_INSET_PX * 0.75);
      unmount();
    }
  });

  it("sets each name in its display face", () => {
    const cases = [
      ["sterling", PDF_DISPLAY.cormorant],
      ["pivot", PDF_DISPLAY.playfair],
      ["tessera", PDF_DISPLAY.syne],
      ["laureate", PDF_SERIF],
    ] as const;
    for (const [id, family] of cases) {
      const { container, data, unmount } = renderVariant(id);
      expect(pdfStyle(textEl(container, data.basicInfo.name)!).fontFamily).toBe(family);
      unmount();
    }
    const horizon = renderVariant("horizon");
    const name = Array.from(horizon.container.querySelectorAll('[data-pdf="Text"]')).find((el) =>
      (el.textContent ?? "").startsWith(horizon.data.basicInfo.name.split(" ")[0]),
    )!;
    expect(pdfStyle(name).fontFamily).toBe(PDF_DISPLAY.fraunces);
  });

  it("puts Horizon's dates in the timeline column", () => {
    const { container, data } = renderVariant("horizon");
    for (const exp of data.sections.experience ?? []) {
      const date = textEl(container, formatDateRange(exp.startDate, exp.endDate, isCurrentExperience(exp)));
      expect(date).toBeDefined();
      expect(pdfStyle(date!).textAlign).toBe("right");
    }
  });

  it("gives Laureate a serif body and Tessera its grey ground", () => {
    const laureate = renderVariant("laureate");
    expect(pdfStyle(laureate.container.querySelector('[data-pdf="Page"]')!).fontFamily).toBe(PDF_SERIF);
    laureate.unmount();
    const tessera = renderVariant("tessera");
    expect(pdfStyle(tessera.container.querySelector('[data-pdf="Page"]')!).backgroundColor).toBe(TESSERA_GROUND);
  });

  it("shows Cameo's monogram without a photo and the photo with one", () => {
    const initials = renderVariant("cameo", { photo: undefined });
    expect(texts(initials.container)).toContain("AM");
    initials.unmount();
    const photo = renderVariant("cameo", { photo: "data:image/jpeg;base64,/9j/4AAQ" });
    expect(photo.container.querySelector('[data-pdf="Image"]')).not.toBeNull();
  });
});

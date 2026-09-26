import { render } from "@testing-library/react";
import { resumeSectionTitle } from "@/lib/persona";
import { PAGE_INSET_PX } from "@/lib/page";
import { getRenderableSections } from "@/lib/resume";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { pdfStyle } from "@/test-utils/reactPdfMock";
import { TEMPLATES, getTheme, headerColor } from "@/components/templates/shared/theme";
import { ResumePdfDocument } from "./ResumePdfDocument";
import { PDF_SANS, PDF_SERIF } from "./fonts";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const PHOTO = "data:image/jpeg;base64,/9j/4AAQ";

function renderDoc(overrides: Parameters<typeof makeFullResumeData>[0] = {}) {
  const data = makeFullResumeData({ templateId: "atlas", ...overrides });
  const view = render(<ResumePdfDocument data={data} />);
  return { data, ...view };
}

/** Every Text primitive's own text, in document order. */
function texts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-pdf="Text"]')).map((el) => el.textContent ?? "");
}

describe("ResumePdfDocument", () => {
  it("draws one A4 page flow titled with the candidate's name", () => {
    const { container, data } = renderDoc();
    expect(container.querySelector('[data-pdf="Document"]')).toHaveAttribute("data-title", data.basicInfo.name);
    const pages = container.querySelectorAll('[data-pdf="Page"]');
    expect(pages).toHaveLength(1);
    // Every page gets the HTML print's top inset.
    expect(pdfStyle(pages[0]).paddingTop).toBe(PAGE_INSET_PX * 0.75);
    expect(pdfStyle(pages[0]).fontFamily).toBe(PDF_SANS);
  });

  it("puts the name and every contact item in the header", () => {
    const { container, data } = renderDoc();
    const all = texts(container);
    expect(all[0]).toBe(data.basicInfo.name);
    for (const value of [data.basicInfo.location, data.basicInfo.email, data.basicInfo.links.linkedin, data.basicInfo.links.github]) {
      expect(all).toContain(value);
    }
    expect(all.some((t) => t.endsWith(data.basicInfo.phone))).toBe(true);
  });

  it("renders every section the HTML renders, in the same order", () => {
    const { container, data } = renderDoc();
    const all = texts(container);
    const titles = getRenderableSections(data).map((key) => resumeSectionTitle(key, data));
    const positions = titles.map((title) => all.indexOf(title));
    for (const [i, title] of titles.entries()) expect([title, positions[i]]).not.toEqual([title, -1]);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("includes each entry's content", () => {
    const { container, data } = renderDoc();
    const body = container.textContent ?? "";
    for (const exp of data.sections.experience ?? []) {
      expect(body).toContain(exp.role);
      for (const bullet of exp.bullets) expect(body).toContain(bullet);
    }
    for (const edu of data.sections.education ?? []) expect(body).toContain(edu.institution);
    for (const project of data.sections.projects ?? []) expect(body).toContain(project.name);
    for (const skill of data.sections.skills ?? []) expect(body).toContain(skill);
  });

  it("leaves skipped sections out entirely", () => {
    const base = makeFullResumeData();
    const { container } = renderDoc({ sectionStatus: { ...base.sectionStatus, experience: "skipped", summary: "skipped" } });
    const all = texts(container);
    expect(all).not.toContain("Experience");
    expect(all).not.toContain("Summary");
    expect(container.textContent).not.toContain(base.sections.experience![0].bullets[0]);
  });

  describe("page-break rules", () => {
    it("never leaves a section heading alone at the bottom of a page", () => {
      const { container } = renderDoc();
      const headings = Array.from(container.querySelectorAll('[data-pdf="Text"]')).filter((el) =>
        ["Summary", "Experience", "Education", "Skills"].includes(el.textContent ?? ""),
      );
      expect(headings.length).toBeGreaterThan(0);
      for (const heading of headings) {
        expect(heading.closest("[data-min-presence]")).not.toBeNull();
      }
    });

    it("keeps short entries whole but lets long roles split between bullets", () => {
      const { container, data } = renderDoc();
      const entryOf = (text: string) => {
        const el = Array.from(container.querySelectorAll('[data-pdf="Text"]')).find((t) => t.textContent === text)!;
        return el;
      };
      // Education: the whole entry moves as one block.
      const institution = entryOf(data.sections.education![0].institution);
      expect(institution.closest('[data-wrap="false"]')).not.toBeNull();
      // Experience: each bullet row is held together (mark + text), but the
      // role itself can break between bullets, so a long role doesn't jump
      // whole to the next page.
      const role = data.sections.experience![0];
      const bullet = Array.from(container.querySelectorAll('[data-pdf="Text"]')).find(
        (t) => t.textContent === role.bullets[0],
      )!;
      const unit = bullet.closest('[data-wrap="false"]')!;
      expect(unit).not.toBeNull();
      expect(unit.textContent).toBe(role.bullets[0]);
      expect(unit.parentElement!.closest('[data-wrap="false"]')).toBeNull();
    });
  });

  describe("photo", () => {
    it("draws the photo when there is one", () => {
      const { container } = renderDoc({ photo: PHOTO });
      expect(container.querySelector('[data-pdf="Image"]')).toHaveAttribute("data-src", PHOTO);
    });

    it("hides the photo when the Photo section is skipped", () => {
      const base = makeFullResumeData();
      const { container } = renderDoc({ photo: PHOTO, sectionStatus: { ...base.sectionStatus, photo: "skipped" } });
      expect(container.querySelector('[data-pdf="Image"]')).toBeNull();
    });

    it("shows no avatar at all on a template without a slot and no photo", () => {
      const { container } = renderDoc({ photo: undefined });
      expect(container.querySelector('[data-pdf="Image"]')).toBeNull();
    });
  });

  describe("header", () => {
    it("runs a colour band to the paper edge on name-band templates", () => {
      const theme = getTheme("marquee");
      const { container } = renderDoc({ templateId: theme.id });
      const header = container.querySelector('[data-pdf="Page"] > [data-pdf="View"]')!;
      expect(pdfStyle(header).backgroundColor).toBe(headerColor(theme));
      expect(pdfStyle(header).marginTop).toBe(-PAGE_INSET_PX * 0.75);
    });

    it("keeps the plain header inside the page inset", () => {
      const { container } = renderDoc();
      const header = container.querySelector('[data-pdf="Page"] > [data-pdf="View"]')!;
      expect(pdfStyle(header).backgroundColor).toBeUndefined();
      expect(pdfStyle(header).marginTop).toBeUndefined();
    });

    it("sets the name in the serif face on serif templates", () => {
      const serif = TEMPLATES.find((t) => t.layout === "single" && t.fontDisplay === "serif")!;
      const { container, data } = renderDoc({ templateId: serif.id });
      const name = texts(container).indexOf(data.basicInfo.name);
      const nameEl = container.querySelectorAll('[data-pdf="Text"]')[name];
      expect(pdfStyle(nameEl).fontFamily).toBe(PDF_SERIF);
    });
  });

  it("renders every template without throwing", () => {
    for (const theme of TEMPLATES) {
      const { unmount, container } = renderDoc({ templateId: theme.id, photo: PHOTO });
      expect(container.querySelector('[data-pdf="Page"]')).not.toBeNull();
      unmount();
    }
  });

  describe("sidebar layout", () => {
    const rail = (container: HTMLElement) => {
      const row = container.querySelector('[data-pdf="Page"] > [data-pdf="View"]:not([data-fixed]):last-child')!;
      return row;
    };

    it("paints the rail on every page, full height, on the rail's side", () => {
      const theme = getTheme("ember");
      const { container } = renderDoc({ templateId: theme.id });
      const strip = container.querySelector('[data-fixed="true"]')!;
      expect(strip).not.toBeNull();
      const style = pdfStyle(strip);
      expect(style).toMatchObject({ position: "absolute", top: 0, bottom: 0, left: 0, backgroundColor: theme.accent });

      const right = renderDoc({ templateId: "aisle" }).container.querySelector('[data-fixed="true"]')!;
      expect(pdfStyle(right)).toMatchObject({ right: 0 });
      expect(pdfStyle(right).left).toBeUndefined();
    });

    it("puts the compact sections in the rail and the narrative in the main column", () => {
      const { container, data } = renderDoc({ templateId: "ember" });
      const [railCol, mainCol] = Array.from(rail(container).children);
      expect(railCol.textContent).toContain("Education");
      expect(railCol.textContent).toContain(data.sections.skills![0]);
      expect(railCol.textContent).not.toContain("Experience");
      expect(mainCol.textContent).toContain("Experience");
      expect(mainCol.textContent).toContain(data.sections.experience![0].bullets[0]);
      expect(mainCol.textContent).not.toContain(data.sections.education![0].institution);
      // Name and contact sit at the top of the rail when there's no band.
      expect(railCol.textContent).toContain(data.basicInfo.name);
    });

    it("sets rail text in white on a solid rail, like the HTML", () => {
      const { container } = renderDoc({ templateId: "ember" });
      const heading = Array.from(container.querySelectorAll('[data-pdf="Text"]')).find((t) => t.textContent === "Education")!;
      expect(pdfStyle(heading).color).toBe("#ffffff");
    });

    it("flips the columns for a right-hand rail", () => {
      const { container } = renderDoc({ templateId: "aisle" });
      expect(pdfStyle(rail(container)).flexDirection).toBe("row-reverse");
    });

    it("draws a name band above the columns when the template has one", () => {
      const theme = getTheme("tidewater");
      const { container, data } = renderDoc({ templateId: theme.id });
      const band = Array.from(container.querySelectorAll('[data-pdf="Page"] > [data-pdf="View"]')).find(
        (v) => pdfStyle(v).backgroundColor === headerColor(theme),
      )!;
      expect(band.textContent).toContain(data.basicInfo.name);
      expect(rail(container).children[0].textContent).not.toContain(data.basicInfo.name);
    });
  });

  describe("two-column layout", () => {
    it("splits narrow and wide sections into 32% and 68% columns", () => {
      const { container, data } = renderDoc({ templateId: "twin" });
      const page = container.querySelector('[data-pdf="Page"]')!;
      const row = page.children[page.children.length - 1];
      const [narrow, wide] = Array.from(row.children);
      expect(pdfStyle(narrow).width).toBe("32%");
      expect(pdfStyle(wide).width).toBe("68%");
      expect(narrow.textContent).toContain(data.sections.education![0].institution);
      expect(wide.textContent).toContain(data.sections.experience![0].role);
    });

    it("sets the narrow column's lists inline rather than as chips", () => {
      const { container, data } = renderDoc({ templateId: "twin" });
      const skills = data.sections.skills!;
      expect(texts(container)).toContain(skills.join("  ·  "));
    });
  });

  describe("labeled layout", () => {
    /** One row per section: the page's second block (after the header). */
    const sectionRows = (container: HTMLElement) =>
      Array.from(container.querySelector('[data-pdf="Page"]')!.children[1].children);
    const labels = (container: HTMLElement) => sectionRows(container).map((row) => row.children[0].textContent);

    it("puts each section's title in the label column, CV-style", () => {
      const { container, data } = renderDoc({ templateId: "dossier" });
      const titles = labels(container);
      expect(titles[0]).toBe("Personal Information");
      expect(titles[1]).toBe("Profile");
      expect(titles).toContain("Work experience");
      const expected = getRenderableSections(data).map((key) =>
        key === "experience" ? "Work experience" : resumeSectionTitle(key, data),
      );
      expect(titles.slice(2)).toEqual(expected);
    });

    it("doesn't repeat the title as a heading inside the section", () => {
      const { container } = renderDoc({ templateId: "dossier" });
      expect(texts(container).filter((t) => t === "Education")).toHaveLength(1);
    });

    it("rules a hairline over every section after the first", () => {
      const { container } = renderDoc({ templateId: "dossier" });
      const bodies = sectionRows(container).map((row) => row.children[1]);
      expect(pdfStyle(bodies[0]).borderTopWidth).toBeUndefined();
      for (const body of bodies.slice(1)) expect(pdfStyle(body).borderTopWidth).toBeGreaterThan(0);
    });

    it("lists contact details in a two-column grid under Personal Information", () => {
      const { container, data } = renderDoc({ templateId: "dossier" });
      const firstRow = sectionRows(container)[0];
      expect(firstRow.textContent).toContain(data.basicInfo.email);
      const cells = Array.from(firstRow.querySelectorAll('[data-pdf="View"]')).filter((v) => pdfStyle(v).width === "50%");
      expect(cells.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("no trailing space after the last section", () => {
    /* A user's Ledger download ended on a blank page: padding trailed the
     * body, and when the last section stopped just above the bottom margin
     * the engine started a new page for the padding alone. The page's own
     * bottom inset is the only space that may follow the content. */
    it.each(TEMPLATES.map((theme) => [theme.id]))("%s", (id) => {
      const { container } = renderDoc({ templateId: id, photo: PHOTO });
      for (const pageEl of Array.from(container.querySelectorAll('[data-pdf="Page"]'))) {
        // Follow the last child down from the page: everything on that path
        // ends where the content ends.
        let el: Element | null = pageEl.lastElementChild;
        while (el && el.getAttribute("data-fixed") !== "true") {
          const style = pdfStyle(el);
          expect([id, el.getAttribute("data-pdf"), style.paddingBottom ?? 0, style.marginBottom ?? 0]).toEqual([
            id,
            el.getAttribute("data-pdf"),
            0,
            0,
          ]);
          el = el.lastElementChild;
        }
      }
    });
  });

  describe("no accidental unbreakable blocks", () => {
    /* react-pdf treats a present `wrap` prop literally
     * (`'wrap' in props ? props.wrap : true`), so `wrap={undefined}` makes a
     * block unbreakable. Horizon passed it for every experience entry: long
     * roles jumped whole to the next page, leaving pages mostly empty. */
    it.each(TEMPLATES.map((theme) => [theme.id]))("%s", (id) => {
      const { container } = renderDoc({ templateId: id, photo: PHOTO });
      expect([id, container.querySelectorAll('[data-wrap="undefined"]').length]).toEqual([id, 0]);
    });
  });

  describe("chips never split across pages", () => {
    /* A chip is a Text with its own background. Split by a page break, its
     * background stayed at the foot of the page as an empty pill and its
     * label began the next page on a torn half (reported on Cameo and the
     * tinted sidebars). Anything painted as a pill has to move whole. */
    it.each(TEMPLATES.map((theme) => [theme.id]))("%s", (id) => {
      const { container } = renderDoc({ templateId: id, photo: PHOTO });
      const pills = Array.from(container.querySelectorAll('[data-pdf="Text"]')).filter(
        (el) => pdfStyle(el).backgroundColor !== undefined,
      );
      for (const pill of pills) {
        expect([id, pill.textContent, pill.getAttribute("data-wrap")]).toEqual([id, pill.textContent, "false"]);
      }
    });

    it("covers templates that actually draw chips", () => {
      const withChips = TEMPLATES.filter((theme) => {
        const { container, unmount } = renderDoc({ templateId: theme.id });
        const found = Array.from(container.querySelectorAll('[data-pdf="Text"]')).some(
          (el) => pdfStyle(el).backgroundColor !== undefined,
        );
        unmount();
        return found;
      });
      expect(withChips.length).toBeGreaterThan(5);
    });
  });

  describe("keep-with-next only on headings", () => {
    /* minPresenceAhead keeps a heading with the start of what follows. Put
     * on a whole section (Dossier's label row), react-pdf moved the entire
     * section to the next page whenever it didn't fit, leaving most of a page
     * empty. Only heading-sized elements may carry it. */
    it.each(TEMPLATES.map((theme) => [theme.id]))("%s", (id) => {
      const { container } = renderDoc({ templateId: id, photo: PHOTO });
      for (const el of Array.from(container.querySelectorAll("[data-min-presence]"))) {
        const texts = el.matches('[data-pdf="Text"]') ? 1 : el.querySelectorAll('[data-pdf="Text"]').length;
        expect([id, (el.textContent ?? "").slice(0, 40), texts <= 4]).toEqual([id, (el.textContent ?? "").slice(0, 40), true]);
      }
    });
  });
});

import { render } from "@testing-library/react";
import { getRenderableSections } from "@/lib/resume";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { NARROW_SECTION_KEYS } from "../shared/ResumeSection";
import { getTheme, railBackground, TEMPLATES, TESSERA_GROUND, tint } from "../shared/theme";
import { AsymmetricLayout } from "./AsymmetricLayout";
import { LabeledLayout } from "./LabeledLayout";
import { SidebarLayout } from "./SidebarLayout";
import { SingleColumnLayout } from "./SingleColumnLayout";

const NARROW = ["education", "skills", "certifications", "languages", "hobbies", "softSkills"] as const;
const WIDE = ["keyAchievements", "experience", "internships", "partTime", "projects", "patents", "additional"] as const;

function sectionKeys(root: Element | null): string[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll("[data-section-key]")).map((el) => el.getAttribute("data-section-key")!);
}

function cssRgb(hex: string) {
  const n = hex.replace("#", "");
  return `rgb(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)})`;
}

describe("template layouts share the same section split", () => {
  it("treats languages, hobbies, and soft skills as compact, patents and additional as wide", () => {
    for (const key of NARROW) expect(NARROW_SECTION_KEYS.has(key)).toBe(true);
    for (const key of WIDE) expect(NARROW_SECTION_KEYS.has(key)).toBe(false);
  });

  it("SingleColumnLayout keeps the default order, including the five new sections at the end", () => {
    const data = makeFullResumeData();
    const { container } = render(<SingleColumnLayout data={data} theme={getTheme("atlas")} />);
    expect(sectionKeys(container)).toEqual(["summary", ...getRenderableSections(data)]);
    expect(sectionKeys(container).slice(-5)).toEqual(["patents", "languages", "hobbies", "softSkills", "additional"]);
  });

  it("Marquee keeps the accent header band out of the flowing page body", () => {
    const data = makeFullResumeData();
    const { container } = render(<SingleColumnLayout data={data} theme={getTheme("marquee")} />);
    const header = container.querySelector(".resume-dark-header");
    const body = container.querySelector(".resume-page-body");
    expect(header).not.toBeNull();
    expect(body).not.toBeNull();
    expect(header!.contains(body)).toBe(false);
    expect(header!.parentElement).toBe(body!.parentElement);
  });

  it("SidebarLayout puts compact lists in the rail and patents/additional in the main column", () => {
    const data = makeFullResumeData();
    const { container } = render(<SidebarLayout data={data} theme={getTheme("ember")} />);
    const rail = container.querySelector(".resume-sidebar-rail");
    const main = container.querySelector(".resume-main-column");
    expect(sectionKeys(rail)).toEqual([...NARROW]);
    expect(sectionKeys(main)).toEqual(["summary", ...WIDE]);
    expect(container.querySelector(".resume-sidebar-page")).not.toBeNull();
    expect(container.querySelector(".resume-col-pad")).not.toBeNull();
    expect(container.querySelector("thead.resume-sidebar-page-pad")).not.toBeNull();
    expect(container.querySelector("tfoot.resume-sidebar-page-pad-foot")).not.toBeNull();
  });

  it("AsymmetricLayout puts compact lists in the 32% column and patents/additional in the wide column", () => {
    const data = makeFullResumeData();
    const { container } = render(<AsymmetricLayout data={data} theme={getTheme("twin")} />);
    const narrow = container.querySelector(".resume-split-narrow");
    const wide = container.querySelector(".resume-split-wide");
    expect(sectionKeys(narrow)).toEqual([...NARROW]);
    expect(sectionKeys(wide)).toEqual(["summary", ...WIDE]);
    expect(container.querySelector(".resume-split-page")).not.toBeNull();
    expect(container.querySelector("thead.resume-split-page-pad")).not.toBeNull();
  });

  it("LabeledLayout keeps section titles in a left rail and contact under Personal Information", () => {
    const data = makeFullResumeData();
    const { container } = render(<LabeledLayout data={data} theme={getTheme("dossier")} />);
    expect(container.querySelector('[data-layout="labeled"]')).not.toBeNull();
    expect(container.textContent).toContain("Personal Information");
    expect(container.textContent).toContain("Profile");
    expect(container.textContent).toContain("Work experience");
    expect(sectionKeys(container)).toEqual(["summary", ...getRenderableSections(data)]);
    // Name is centered; contact is not under the name heading.
    const name = container.querySelector("h1");
    expect(name?.parentElement?.className).toContain("items-center");
    expect(name?.parentElement?.textContent).not.toContain(data.basicInfo.email);
  });

  it("LabeledLayout puts content-column rules on every section after the first", () => {
    const data = makeFullResumeData();
    const { container } = render(<LabeledLayout data={data} theme={getTheme("dossier")} />);
    const bodySections = Array.from(container.querySelectorAll(".resume-page-body > section"));
    expect(bodySections.length).toBeGreaterThan(2);
    expect(bodySections[0].getAttribute("data-labeled-ruled")).toBeNull();
    for (const section of bodySections.slice(1)) {
      expect(section.getAttribute("data-labeled-ruled")).toBe("true");
      const content = section.children[1] as HTMLElement;
      expect(content.className).toMatch(/border-t/);
    }
    // Divider lives inside the section so a page-gap spacer inserted before
    // [data-section-key] keeps the rule with its label and body.
    const experience = container.querySelector('[data-section-key="experience"]')!;
    expect(experience.getAttribute("data-labeled-ruled")).toBe("true");
    expect(experience.querySelector(".border-t")).not.toBeNull();
  });

  it("Copper and Inkwell keep the accent header band out of the flowing columns", () => {
    const data = makeFullResumeData();
    for (const id of ["copper", "inkwell"] as const) {
      const { container, unmount } = render(
        id === "copper" ? (
          <SingleColumnLayout data={data} theme={getTheme(id)} />
        ) : (
          <SidebarLayout data={data} theme={getTheme(id)} />
        ),
      );
      const header = container.querySelector(".resume-dark-header") as HTMLElement | null;
      expect(header).not.toBeNull();
      expect(header!.style.background).toBe(cssRgb(getTheme(id).accent));
      expect(header!.querySelector("[data-section-key]")).toBeNull();
      unmount();
    }
  });

  it("Atelier and Sable put the details rail on the right, full-bleed with page-2 pad thead", () => {
    const data = makeFullResumeData();
    for (const id of ["atelier", "sable"] as const) {
      const { container, unmount } = render(<SidebarLayout data={data} theme={getTheme(id)} />);
      expect(container.querySelector(".resume-sidebar-columns--right")).not.toBeNull();
      expect(container.querySelector(".resume-sidebar-page--right")).not.toBeNull();
      expect(container.querySelector("thead.resume-sidebar-page-pad")).not.toBeNull();
      expect(container.querySelector("tfoot.resume-sidebar-page-pad-foot")).not.toBeNull();
      unmount();
    }
  });
});

describe("two-tone templates", () => {
  // The bespoke variants carry a second colour too; they're covered below.
  const TWO_TONE = TEMPLATES.filter((theme) => theme.headerColor && !theme.variant);

  function headingColors(root: Element): string[] {
    return Array.from(root.querySelectorAll<HTMLElement>("h3")).map((h) => h.style.color);
  }

  it("ships the eight two-tone templates with a header colour distinct from the accent", () => {
    expect(TWO_TONE.map((theme) => theme.id).sort()).toEqual([
      "tidewater",
      "evergreen",
      "plum",
      "lagoon",
      "oxford",
      "laurel",
      "regent",
      "mulberry",
    ].sort());
    for (const theme of TWO_TONE) {
      expect(theme.headerColor!.toLowerCase()).not.toBe(theme.accent.toLowerCase());
    }
  });

  it("single column without a band: the name takes the header colour, headings keep the accent", () => {
    const theme = getTheme("oxford");
    const { container } = render(<SingleColumnLayout data={makeFullResumeData()} theme={theme} />);
    expect(container.querySelector(".resume-dark-header")).toBeNull();
    expect(container.querySelector<HTMLElement>("h1")!.style.color).toBe(cssRgb(theme.headerColor!));
    const colors = headingColors(container);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(color).toBe(cssRgb(theme.accent));
  });

  it("single column with a band: the band takes the header colour, headings keep the accent", () => {
    const theme = getTheme("regent");
    const { container } = render(<SingleColumnLayout data={makeFullResumeData()} theme={theme} />);
    const band = container.querySelector<HTMLElement>(".resume-dark-header")!;
    expect(band.style.background).toBe(cssRgb(theme.headerColor!));
    expect(container.querySelector<HTMLElement>("h1")!.style.color).toBe("");
    for (const color of headingColors(container.querySelector(".resume-page-body")!)) {
      expect(color).toBe(cssRgb(theme.accent));
    }
  });

  it("sidebar: the band takes the header colour and the rail is tinted from the rail colour", () => {
    const theme = getTheme("tidewater");
    const { container } = render(<SidebarLayout data={makeFullResumeData()} theme={theme} />);
    expect(container.querySelector<HTMLElement>(".resume-dark-header")!.style.background).toBe(
      cssRgb(theme.headerColor!),
    );
    const page = container.querySelector<HTMLElement>(".resume-sidebar-page")!;
    expect(page.style.getPropertyValue("--resume-rail-bg")).toBe(railBackground(theme));
    expect(railBackground(theme)).toBe(tint(theme.railColor!, 8));
    for (const color of headingColors(container.querySelector(".resume-main-column")!)) {
      expect(color).toBe(cssRgb(theme.accent));
    }
  });

  it("puts Lagoon's rail on the right", () => {
    const { container } = render(<SidebarLayout data={makeFullResumeData()} theme={getTheme("lagoon")} />);
    expect(container.querySelector(".resume-sidebar-page--right")).not.toBeNull();
  });

  it("leaves single-accent templates on the accent for band and rail", () => {
    const marquee = getTheme("marquee");
    const { container, unmount } = render(<SingleColumnLayout data={makeFullResumeData()} theme={marquee} />);
    expect(container.querySelector<HTMLElement>(".resume-dark-header")!.style.background).toBe(cssRgb(marquee.accent));
    unmount();

    const inkwell = getTheme("inkwell");
    const sidebar = render(<SidebarLayout data={makeFullResumeData()} theme={inkwell} />);
    expect(sidebar.container.querySelector<HTMLElement>(".resume-dark-header")!.style.background).toBe(
      cssRgb(inkwell.accent),
    );
    expect(railBackground(inkwell)).toBe(tint(inkwell.accent, 8));
  });
});

describe("LabeledLayout row labels", () => {
  /* A stretched grid label as tall as its section, glued to the content by
   * break-after-avoid, printed as one unbreakable page-tall block. */
  it("sizes each section label to its text instead of stretching to the row", () => {
    const { container } = render(<LabeledLayout data={makeFullResumeData()} theme={getTheme("dossier")} />);
    const labels = container.querySelectorAll("[data-section-key] > h3");
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) expect(label).toHaveClass("self-start", "break-after-avoid");
  });
});

describe("bespoke single-column templates (VariantLayout)", () => {
  const VARIANT_IDS = ["horizon", "pivot", "laureate", "sterling", "cameo", "civic", "kernel", "tessera"] as const;

  it.each(VARIANT_IDS)("%s draws its own surface, the name as the one h1, and every section", (id) => {
    const data = makeFullResumeData();
    const { container } = render(<SingleColumnLayout data={data} theme={getTheme(id)} />);
    const surface = container.querySelector<HTMLElement>(".resume-surface")!;
    expect(surface.dataset.variant).toBe(id);
    expect(surface.dataset.layout).toBe("single");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")!.textContent).toContain(data.basicInfo.name);
    expect(sectionKeys(container)).toEqual(["summary", ...getRenderableSections(data)]);
  });

  it("Horizon sets the surname in italic in the second colour", () => {
    const theme = getTheme("horizon");
    const { container } = render(<SingleColumnLayout data={makeFullResumeData()} theme={theme} />);
    const em = container.querySelector("h1 em") as HTMLElement;
    expect(em.textContent).toBe("Montgomery-Whitfield");
    expect(em.style.color).toBe(cssRgb(theme.headerColor!));
  });

  it("Cameo shows initials in the ring when there's no photo, and the photo when there is", () => {
    const theme = getTheme("cameo");
    const noPhoto = render(<SingleColumnLayout data={makeFullResumeData({ photo: undefined })} theme={theme} />);
    expect(noPhoto.container.textContent).toContain("AM");
    noPhoto.unmount();
    const withPhoto = render(<SingleColumnLayout data={makeFullResumeData({ photo: "data:image/png;base64,AAAA" })} theme={theme} />);
    expect(withPhoto.container.querySelector('img[src^="data:image/png"]')).not.toBeNull();
  });

  it("Pivot and Civic put the name on a band in the second colour", () => {
    for (const id of ["pivot", "civic"] as const) {
      const theme = getTheme(id);
      const { container, unmount } = render(<SingleColumnLayout data={makeFullResumeData()} theme={theme} />);
      const band = container.querySelector("h1")!.closest<HTMLElement>("[style*='background']")!;
      expect(band.style.background).toBe(cssRgb(theme.headerColor!));
      unmount();
    }
  });

  it("Tessera paints its grey ground behind the section cards", () => {
    const { container } = render(<SingleColumnLayout data={makeFullResumeData()} theme={getTheme("tessera")} />);
    expect(container.querySelector<HTMLElement>(".resume-surface")!.style.background).toBe(cssRgb(TESSERA_GROUND));
  });

  it("Laureate sets its body in the serif", () => {
    const { container } = render(<SingleColumnLayout data={makeFullResumeData()} theme={getTheme("laureate")} />);
    expect(container.querySelector(".resume-surface")).toHaveClass("font-serif");
  });

  it("Kernel titles sections as ~/path in lowercase", () => {
    const { container } = render(<SingleColumnLayout data={makeFullResumeData()} theme={getTheme("kernel")} />);
    const heading = container.querySelector('[data-section-key="experience"] h3')!;
    expect(heading.textContent).toMatch(/^~\//);
    expect(heading).toHaveClass("lowercase");
  });
});

import { render } from "@testing-library/react";
import { getRenderableSections } from "@/lib/resume";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { NARROW_SECTION_KEYS } from "../shared/ResumeSection";
import { getTheme } from "../shared/theme";
import { AsymmetricLayout } from "./AsymmetricLayout";
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
    const { container } = render(<SingleColumnLayout data={data} theme={getTheme("jakes-resume")} />);
    expect(sectionKeys(container)).toEqual(["summary", ...getRenderableSections(data)]);
    expect(sectionKeys(container).slice(-5)).toEqual(["patents", "languages", "hobbies", "softSkills", "additional"]);
  });

  it("Marquee keeps the accent header band out of the flowing page body", () => {
    const data = makeFullResumeData();
    const { container } = render(<SingleColumnLayout data={data} theme={getTheme("bre-material-dark")} />);
    const header = container.querySelector(".resume-dark-header");
    const body = container.querySelector(".resume-page-body");
    expect(header).not.toBeNull();
    expect(body).not.toBeNull();
    expect(header!.contains(body)).toBe(false);
    expect(header!.parentElement).toBe(body!.parentElement);
  });

  it("SidebarLayout puts compact lists in the rail and patents/additional in the main column", () => {
    const data = makeFullResumeData();
    const { container } = render(<SidebarLayout data={data} theme={getTheme("bre-creative")} />);
    const rail = container.querySelector(".resume-sidebar-rail");
    const main = container.querySelector(".resume-main-column");
    expect(sectionKeys(rail)).toEqual([...NARROW]);
    expect(sectionKeys(main)).toEqual(["summary", ...WIDE]);
    expect(container.querySelector(".resume-sidebar-page")).not.toBeNull();
    expect(container.querySelector("thead.resume-sidebar-page-pad")).not.toBeNull();
  });

  it("AsymmetricLayout puts compact lists in the 32% column and patents/additional in the wide column", () => {
    const data = makeFullResumeData();
    const { container } = render(<AsymmetricLayout data={data} theme={getTheme("deedy-reversed")} />);
    const narrow = container.querySelector(".resume-split-narrow");
    const wide = container.querySelector(".resume-split-wide");
    expect(sectionKeys(narrow)).toEqual([...NARROW]);
    expect(sectionKeys(wide)).toEqual(["summary", ...WIDE]);
    expect(container.querySelector(".resume-split-page")).not.toBeNull();
    expect(container.querySelector("thead.resume-split-page-pad")).not.toBeNull();
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

  it("Atelier and Sable put the details rail on the right", () => {
    const data = makeFullResumeData();
    for (const id of ["atelier", "sable"] as const) {
      const { container, unmount } = render(<SidebarLayout data={data} theme={getTheme(id)} />);
      expect(container.querySelector(".resume-sidebar-columns--right")).not.toBeNull();
      unmount();
    }
  });
});

import { render } from "@testing-library/react";
import { getRenderableSections } from "@/lib/resume";
import { resumeSectionTitle } from "@/lib/persona";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { getTemplateComponent } from "./registry";
import { bulletKind } from "./shared/atoms";
import { SectionHeading } from "./shared/SectionHeading";
import {
  DISPLAY_FONT_WEIGHT,
  TEMPLATES,
  getTheme,
  paperColor,
  paperStyle,
  railBackground,
  tint,
  type HeadingStyle,
} from "./shared/theme";

const NEW_IDS = ["fern", "vellum", "orchid", "linen", "dune"] as const;
const NEW_HEADINGS: HeadingStyle[] = ["marker", "diamond", "divider", "pill", "band"];

function cssRgb(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

function renderTemplate(id: string) {
  const data = makeFullResumeData({ templateId: id });
  const Template = getTemplateComponent(id);
  return { data, ...render(<Template data={data} />) };
}

describe("new heading styles", () => {
  it.each(NEW_HEADINGS)("%s renders the title as an h3 in the accent", (headingStyle) => {
    const theme = { ...getTheme("atlas"), headingStyle, accent: "#6E2F62" };
    const { getByRole } = render(<SectionHeading theme={theme} section="experience" title="Experience" />);
    const h3 = getByRole("heading", { level: 3, name: "Experience" });
    // Band sets white text on an accent block; every other style colours the title itself.
    expect(h3.style.color).toBe(headingStyle === "band" ? cssRgb("#ffffff") : cssRgb(theme.accent));
    // Headings stay glued to the content after them.
    expect(h3.closest(".break-after-avoid")).not.toBeNull();
  });

  it.each(NEW_HEADINGS)("%s turns white on a solid rail (band inverts to the rail colour)", (headingStyle) => {
    const theme = { ...getTheme("fern"), headingStyle };
    const { getByRole } = render(<SectionHeading theme={theme} section="skills" title="Skills" light />);
    const h3 = getByRole("heading", { level: 3, name: "Skills" });
    expect(h3.style.color).toBe(headingStyle === "band" ? cssRgb(theme.accent) : cssRgb("#ffffff"));
  });

  it("marker draws the section icon on a solid accent square", () => {
    const theme = { ...getTheme("orchid") };
    const { container } = render(<SectionHeading theme={theme} section="experience" title="Experience" />);
    const square = container.querySelector<HTMLElement>("span")!;
    expect(square.style.background).toBe(cssRgb(theme.accent));
    expect(square.querySelector("svg")).not.toBeNull();
  });

  it("marker always draws a glyph — a profile mark for the summary — while the icon style still leaves summary bare", () => {
    const orchid = getTheme("orchid");
    const marker = render(<SectionHeading theme={orchid} section="summary" title="Summary" />);
    expect(marker.container.querySelector("span svg")).not.toBeNull();
    const iconStyle = render(<SectionHeading theme={getTheme("prism")} section="summary" title="Summary" />);
    expect(iconStyle.container.querySelector("svg")).toBeNull();
  });

  it("maps each new heading style to a bullet mark", () => {
    const kinds = NEW_HEADINGS.map((headingStyle) => bulletKind({ ...getTheme("atlas"), headingStyle }));
    expect(kinds).toEqual(["square", "diamond", "dash", "dash", "square"]);
  });
});

describe("new templates", () => {
  it.each(NEW_IDS)("%s renders the name and every section", (id) => {
    const { data, container } = renderTemplate(id);
    expect(container.textContent).toContain(data.basicInfo.name);
    for (const key of getRenderableSections(data)) {
      expect(container.textContent).toContain(resumeSectionTitle(key, data));
    }
  });

  it("sits at the end of the gallery so the existing order and home strip don't move", () => {
    expect(TEMPLATES.slice(-5).map((t) => t.id)).toEqual([...NEW_IDS]);
    expect(TEMPLATES.slice(0, 6).map((t) => t.id)).toEqual(["atlas", "tidewater", "prism", "oxford", "ember", "marquee"]);
  });
});

describe("paper", () => {
  it("sets the resume surface's paper token only on templates that have a paper", () => {
    for (const theme of TEMPLATES) {
      const { container, unmount } = renderTemplate(theme.id);
      const surface = container.querySelector<HTMLElement>(".resume-surface")!;
      expect([theme.id, surface.style.getPropertyValue("--r-bg")]).toEqual([theme.id, theme.paper ?? ""]);
      unmount();
    }
  });

  it("leaves white the default for every template without a paper", () => {
    const plain = TEMPLATES.filter((t) => !t.paper);
    expect(plain.length).toBe(TEMPLATES.length - 3);
    for (const theme of plain) {
      expect(paperColor(theme)).toBe("#ffffff");
      expect(paperStyle(theme)).toBeUndefined();
    }
  });

  it("paints the sidebar main column in the paper", () => {
    const { container } = renderTemplate("dune");
    expect(container.querySelector<HTMLElement>(".resume-main-column")!.style.backgroundColor).toBe(
      cssRgb(getTheme("dune").paper!),
    );
    const plain = renderTemplate("navy").container.querySelector<HTMLElement>(".resume-main-column")!;
    expect(plain.style.backgroundColor).toBe(cssRgb("#ffffff"));
  });

  it("tints a tinted rail toward the paper, and every white template's rail toward white as before", () => {
    const dune = getTheme("dune");
    expect(railBackground(dune)).toBe(tint(dune.railColor!, 8, dune.paper));
    expect(railBackground(dune)).toContain(dune.paper!);
    for (const theme of TEMPLATES.filter((t) => !t.paper && t.sidebarStyle !== "solid")) {
      expect(railBackground(theme)).toBe(`color-mix(in srgb, ${theme.railColor ?? theme.accent} 8%, white)`);
    }
  });
});

describe("display-face names in the sidebar", () => {
  it("sets Dune's name in Fraunces at the one weight it ships in", () => {
    const { data, getByText } = renderTemplate("dune");
    const name = getByText(data.basicInfo.name);
    expect(name.style.fontFamily).toContain("--font-fraunces");
    expect(name.style.fontWeight).toBe(String(DISPLAY_FONT_WEIGHT.fraunces));
  });

  it("leaves every other sidebar name on its body face", () => {
    for (const theme of TEMPLATES.filter((t) => t.layout === "sidebar" && !t.displayFont)) {
      const { data, getByText, unmount } = renderTemplate(theme.id);
      const name = getByText(data.basicInfo.name);
      expect([theme.id, name.style.fontFamily]).toEqual([theme.id, ""]);
      expect(name.className).toContain("font-semibold");
      unmount();
    }
  });
});

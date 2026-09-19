import { getTheme, isTemplateId, layoutLabel, requestedTemplateId, TEMPLATES, tint } from "./theme";

describe("TEMPLATES", () => {
  it("has 32 templates", () => {
    expect(TEMPLATES).toHaveLength(32);
  });

  it("has a unique id for every template", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every template a unique name, a description, and a source credit", () => {
    const names = TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const theme of TEMPLATES) {
      expect(theme.name.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeLessThanOrEqual(28);
      expect(theme.source.length).toBeGreaterThan(0);
    }
  });

  it("gives every template a unique accent", () => {
    const accents = TEMPLATES.map((t) => t.accent.toLowerCase());
    expect(new Set(accents).size).toBe(accents.length);
  });

  it("matches a catalog snapshot for every template", () => {
    expect(
      TEMPLATES.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        layout: theme.layout,
        accent: theme.accent,
        headingStyle: theme.headingStyle,
        density: theme.density,
        fontDisplay: theme.fontDisplay,
        darkHeader: theme.darkHeader ?? false,
        showAvatar: theme.showAvatar ?? false,
        italicHeadings: theme.italicHeadings ?? false,
        supportsDarkToggle: theme.supportsDarkToggle ?? false,
        sidebarSide: theme.sidebarSide ?? null,
        sidebarStyle: theme.sidebarStyle ?? null,
      })),
    ).toMatchSnapshot();
  });

  it("only uses sidebarSide/sidebarStyle on sidebar-layout templates", () => {
    for (const theme of TEMPLATES) {
      if (theme.layout !== "sidebar") {
        expect(theme.sidebarSide).toBeUndefined();
      }
    }
  });
});

describe("getTheme", () => {
  it("returns the matching theme by id", () => {
    expect(getTheme("bre-creative").name).toBe("Ember");
  });

  it("falls back to the first template for an unknown id", () => {
    expect(getTheme("does-not-exist")).toBe(TEMPLATES[0]);
  });
});

describe("tint", () => {
  it("produces a color-mix expression toward white", () => {
    expect(tint("#7A2E2E", 12)).toBe("color-mix(in srgb, #7A2E2E 12%, white)");
  });

  it("defaults to a light mix weight", () => {
    expect(tint("#000")).toContain("12%");
  });
});

describe("isTemplateId", () => {
  it("accepts catalog ids and rejects anything else", () => {
    expect(isTemplateId("bre-creative")).toBe(true);
    expect(isTemplateId("does-not-exist")).toBe(false);
  });
});

describe("layoutLabel", () => {
  it("names the four layout families", () => {
    expect(layoutLabel("single")).toBe("Single column");
    expect(layoutLabel("sidebar")).toBe("Sidebar");
    expect(layoutLabel("asymmetric")).toBe("Two column");
    expect(layoutLabel("labeled")).toBe("Labeled");
  });
});

describe("requestedTemplateId", () => {
  it("reads a known template from the query string", () => {
    expect(requestedTemplateId("?template=bre-creative")).toBe("bre-creative");
    expect(requestedTemplateId("template=jsonresume-vitae&x=1")).toBe("jsonresume-vitae");
  });

  it("ignores missing or unknown ids", () => {
    expect(requestedTemplateId("")).toBeNull();
    expect(requestedTemplateId("?q=bre-creative")).toBeNull();
    expect(requestedTemplateId("?template=not-a-theme")).toBeNull();
  });
});

import { getTheme, TEMPLATES, tint } from "./theme";

describe("TEMPLATES", () => {
  it("has 21 templates", () => {
    expect(TEMPLATES).toHaveLength(21);
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

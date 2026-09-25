import {
  getTheme,
  headerColor,
  isTemplateId,
  layoutLabel,
  railBackground,
  requestedTemplateId,
  TEMPLATES,
  tint,
} from "./theme";

describe("TEMPLATES", () => {
  it("has 40 templates", () => {
    expect(TEMPLATES).toHaveLength(40);
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
        headerColor: theme.headerColor ?? null,
        railColor: theme.railColor ?? null,
      })),
    ).toMatchSnapshot();
  });

  it("defaults headerColor and the rail tint to the accent", () => {
    const inkwell = getTheme("inkwell");
    expect(headerColor(inkwell)).toBe(inkwell.accent);
    expect(railBackground(inkwell)).toBe(tint(inkwell.accent, 8));
    const tidewater = getTheme("tidewater");
    expect(headerColor(tidewater)).toBe("#0F2A44");
    expect(railBackground(tidewater)).toBe(tint("#0F2A44", 8));
  });

  describe("display order", () => {
    it("keeps Atlas first as the default", () => {
      expect(TEMPLATES[0].id).toBe("jakes-resume");
    });

    it("never puts two sidebar templates next to each other", () => {
      for (let i = 1; i < TEMPLATES.length; i++) {
        const pair = [TEMPLATES[i - 1], TEMPLATES[i]];
        expect(pair.every((t) => t.layout === "sidebar") ? pair.map((t) => t.name) : null).toBeNull();
      }
    });

    it("never runs more than two templates of the same layout in a row", () => {
      for (let i = 2; i < TEMPLATES.length; i++) {
        const run = TEMPLATES.slice(i - 2, i + 1);
        const same = run.every((t) => t.layout === run[0].layout);
        expect(same ? run.map((t) => t.name) : null).toBeNull();
      }
    });

    it("never puts two name-band templates next to each other", () => {
      for (let i = 1; i < TEMPLATES.length; i++) {
        const pair = [TEMPLATES[i - 1], TEMPLATES[i]];
        expect(pair.every((t) => t.darkHeader) ? pair.map((t) => t.name) : null).toBeNull();
      }
    });

    it("keeps the two-tone templates spread out rather than grouped", () => {
      const positions = TEMPLATES.flatMap((t, i) => (t.headerColor ? [i] : []));
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i] - positions[i - 1]).toBeGreaterThanOrEqual(2);
      }
    });

    it("shows at least three layouts in the first six (the home page strip)", () => {
      expect(new Set(TEMPLATES.slice(0, 6).map((t) => t.layout)).size).toBeGreaterThanOrEqual(3);
    });
  });

  it("only uses railColor on sidebar-layout templates", () => {
    for (const theme of TEMPLATES) {
      if (theme.layout !== "sidebar") expect(theme.railColor).toBeUndefined();
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

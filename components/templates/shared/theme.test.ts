import {
  getTheme,
  headerColor,
  isTemplateId,
  layoutLabel,
  railBackground,
  requestedTemplateId,
  canonicalTemplateId,
  DISPLAY_FONT_CSS,
  monogramInitials,
  splitLastWord,
  TEMPLATES,
  tint,
} from "./theme";

describe("TEMPLATES", () => {
  it("has 48 templates", () => {
    expect(TEMPLATES).toHaveLength(48);
  });

  it("has a unique id for every template", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every template a unique name and a description", () => {
    const names = TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const theme of TEMPLATES) {
      expect(theme.name.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeLessThanOrEqual(28);
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
        variant: theme.variant ?? null,
        displayFont: theme.displayFont ?? null,
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
      expect(TEMPLATES[0].id).toBe("atlas");
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
    expect(getTheme("ember").name).toBe("Ember");
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
    expect(isTemplateId("ember")).toBe(true);
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
    expect(requestedTemplateId("?template=ember")).toBe("ember");
    expect(requestedTemplateId("template=nocturne&x=1")).toBe("nocturne");
  });

  it("ignores missing or unknown ids", () => {
    expect(requestedTemplateId("")).toBeNull();
    expect(requestedTemplateId("?q=ember")).toBeNull();
    expect(requestedTemplateId("?template=not-a-theme")).toBeNull();
  });

  it("follows a renamed id so old shared links still open the right template", () => {
    expect(requestedTemplateId("?template=jakes-resume")).toBe("atlas");
    expect(requestedTemplateId("?template=jsonresume-vitae")).toBe("nocturne");
  });
});

describe("bespoke single-column templates", () => {
  const VARIANTS = TEMPLATES.filter((t) => t.variant);

  it("ships the eight, each a single column with its own variant and a second colour", () => {
    expect(VARIANTS.map((t) => t.id).sort()).toEqual(
      ["cameo", "civic", "horizon", "kernel", "laureate", "pivot", "sterling", "tessera"],
    );
    for (const theme of VARIANTS) {
      expect(theme.layout).toBe("single");
      expect(theme.variant).toBe(theme.id);
      expect(theme.headerColor).toBeDefined();
    }
  });

  it("gives every display face a CSS stack", () => {
    for (const theme of VARIANTS) {
      if (theme.displayFont) expect(DISPLAY_FONT_CSS[theme.displayFont]).toMatch(/^var\(--font-/);
    }
  });

  it("spreads the new templates through the gallery rather than grouping them", () => {
    const positions = TEMPLATES.flatMap((t, i) => (t.variant ? [i] : []));
    for (let i = 1; i < positions.length; i++) expect(positions[i] - positions[i - 1]).toBeGreaterThanOrEqual(2);
  });
});

describe("monogramInitials / splitLastWord", () => {
  it("takes the first and last initials", () => {
    expect(monogramInitials("Elena Lindqvist")).toBe("EL");
    expect(monogramInitials("Alexandra Montgomery-Whitfield")).toBe("AM");
    expect(monogramInitials("Cher")).toBe("C");
    expect(monogramInitials("  ")).toBe("?");
  });

  it("splits off the last word for Horizon's italic surname", () => {
    expect(splitLastWord("Alexandra Montgomery-Whitfield")).toEqual(["Alexandra", "Montgomery-Whitfield"]);
    expect(splitLastWord("Ana María López")).toEqual(["Ana María", "López"]);
    expect(splitLastWord("Cher")).toEqual(["", "Cher"]);
  });
});

describe("renamed template ids", () => {
  const RENAMED: Record<string, string> = {
    "jakes-resume": "atlas",
    "bre-cool": "harbor",
    "bre-creative": "ember",
    "bre-green": "grove",
    "bre-purple": "violet",
    "bre-sidebar": "slate",
    "bre-leftright": "aisle",
    "bre-material-dark": "marquee",
    "bre-oblique": "lean",
    "start-bootstrap-resume": "navy",
    "deedy-reversed": "twin",
    billryan: "glyph",
    "online-resume": "folio",
    "simple-cv": "index",
    "rendercv-classic": "thesis",
    "rendercv-sb2nov": "spine",
    "rendercv-moderncv": "campus",
    "rendercv-engineering": "gauge",
    "jsonresume-flat": "air",
    "jsonresume-vitae": "nocturne",
    "jsonresume-futura": "nova",
  };

  it("maps every old id to a live template of the same name", () => {
    for (const [old, current] of Object.entries(RENAMED)) {
      expect(canonicalTemplateId(old)).toBe(current);
      expect(isTemplateId(old)).toBe(true);
      expect(getTheme(old).id).toBe(current);
    }
  });

  it("leaves current ids alone and never lets an old id collide with a live one", () => {
    const ids = new Set(TEMPLATES.map((t) => t.id));
    for (const theme of TEMPLATES) expect(canonicalTemplateId(theme.id)).toBe(theme.id);
    for (const old of Object.keys(RENAMED)) expect(ids.has(old)).toBe(false);
    expect(canonicalTemplateId("not-a-theme")).toBe("not-a-theme");
    expect(canonicalTemplateId("constructor")).toBe("constructor");
  });

  it("uses each template's own display name as its id", () => {
    for (const theme of TEMPLATES) {
      expect(theme.id).toBe(theme.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  });
});

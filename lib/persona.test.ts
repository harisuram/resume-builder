import {
  getNavSectionOrder,
  getSectionMeta,
  getSectionOrder,
  placeSectionAt,
  resolveSectionOrder,
  SECTION_ORDER,
  SUMMARY_COPY,
  resumeSectionTitle,
} from "./persona";
import type { SectionKey } from "./types";

const ALL_KEYS: SectionKey[] = [
  "keyAchievements",
  "education",
  "experience",
  "projects",
  "internships",
  "partTime",
  "skills",
  "certifications",
  "patents",
  "languages",
  "hobbies",
  "softSkills",
  "additional",
];

describe("getSectionOrder", () => {
  it("leads with key achievements, then experience, then education after the work sections", () => {
    const order = getSectionOrder().map((m) => m.key);
    expect(order[0]).toBe("keyAchievements");
    expect(order).toEqual([
      "keyAchievements",
      "experience",
      "internships",
      "partTime",
      "projects",
      "education",
      "skills",
      "certifications",
      "patents",
      "languages",
      "hobbies",
      "softSkills",
      "additional",
    ]);
  });

  it("puts experience ahead of education", () => {
    expect(SECTION_ORDER.indexOf("experience")).toBeLessThan(SECTION_ORDER.indexOf("education"));
  });

  it("exposes every content section", () => {
    const keys = getSectionOrder().map((m) => m.key);
    expect(new Set(keys)).toEqual(new Set(ALL_KEYS));
    expect(keys).toHaveLength(ALL_KEYS.length);
  });
});

describe("resolveSectionOrder", () => {
  it("falls back to the default when no custom order is given", () => {
    const expected = getSectionOrder().map((m) => m.key);
    expect(resolveSectionOrder()).toEqual(expected);
    expect(resolveSectionOrder(null)).toEqual(expected);
    expect(resolveSectionOrder([])).toEqual(expected);
  });

  it("returns the custom order verbatim when one is given", () => {
    const custom: SectionKey[] = ["skills", "experience"];
    expect(resolveSectionOrder(custom)).toBe(custom);
  });
});

describe("placeSectionAt", () => {
  it("moves a key to a later or earlier index without mutating the source", () => {
    const start = [...SECTION_ORDER];
    expect(placeSectionAt(start, "skills", 0)[0]).toBe("skills");
    expect(placeSectionAt(start, "keyAchievements", 2)[2]).toBe("keyAchievements");
    expect(start).toEqual(SECTION_ORDER);
  });

  it("returns the original array when the placement is a no-op", () => {
    expect(placeSectionAt(SECTION_ORDER, "experience", 1)).toBe(SECTION_ORDER);
    expect(placeSectionAt(SECTION_ORDER, "summary" as SectionKey, 0)).toBe(SECTION_ORDER);
  });

  it("clamps an out-of-range index", () => {
    expect(placeSectionAt(SECTION_ORDER, "experience", -4)[0]).toBe("experience");
    expect(placeSectionAt(SECTION_ORDER, "experience", 99).at(-1)).toBe("experience");
  });
});

describe("getNavSectionOrder", () => {
  it("leads with summary, then key achievements, before the rest of the content sections", () => {
    const order = getNavSectionOrder();
    expect(order[0]).toBe("summary");
    expect(order[1]).toBe("keyAchievements");
    expect(order).toHaveLength(14);
  });

  it("uses a custom order for the content sections when given, summary always still leading", () => {
    const custom: SectionKey[] = ["skills", "experience"];
    expect(getNavSectionOrder(custom)).toEqual(["summary", "skills", "experience"]);
  });
});

describe("getSectionMeta", () => {
  it("returns a label and help text for every content section key", () => {
    for (const key of ALL_KEYS) {
      const meta = getSectionMeta(key);
      expect(meta.key).toBe(key);
      expect(meta.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SUMMARY_COPY", () => {
  it("labels the summary step generically so it fits any resume", () => {
    expect(SUMMARY_COPY.label).toBe("Summary");
    expect(SUMMARY_COPY.placeholder.length).toBeGreaterThan(0);
    expect(SUMMARY_COPY.help.length).toBeGreaterThan(0);
  });
});

describe("resumeSectionTitle", () => {
  it("uses the user-supplied additional heading when one is set", () => {
    expect(resumeSectionTitle("additional")).toBe("Additional");
    expect(resumeSectionTitle("additional", { sections: { additional: { heading: "  Publications  " } } })).toBe(
      "Publications",
    );
    expect(resumeSectionTitle("softSkills")).toBe("Soft Skills");
  });
});

import {
  forcedItemIndices,
  getRenderableSections,
  hasForcedPageBreak,
  hasSummary,
  itemBreakKey,
  parseItemBreakKey,
} from "./resume";
import type { ResumeData } from "./types";

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    basicInfo: { name: "", email: "", phone: "", location: "", links: {} },
    sections: {},
    sectionStatus: {},
    templateId: "jakes-resume",
    ...overrides,
  };
}

describe("getRenderableSections", () => {
  it("excludes sections with no content", () => {
    const data = makeData({ sections: { education: [], skills: [] } });
    expect(getRenderableSections(data)).toEqual([]);
  });

  it("includes only sections that have content", () => {
    const data = makeData({
      sections: {
        skills: ["TypeScript"],
        education: [],
      },
    });
    expect(getRenderableSections(data)).toEqual(["skills"]);
  });

  it("excludes a section explicitly marked skipped even if it has content", () => {
    const data = makeData({
      sections: { skills: ["TypeScript"] },
      sectionStatus: { skills: "skipped" },
    });
    expect(getRenderableSections(data)).toEqual([]);
  });

  it("orders renderable sections per the default list", () => {
    const populated = {
      education: [{ institution: "MIT", degree: "B.S.", startDate: "2020-01" }],
      skills: ["Go"],
      certifications: [{ name: "Cert", issuer: "Issuer", date: "2021-01" }],
    };
    const data = makeData({ sections: populated });

    // Default: keyAchievements, experience, internships, partTime, projects, education, skills, certifications
    expect(getRenderableSections(data)).toEqual(["education", "skills", "certifications"]);
  });

  it("treats additional as renderable only when it has items, even if a heading is set", () => {
    const headed = makeData({
      sections: { additional: { heading: "Publications", items: [] } },
    });
    expect(getRenderableSections(headed)).toEqual([]);

    const withItems = makeData({
      sections: {
        additional: {
          heading: "Publications",
          items: [{ title: "A paper", bullets: [] }],
        },
      },
    });
    expect(getRenderableSections(withItems)).toEqual(["additional"]);
  });

  it("places patents, languages, hobbies, soft skills, and additional after certifications", () => {
    const data = makeData({
      sections: {
        certifications: [{ name: "Cert", issuer: "Issuer", date: "2021-01" }],
        patents: [{ title: "A patent" }],
        languages: [{ name: "English", level: "Native" }],
        hobbies: ["Chess"],
        softSkills: ["Mentoring"],
        additional: { heading: "Awards", items: [{ title: "Dean’s list", bullets: [] }] },
      },
    });
    expect(getRenderableSections(data)).toEqual([
      "certifications",
      "patents",
      "languages",
      "hobbies",
      "softSkills",
      "additional",
    ]);
  });

  it("uses the resume's custom section order over the default when one is set", () => {
    const data = makeData({
      sections: {
        skills: ["Go"],
        education: [{ institution: "MIT", degree: "B.S.", startDate: "2020-01" }],
      },
      sectionOrder: ["education", "skills"],
    });
    expect(getRenderableSections(data)).toEqual(["education", "skills"]);
  });
});

describe("hasSummary", () => {
  it("is false when summary is absent", () => {
    expect(hasSummary(makeData())).toBe(false);
  });

  it("is false for a blank/whitespace-only summary", () => {
    expect(hasSummary(makeData({ sections: { summary: "   " } }))).toBe(false);
  });

  it("is true when summary has content", () => {
    expect(hasSummary(makeData({ sections: { summary: "Backend engineer." } }))).toBe(true);
  });

  it("is false when summary has content but is skipped", () => {
    const data = makeData({
      sections: { summary: "Backend engineer." },
      sectionStatus: { summary: "skipped" },
    });
    expect(hasSummary(data)).toBe(false);
  });
});

describe("hasForcedPageBreak", () => {
  it("is false when pageBreakSections is absent", () => {
    expect(hasForcedPageBreak(makeData(), "experience")).toBe(false);
  });

  it("is true only for a section explicitly listed", () => {
    const data = makeData({ pageBreakSections: ["experience"] });
    expect(hasForcedPageBreak(data, "experience")).toBe(true);
    expect(hasForcedPageBreak(data, "education")).toBe(false);
  });
});

describe("item page-break keys", () => {
  it("round-trips a section and index", () => {
    expect(itemBreakKey("projects", 2)).toBe("projects:2");
    expect(parseItemBreakKey("projects:2")).toEqual({ section: "projects", index: 2 });
  });

  it("rejects keys it can't make sense of", () => {
    for (const bad of ["", "projects", "projects:", "projects:x", "projects:-1", ":2"]) {
      expect(parseItemBreakKey(bad)).toBeNull();
    }
  });
});

describe("forcedItemIndices", () => {
  it("is empty when nothing is forced", () => {
    expect(forcedItemIndices(makeData(), "projects")).toEqual(new Set());
  });

  it("returns only the indices belonging to the section asked for", () => {
    const data = makeData({ pageBreakItems: ["projects:2", "projects:0", "experience:1"] });
    expect(forcedItemIndices(data, "projects")).toEqual(new Set([0, 2]));
    expect(forcedItemIndices(data, "experience")).toEqual(new Set([1]));
    expect(forcedItemIndices(data, "education")).toEqual(new Set());
  });

  it("ignores entries it can't parse rather than throwing", () => {
    const data = makeData({ pageBreakItems: ["projects:nope", "projects:1"] });
    expect(forcedItemIndices(data, "projects")).toEqual(new Set([1]));
  });
});

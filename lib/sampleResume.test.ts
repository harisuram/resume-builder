import {
  GALLERY_SAMPLE_RESUME,
  SAMPLE_RESUME,
  sampleResumeForPreview,
  sampleResumeForTemplate,
} from "./sampleResume";
import fs from "node:fs";
import path from "node:path";
import { TEMPLATES } from "@/components/templates/shared/theme";

describe("sampleResumeForPreview", () => {
  it("keeps the selected template and drops skipped sections", () => {
    const sample = sampleResumeForPreview({
      templateId: "ember",
      sectionStatus: { patents: "skipped", summary: "skipped" },
      sectionOrder: undefined,
      sections: {},
    });
    expect(sample.templateId).toBe("ember");
    expect(sample.basicInfo.name).toBe(SAMPLE_RESUME.basicInfo.name);
    expect(sample.sectionStatus.patents).toBe("skipped");
    expect(sample.sectionStatus.summary).toBe("skipped");
    expect(sample.sections.patents).toBeUndefined();
    expect(sample.sections.summary).toBeUndefined();
    expect(sample.sections.experience?.length).toBeGreaterThan(0);
  });

  it("uses a custom additional heading when the user set one", () => {
    const sample = sampleResumeForPreview({
      templateId: "atlas",
      sectionStatus: {},
      sectionOrder: undefined,
      sections: { additional: { heading: "Volunteer work", items: [] } },
    });
    expect(sample.sections.additional?.heading).toBe("Volunteer work");
  });
});

describe("sampleResumeForTemplate", () => {
  it("returns the gallery sample for a template id", () => {
    const sample = sampleResumeForTemplate("inkwell");
    expect(sample.templateId).toBe("inkwell");
    expect(sample.sections.experience).toEqual(GALLERY_SAMPLE_RESUME.sections.experience);
    expect(sample.sections.patents).toBeUndefined();
  });

  /* Each tile is a whole sheet of paper, so the sample has to reach the
   * bottom of one in every layout family — including the two-column ones,
   * which split the same sections over two columns and so run half as far. */
  it("tops the sample up for two-column templates", () => {
    const twoColumn = sampleResumeForTemplate("twin");
    const singleColumn = sampleResumeForTemplate("atlas");

    expect(twoColumn.sections.softSkills).toBeDefined();
    expect(twoColumn.sections.hobbies).toBeDefined();
    expect(twoColumn.sections.additional).toBeDefined();
    expect(twoColumn.sections.projects?.length).toBeGreaterThan(
      singleColumn.sections.projects?.length ?? 0,
    );

    expect(singleColumn.sections.softSkills).toBeUndefined();
    expect(singleColumn.sections.hobbies).toBeUndefined();
  });

  it("fills both halves of a sidebar split", () => {
    const sample = sampleResumeForTemplate("ember");
    // Rail sections (NARROW_SECTION_KEYS) and main-column sections both
    // present, or a sidebar tile shows one full column beside an empty rail.
    expect(sample.sections.education).toBeDefined();
    expect(sample.sections.skills).toBeDefined();
    expect(sample.sections.certifications).toBeDefined();
    expect(sample.sections.experience?.length).toBeGreaterThan(1);
  });
});

describe("sample portraits", () => {
  const photos = TEMPLATES.map((theme) => sampleResumeForTemplate(theme.id).photo ?? "");

  it("gives every template a bundled portrait, mixing men and women", () => {
    for (const src of photos) {
      expect(src).toMatch(/^\/samples\/portraits\/(man|woman)-\d\.\w+$/);
      expect(fs.existsSync(path.join(process.cwd(), "public", src))).toBe(true);
    }
    expect(photos.some((src) => src.includes("/man-"))).toBe(true);
    expect(photos.some((src) => src.includes("/woman-"))).toBe(true);
  });

  it("matches the sample name to the portrait", () => {
    for (const theme of TEMPLATES) {
      const sample = sampleResumeForTemplate(theme.id);
      const expected = sample.photo?.includes("/woman-") ? "Alexandra" : "Alexander";
      expect(sample.basicInfo.name.startsWith(`${expected} `)).toBe(true);
    }
  });
});

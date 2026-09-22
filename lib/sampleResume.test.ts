import {
  GALLERY_SAMPLE_RESUME,
  SAMPLE_RESUME,
  sampleResumeForPreview,
  sampleResumeForTemplate,
} from "./sampleResume";

describe("sampleResumeForPreview", () => {
  it("keeps the selected template and drops skipped sections", () => {
    const sample = sampleResumeForPreview({
      templateId: "bre-creative",
      sectionStatus: { patents: "skipped", summary: "skipped" },
      sectionOrder: undefined,
      sections: {},
    });
    expect(sample.templateId).toBe("bre-creative");
    expect(sample.basicInfo.name).toBe(SAMPLE_RESUME.basicInfo.name);
    expect(sample.sectionStatus.patents).toBe("skipped");
    expect(sample.sectionStatus.summary).toBe("skipped");
    expect(sample.sections.patents).toBeUndefined();
    expect(sample.sections.summary).toBeUndefined();
    expect(sample.sections.experience?.length).toBeGreaterThan(0);
  });

  it("uses a custom additional heading when the user set one", () => {
    const sample = sampleResumeForPreview({
      templateId: "jakes-resume",
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
    const twoColumn = sampleResumeForTemplate("deedy-reversed");
    const singleColumn = sampleResumeForTemplate("jakes-resume");

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
    const sample = sampleResumeForTemplate("bre-creative");
    // Rail sections (NARROW_SECTION_KEYS) and main-column sections both
    // present, or a sidebar tile shows one full column beside an empty rail.
    expect(sample.sections.education).toBeDefined();
    expect(sample.sections.skills).toBeDefined();
    expect(sample.sections.certifications).toBeDefined();
    expect(sample.sections.experience?.length).toBeGreaterThan(1);
  });
});

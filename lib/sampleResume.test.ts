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
  it("returns the lean gallery sample for a template id", () => {
    const sample = sampleResumeForTemplate("inkwell");
    expect(sample.templateId).toBe("inkwell");
    expect(sample.sections.experience).toEqual(GALLERY_SAMPLE_RESUME.sections.experience);
    expect(sample.sections.patents).toBeUndefined();
  });
});

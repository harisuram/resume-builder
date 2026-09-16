import { clearResumeData, hasSavedResumeData, loadResumeData, saveResumeData } from "./storage";
import type { ResumeData } from "./types";

const SAMPLE: ResumeData = {
  basicInfo: { name: "Jamie Rivera", email: "jamie@example.com", phone: "", location: "Austin, TX", links: {} },
  sections: { skills: ["TypeScript"] },
  sectionStatus: { skills: "complete" },
  templateId: "jakes-resume",
};

describe("localStorage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is saved", () => {
    expect(loadResumeData()).toBeNull();
    expect(hasSavedResumeData()).toBe(false);
  });

  it("round-trips data through save and load", () => {
    saveResumeData(SAMPLE);
    expect(hasSavedResumeData()).toBe(true);
    expect(loadResumeData()).toEqual(SAMPLE);
  });

  it("clears the saved copy", () => {
    saveResumeData(SAMPLE);
    clearResumeData();
    expect(hasSavedResumeData()).toBe(false);
    expect(loadResumeData()).toBeNull();
  });

  it("returns null instead of throwing on corrupted JSON", () => {
    localStorage.setItem("resumeData", "{not valid json");
    expect(loadResumeData()).toBeNull();
  });

  it("overwrites a previously saved copy", () => {
    saveResumeData(SAMPLE);
    const updated: ResumeData = { ...SAMPLE, basicInfo: { ...SAMPLE.basicInfo, name: "Changed Name" } };
    saveResumeData(updated);
    expect(loadResumeData()?.basicInfo.name).toBe("Changed Name");
  });
});

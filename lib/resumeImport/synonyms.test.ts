import { isLikelySectionHeading, keyToHeading, normalizeHeading, resolveSectionHeading } from "./synonyms";

describe("resolveSectionHeading", () => {
  it.each([
    ["Work History", "experience"],
    ["WORK EXPERIENCE", "experience"],
    ["Professional Experience", "experience"],
    ["Employment History", "experience"],
    ["Technical Skills", "skills"],
    ["Core Competencies", "skills"],
    ["Programming Languages", "skills"],
    ["Tech Stack", "skills"],
    ["Academic Background", "education"],
    ["Qualifications", "education"],
    ["About Me", "summary"],
    ["Professional Summary", "summary"],
    ["Career Objective", "summary"],
    ["Profile", "summary"],
    ["Key Accomplishments", "keyAchievements"],
    ["Highlights", "keyAchievements"],
    ["Internships", "internships"],
    ["Co-op", "internships"],
    ["Part-time work", "partTime"],
    ["Licenses and Certifications", "certifications"],
    ["Spoken Languages", "languages"],
    ["Language Proficiency", "languages"],
    ["Interests", "hobbies"],
    ["Hobbies & Interests", "hobbies"],
    ["Interpersonal Skills", "softSkills"],
    ["Volunteer Experience", "additional"],
    ["Publications", "additional"],
    ["Awards", "additional"],
    ["Contact Information", "basicInfo"],
    ["References", "skip"],
  ] as const)("maps %s → %s", (heading, key) => {
    expect(resolveSectionHeading(heading)).toBe(key);
  });

  it("does not treat programming languages as spoken languages", () => {
    expect(resolveSectionHeading("Programming Languages")).toBe("skills");
    expect(resolveSectionHeading("Languages")).toBe("languages");
  });

  it("maps camelCase JSON keys the same way as PDF headings", () => {
    expect(resolveSectionHeading(keyToHeading("workExperience"))).toBe("experience");
    expect(resolveSectionHeading(keyToHeading("technicalSkills"))).toBe("skills");
    expect(resolveSectionHeading(keyToHeading("academic_background"))).toBe("education");
  });
});

describe("normalizeHeading", () => {
  it("strips punctuation and ampersands", () => {
    expect(normalizeHeading("Hobbies & Interests:")).toBe("hobbies and interests");
  });
});

describe("isLikelySectionHeading", () => {
  it("accepts known short headings and rejects body copy", () => {
    expect(isLikelySectionHeading("Work History")).toBe(true);
    expect(isLikelySectionHeading("TECHNICAL SKILLS")).toBe(true);
    expect(isLikelySectionHeading("- Shipped billing APIs for Work History")).toBe(false);
    expect(isLikelySectionHeading("A long sentence about my experience with distributed systems at scale.")).toBe(
      false,
    );
  });
});

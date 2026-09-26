import {
  getEducationErrors,
  getLanguageErrors,
  languageKey,
  getExperienceErrors,
  getProjectErrors,
  isBasicInfoValid,
  isSectionValid,
  MAX_SUMMARY_LENGTH,
  validateEmail,
  validateEndDate,
  validateGpa,
  validateLink,
  validateName,
  validatePhone,
  validateSummary,
} from "./validation";
import type { ResumeSections } from "./types";

describe("basic info validators", () => {
  it("requires a name", () => {
    expect(validateName("").valid).toBe(false);
    expect(validateName("Jamie").valid).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(validateEmail("jamie").message).toBe("Enter a valid email address.");
    expect(validateEmail("jamie@example.com").valid).toBe(true);
  });

  it("treats phone as optional but too-short as invalid", () => {
    expect(validatePhone("").valid).toBe(true);
    expect(validatePhone("555").message).toMatch(/at least 7/);
    expect(validatePhone("5550100").valid).toBe(true);
  });

  it("accepts a plausible link and rejects a phrase", () => {
    expect(validateLink("linkedin.com/in/jamie", "LinkedIn").valid).toBe(true);
    expect(validateLink("not a url", "LinkedIn").valid).toBe(false);
    expect(validateLink("", "LinkedIn").valid).toBe(true);
  });

  it("is only valid once required fields and optional formats all pass", () => {
    expect(
      isBasicInfoValid({
        name: "Jamie",
        email: "jamie@example.com",
        phone: "",
        location: "Austin, TX",
        links: {},
      }),
    ).toBe(true);
    expect(
      isBasicInfoValid({
        name: "Jamie",
        email: "nope",
        phone: "",
        location: "Austin, TX",
        links: {},
      }),
    ).toBe(false);
  });
});

describe("section field validators", () => {
  it("rejects an end date before the start date", () => {
    expect(validateEndDate("2022-01", "2021-06").message).toBe("End date cannot be before the start date.");
    expect(validateEndDate("2021-01", "2022-01").valid).toBe(true);
    expect(validateEndDate("", "2022-01").valid).toBe(true);
  });

  it("accepts common GPA formats", () => {
    expect(validateGpa("").valid).toBe(true);
    expect(validateGpa("3.8").valid).toBe(true);
    expect(validateGpa("3.8 / 4.0").valid).toBe(true);
    expect(validateGpa("excellent").valid).toBe(false);
  });

  it("requires company and role on an experience entry", () => {
    const errors = getExperienceErrors({ company: "", role: "", startDate: "", bullets: [""] });
    expect(errors.company).toBe("Enter the company or organization.");
    expect(errors.role).toBe("Enter your role or title.");
  });

  it("requires institution and degree on an education entry", () => {
    const errors = getEducationErrors({ institution: "", degree: "", startDate: "" });
    expect(errors.institution).toBe("Enter the school or institution.");
    expect(errors.degree).toBe("Enter the degree.");
  });

  it("requires a project name, description, and a real link when one is entered", () => {
    expect(getProjectErrors({ name: "", description: "" }).name).toBe("Enter the project name.");
    expect(getProjectErrors({ name: "App", description: "" }).description).toBe("Describe the project.");
    expect(getProjectErrors({ name: "App", description: "Does a thing.", link: "nope" }).link).toMatch(/valid project link/);
  });

  it("caps the summary length", () => {
    expect(validateSummary("").valid).toBe(true);
    expect(validateSummary("A").valid).toBe(true);
    expect(validateSummary("x".repeat(MAX_SUMMARY_LENGTH + 1)).valid).toBe(false);
  });
});

describe("isSectionValid", () => {
  const empty: Partial<ResumeSections> = {};

  it("treats empty sections as incomplete", () => {
    expect(isSectionValid("education", empty)).toBe(false);
    expect(isSectionValid("summary", empty)).toBe(false);
    expect(isSectionValid("skills", { skills: [] })).toBe(false);
  });

  it("requires every list entry to pass its own rules", () => {
    expect(isSectionValid("education", { education: [{ institution: "MIT", degree: "B.S.", startDate: "" }] })).toBe(
      true,
    );
    expect(isSectionValid("education", { education: [{ institution: "MIT", degree: "", startDate: "" }] })).toBe(false);
    expect(
      isSectionValid("experience", {
        experience: [{ company: "Acme", role: "Eng", startDate: "2020-01", endDate: "2019-01", bullets: [""] }],
      }),
    ).toBe(false);
  });
});


describe("duplicate languages", () => {
  const en = { name: "English", level: "Native" as const };

  it("treats case and spacing as the same language", () => {
    expect(languageKey("  English ")).toBe(languageKey("ENGLISH"));
    expect(languageKey("Brazilian  Portuguese")).toBe("brazilian portuguese");
  });

  it("flags only the repeat, never the first mention", () => {
    expect(getLanguageErrors(en, [])).toEqual({});
    expect(getLanguageErrors({ name: " english", level: "Fluent" }, [en]).name).toBe(
      "english is already in your list. Pick another language or remove this one.",
    );
  });

  it("keeps the missing-name error for an empty entry", () => {
    expect(getLanguageErrors({ name: " ", level: "Fluent" }, [en]).name).toBe("Enter the language.");
  });

  it("blocks the section while a language is listed twice", () => {
    expect(isSectionValid("languages", { languages: [en, { name: "Spanish", level: "Fluent" }] })).toBe(true);
    expect(isSectionValid("languages", { languages: [en, { name: "english", level: "Fluent" }] })).toBe(false);
  });
});

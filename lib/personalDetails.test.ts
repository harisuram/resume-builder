import { resolveSectionOrder, SECTION_ORDER } from "./persona";
import { formatDateOfBirth, getRenderableSections, hasSectionContent, personalDetailRows } from "./resume";
import { useBuilderStore } from "./store";
import type { ResumeData, SectionKey } from "./types";
import { getPersonalDetailsErrors, isSectionValid, validateDateOfBirth, validateNationality } from "./validation";
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, type PersonalDetails } from "./types";

const TODAY = new Date(2026, 9, 11);

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    basicInfo: { name: "", email: "", phone: "", location: "", links: {} },
    sections: {},
    sectionStatus: {},
    templateId: "atlas",
    ...overrides,
  };
}

describe("validateDateOfBirth", () => {
  it("accepts a real, plausible birth date and an empty value", () => {
    expect(validateDateOfBirth("1998-03-15", TODAY).valid).toBe(true);
    expect(validateDateOfBirth("2000-02-29", TODAY).valid).toBe(true);
    expect(validateDateOfBirth("", TODAY).valid).toBe(true);
  });

  it("rejects malformed and impossible dates", () => {
    expect(validateDateOfBirth("15/03/1998", TODAY).message).toBe("Enter a date of birth.");
    expect(validateDateOfBirth("2001-02-29", TODAY).message).toBe("Enter a real date.");
    expect(validateDateOfBirth("1998-13-01", TODAY).message).toBe("Enter a real date.");
  });

  it("rejects future dates and ages outside 14–100", () => {
    expect(validateDateOfBirth("2027-01-01", TODAY).message).toBe("Date of birth can't be in the future.");
    expect(validateDateOfBirth("2020-01-01", TODAY).valid).toBe(false);
    expect(validateDateOfBirth("1900-01-01", TODAY).valid).toBe(false);
  });

  it("counts age by birthday, not just by year", () => {
    // Turns 14 tomorrow: still 13 today.
    expect(validateDateOfBirth("2012-10-12", TODAY).valid).toBe(false);
    expect(validateDateOfBirth("2012-10-11", TODAY).valid).toBe(true);
  });
});

describe("personal details validation", () => {
  it("is only complete with at least one valid field", () => {
    expect(isSectionValid("personalDetails", {})).toBe(false);
    expect(isSectionValid("personalDetails", { personalDetails: {} })).toBe(false);
    expect(isSectionValid("personalDetails", { personalDetails: { nationality: "Indian" } })).toBe(true);
    expect(isSectionValid("personalDetails", { personalDetails: { gender: "Male", dateOfBirth: "2001-02-29" } })).toBe(false);
  });

  it("reports an error per bad field", () => {
    const errors = getPersonalDetailsErrors({ dateOfBirth: "nope", nationality: "x".repeat(300) });
    expect(errors.dateOfBirth).toBeDefined();
    expect(errors.nationality).toBeDefined();
    expect(errors.gender).toBeUndefined();
  });
});

describe("personalDetailRows", () => {
  it("prints filled fields in a fixed order with a spelled-out birth date", () => {
    expect(
      personalDetailRows({ nationality: "Indian", maritalStatus: "Married", dateOfBirth: "1998-03-05", gender: "Female" }),
    ).toEqual([
      { label: "Date of birth", value: "5 March 1998" },
      { label: "Gender", value: "Female" },
      { label: "Marital status", value: "Married" },
      { label: "Nationality", value: "Indian" },
    ]);
  });

  it("leaves out empty and whitespace-only fields", () => {
    expect(personalDetailRows({ gender: "  ", nationality: "Emirati" })).toEqual([{ label: "Nationality", value: "Emirati" }]);
    expect(personalDetailRows(undefined)).toEqual([]);
  });

  it("formats birth dates day-month-year and passes odd values through", () => {
    expect(formatDateOfBirth("2001-12-31")).toBe("31 December 2001");
    expect(formatDateOfBirth("someday")).toBe("someday");
  });
});

describe("personal details on the page", () => {
  it("renders only when filled and not skipped", () => {
    expect(hasSectionContent(makeData(), "personalDetails")).toBe(false);
    const filled = makeData({ sections: { personalDetails: { nationality: "Indian" } } });
    expect(getRenderableSections(filled)).toEqual(["personalDetails"]);
    const skipped = makeData({ ...filled, sectionStatus: { personalDetails: "skipped" } });
    expect(getRenderableSections(skipped)).toEqual([]);
  });

  it("sits near the end, after soft skills and before additional, by default", () => {
    expect(SECTION_ORDER.indexOf("personalDetails")).toBe(SECTION_ORDER.indexOf("softSkills") + 1);
    expect(SECTION_ORDER.at(-1)).toBe("additional");
  });

  it("is slotted into a custom order saved before it existed", () => {
    const saved = SECTION_ORDER.filter((key) => key !== "personalDetails").reverse() as SectionKey[];
    const resolved = resolveSectionOrder(saved);
    expect(resolved).toHaveLength(SECTION_ORDER.length);
    expect(resolved.indexOf("personalDetails")).toBe(resolved.indexOf("softSkills") + 1);
    expect(resolved.filter((key) => key !== "personalDetails")).toEqual(saved);
  });
});

describe("updatePersonalDetails", () => {
  beforeEach(() => useBuilderStore.getState().resetStore());

  it("merges fields and marks the section complete", () => {
    const { updatePersonalDetails } = useBuilderStore.getState();
    updatePersonalDetails({ gender: "Male" });
    updatePersonalDetails({ nationality: "Indian" });
    const state = useBuilderStore.getState();
    expect(state.sections.personalDetails).toEqual({ gender: "Male", nationality: "Indian" });
    expect(state.sectionStatus.personalDetails).toBe("complete");
  });

  it("drops a field set back to empty, and un-completes when nothing is left", () => {
    const { updatePersonalDetails } = useBuilderStore.getState();
    updatePersonalDetails({ gender: "Male" });
    updatePersonalDetails({ gender: "" });
    const state = useBuilderStore.getState();
    expect(state.sections.personalDetails).toEqual({});
    expect(state.sectionStatus.personalDetails).toBe("not_started");
  });

  it("stays incomplete while the birth date is invalid", () => {
    useBuilderStore.getState().updatePersonalDetails({ dateOfBirth: "3000-01-01" });
    expect(useBuilderStore.getState().sectionStatus.personalDetails).toBe("not_started");
  });

  it("is wiped by Clear", () => {
    const { updatePersonalDetails, clearSection } = useBuilderStore.getState();
    updatePersonalDetails({ maritalStatus: "Single" });
    clearSection("personalDetails");
    expect(useBuilderStore.getState().sections.personalDetails).toBeUndefined();
  });
});

describe("personal details — strict values", () => {
  it("only accepts gender and marital status from the form's lists", () => {
    for (const gender of GENDER_OPTIONS) expect(getPersonalDetailsErrors({ gender }).gender).toBeUndefined();
    for (const maritalStatus of MARITAL_STATUS_OPTIONS) {
      expect(getPersonalDetailsErrors({ maritalStatus }).maritalStatus).toBeUndefined();
    }
    expect(getPersonalDetailsErrors({ gender: "Robot" }).gender).toBe("Choose a gender from the list, or leave it off.");
    expect(getPersonalDetailsErrors({ maritalStatus: "It's complicated" }).maritalStatus).toBe(
      "Choose a marital status from the list, or leave it off.",
    );
    expect(isSectionValid("personalDetails", { personalDetails: { gender: "Robot" } })).toBe(false);
  });

  it("accepts nationalities written in letters, including multi-word, dual and accented ones", () => {
    for (const value of ["Indian", "New Zealander", "Indian / British", "Ivorian (Côte d’Ivoire)", "Emirati", "Deutsch", "भारतीय"]) {
      expect(validateNationality(value).valid).toBe(true);
    }
  });

  it("rejects nationalities with digits or symbols, or that are too long", () => {
    expect(validateNationality("Indian123").message).toBe("Use letters only, like “Indian”.");
    for (const value of ["<b>Indian</b>", "@home", "-Indian", "x".repeat(61)]) {
      expect(validateNationality(value).valid).toBe(false);
    }
  });

  it("never crashes on non-string values from a corrupted save", () => {
    const corrupt = { dateOfBirth: 19980315, gender: ["Male"], nationality: null } as unknown as PersonalDetails;
    expect(() => getPersonalDetailsErrors(corrupt)).not.toThrow();
    expect(personalDetailRows(corrupt)).toEqual([]);
    expect(isSectionValid("personalDetails", { personalDetails: corrupt })).toBe(false);
    expect(isSectionValid("personalDetails", { personalDetails: "Indian" as unknown as PersonalDetails })).toBe(false);
  });
});

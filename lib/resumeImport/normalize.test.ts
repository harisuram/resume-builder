import {
  mergeImportedResumes,
  normalizeParsedResume,
  normalizePersonalDetails,
  parseDateOfBirth,
  parseLanguageLevel,
  parseResumeMonth,
  splitPhone,
} from "./normalize";

describe("parseResumeMonth", () => {
  it("accepts common resume date formats", () => {
    expect(parseResumeMonth("Jan 2020")).toBe("2020-01");
    expect(parseResumeMonth("January 2020")).toBe("2020-01");
    expect(parseResumeMonth("2020-03")).toBe("2020-03");
    expect(parseResumeMonth("03/2021")).toBe("2021-03");
    expect(parseResumeMonth("2021")).toBe("2021-01");
    expect(parseResumeMonth("Present")).toBeUndefined();
  });
});

describe("splitPhone", () => {
  it("splits an E.164 number into dial code and subscriber digits", () => {
    expect(splitPhone("+1 (555) 010-0199")).toEqual({ phone: "5550100199", phoneCountryCode: "+1" });
    expect(splitPhone("+91 98765 43210")).toEqual({ phone: "9876543210", phoneCountryCode: "+91" });
  });

  it("treats a 10-digit US number as +1", () => {
    expect(splitPhone("9876543210")).toEqual({ phone: "9876543210", phoneCountryCode: "+91" });
  });
});

describe("parseLanguageLevel", () => {
  it("maps CEFR and common labels onto the builder's five levels", () => {
    expect(parseLanguageLevel("Mother tongue")).toBe("Native");
    expect(parseLanguageLevel("C1")).toBe("Fluent");
    expect(parseLanguageLevel("Conversational")).toBe("Intermediate");
    expect(parseLanguageLevel("Beginner")).toBe("Basic");
  });
});

describe("normalizeParsedResume", () => {
  it("maps synonym JSON keys onto builder sections", () => {
    const parsed = normalizeParsedResume({
      basicInfo: { name: "Jamie Lee", email: "jamie@example.com", location: "Austin, TX" },
      workExperience: [
        { company: "Acme", role: "Engineer", startDate: "Jan 2020", current: true, bullets: ["Shipped APIs"] },
      ],
      technicalSkills: ["TypeScript", "Go"],
      academicBackground: [{ institution: "MIT", degree: "B.S.", startDate: "2014", endDate: "2018" }],
    });
    expect(parsed.sections.experience?.[0]).toMatchObject({ company: "Acme", role: "Engineer", startDate: "2020-01" });
    expect(parsed.sections.skills).toEqual(["TypeScript", "Go"]);
    expect(parsed.sections.education?.[0].institution).toBe("MIT");
    expect(parsed.filled).toEqual(expect.arrayContaining(["basicInfo", "experience", "skills", "education"]));
  });

  it("moves intern roles out of experience", () => {
    const parsed = normalizeParsedResume({
      experience: [
        { company: "Acme", role: "Engineer", bullets: ["Shipped"] },
        { company: "Brightline", role: "Software Engineering Intern", bullets: ["Dashboard"] },
      ],
    });
    expect(parsed.sections.experience).toHaveLength(1);
    expect(parsed.sections.internships).toHaveLength(1);
    expect(parsed.sections.internships?.[0].company).toBe("Brightline");
  });
});

describe("mergeImportedResumes", () => {
  it("lets the overlay fill gaps without wiping heuristic-only sections", () => {
    const base = normalizeParsedResume({ skills: ["Go"], experience: [{ company: "Acme", role: "Eng", bullets: ["x"] }] });
    const overlay = normalizeParsedResume({
      basicInfo: { name: "Jamie", email: "jamie@example.com", location: "Austin, TX" },
      skills: ["TypeScript"],
    });
    const merged = mergeImportedResumes(base, overlay);
    expect(merged.basicInfo.name).toBe("Jamie");
    expect(merged.sections.skills).toEqual(["TypeScript"]);
    expect(merged.sections.experience?.[0].company).toBe("Acme");
  });
});


describe("imported languages", () => {
  it("keeps the first mention when a resume lists a language twice", () => {
    const parsed = normalizeParsedResume({
      languages: [
        { name: "English", level: "Native" },
        "Spanish (Fluent)",
        { name: "english", level: "Basic" },
        "SPANISH - Basic",
      ],
    });
    expect(parsed.sections.languages?.map((l) => l.name)).toEqual(["English", "Spanish"]);
    expect(parsed.sections.languages?.[0].level).toBe("Native");
  });
});

describe("personal details import", () => {
  it("reads birth dates in the common written forms", () => {
    expect(parseDateOfBirth("1998-03-15")).toBe("1998-03-15");
    expect(parseDateOfBirth("15/03/1998")).toBe("1998-03-15");
    expect(parseDateOfBirth("15-03-1998")).toBe("1998-03-15");
    expect(parseDateOfBirth("15.3.1998")).toBe("1998-03-15");
    expect(parseDateOfBirth("15th March, 1998")).toBe("1998-03-15");
    expect(parseDateOfBirth("15 Mar 1998")).toBe("1998-03-15");
    expect(parseDateOfBirth("March 15, 1998")).toBe("1998-03-15");
  });

  it("drops dates that aren't plausible birth dates", () => {
    expect(parseDateOfBirth("31/02/1998")).toBeUndefined();
    expect(parseDateOfBirth("01/01/2024")).toBeUndefined();
    expect(parseDateOfBirth("sometime in 1998")).toBeUndefined();
  });

  it("normalizes the model's object, tidying common values", () => {
    expect(
      normalizePersonalDetails({ dateOfBirth: "1998-03-15", gender: "m", maritalStatus: "unmarried", nationality: "Indian" }),
    ).toEqual({ dateOfBirth: "1998-03-15", gender: "Male", maritalStatus: "Single", nationality: "Indian" });
  });

  it("reads 'Label: value' lines and ignores fields it doesn't keep", () => {
    const block = ["Father's Name : R. Kumar", "Date of Birth : 05-08-1999", "Gender - Female", "Marital Status: Married", "• Nationality: Indian", "Address: Pune"].join("\n");
    expect(normalizePersonalDetails(block)).toEqual({
      dateOfBirth: "1999-08-05",
      gender: "Female",
      maritalStatus: "Married",
      nationality: "Indian",
    });
  });

  it("returns undefined when nothing usable is there", () => {
    expect(normalizePersonalDetails("Father's Name: R. Kumar")).toBeUndefined();
    expect(normalizePersonalDetails(null)).toBeUndefined();
  });

  it("maps a personalDetails key from the AI pass into the section", () => {
    const imported = normalizeParsedResume({ personalDetails: { nationality: "Nepali", dob: "1997-01-02" } });
    expect(imported.sections.personalDetails).toEqual({ dateOfBirth: "1997-01-02", nationality: "Nepali" });
    expect(imported.filled).toContain("personalDetails");
  });
});

describe("import validation", () => {
  it("drops gender and marital status values the form can't show", () => {
    expect(normalizePersonalDetails({ gender: "Robot", maritalStatus: "complicated", nationality: "Indian" })).toEqual({
      nationality: "Indian",
    });
    expect(normalizePersonalDetails({ gender: "Woman", maritalStatus: "widower" })).toEqual({
      gender: "Female",
      maritalStatus: "Widowed",
    });
  });

  it("drops a nationality that isn't written in letters", () => {
    expect(normalizePersonalDetails({ nationality: "1234" })).toBeUndefined();
  });

  it("imports grades onto their scale instead of dropping them", () => {
    const imported = normalizeParsedResume({
      education: [
        { institution: "IIT", degree: "B.Tech", gpa: "85%" },
        { institution: "NIT", degree: "M.Tech", gpa: "8.6/10" },
        { institution: "Oxford", degree: "BA", grade: "Upper Second Class Honours (2:1)" },
        { institution: "Nowhere", degree: "BS", gpa: "great" },
      ],
    });
    const grades = imported.sections.education!.map((e) => [e.gpa, e.gradeType]);
    expect(grades).toEqual([
      ["85", "percentage"],
      ["8.6", "cgpa10"],
      ["Upper Second Class Honours (2:1)", "ukClass"],
      [undefined, undefined],
    ]);
  });
});

import {
  mergeImportedResumes,
  normalizeParsedResume,
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
    expect(splitPhone("5550100199")).toEqual({ phone: "5550100199", phoneCountryCode: "+1" });
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

import { defaultGradeType, formatGrade, getGradeScale, GRADE_GROUPS, GRADE_SCALES, inferGrade, isGradeType, validateGrade } from "./grades";
import type { GradeType } from "./types";

describe("GRADE_SCALES", () => {
  it("has unique ids, a known group, and a printable format for every scale", () => {
    const ids = GRADE_SCALES.map((scale) => scale.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const scale of GRADE_SCALES) {
      expect(GRADE_GROUPS).toContain(scale.group);
      expect(isGradeType(scale.id)).toBe(true);
      const sample = scale.kind === "choice" ? scale.options[0] : scale.placeholder;
      expect(scale.format(sample).length).toBeGreaterThan(0);
    }
  });

  it("covers the major systems around the world", () => {
    const ids = GRADE_SCALES.map((scale) => scale.id);
    for (const id of ["gpa4", "cgpa10", "percentage", "outOf20", "outOf110", "germanGrade", "ukClass", "indiaClass", "latinHonors", "ects", "custom"]) {
      expect(ids).toContain(id);
    }
  });

  it("rejects unknown grade types", () => {
    expect(isGradeType("gpa9")).toBe(false);
    expect(isGradeType(undefined)).toBe(false);
  });
});

describe("formatGrade", () => {
  it("prints legacy entries with no scale exactly as before", () => {
    expect(formatGrade({ gpa: "3.9" })).toBe("GPA 3.9");
    expect(formatGrade({ gpa: "3.8 / 4.0" })).toBe("GPA 3.8 / 4.0");
  });

  it("prints nothing when there's no grade", () => {
    expect(formatGrade({ gpa: "", gradeType: "cgpa10" })).toBe("");
    expect(formatGrade({ gradeType: "percentage" })).toBe("");
    expect(formatGrade({ gpa: "   ", gradeType: "gpa4" })).toBe("");
  });

  it.each<[GradeType, string, string]>([
    ["gpa4", "3.8", "GPA 3.8/4.0"],
    ["gpa4.3", "4.1", "GPA 4.1/4.3"],
    ["gpa4.5", "4.2", "GPA 4.2/4.5"],
    ["gpa5", "4.6", "GPA 4.6/5.0"],
    ["gpa7", "6.5", "GPA 6.5/7"],
    ["cgpa10", "8.6", "CGPA 8.6/10"],
    ["percentage", "82.5", "82.5%"],
    ["outOf10", "8", "Grade 8/10"],
    ["outOf20", "15.5", "Grade 15.5/20"],
    ["outOf30", "28", "Average 28/30"],
    ["outOf100", "88", "Average 88/100"],
    ["outOf110", "105", "Final mark 105/110"],
    ["outOf110", "110 cum laude", "Final mark 110/110 cum laude"],
    ["wam", "78", "WAM 78"],
    ["germanGrade", "1.7", "Grade 1.7 (German scale)"],
    ["swissGrade", "5.5", "Grade 5.5/6"],
    ["russianGrade", "4.8", "Average grade 4.8/5"],
    ["letter", "A-", "Grade A-"],
    ["ects", "B", "ECTS grade B"],
    ["ukClass", "Upper Second Class Honours (2:1)", "Upper Second Class Honours (2:1)"],
    ["indiaClass", "First Class with Distinction", "First Class with Distinction"],
    ["latinHonors", "Magna cum laude", "Magna cum laude"],
    ["honours", "First Class Honours", "First Class Honours"],
    ["passFail", "Distinction", "Distinction"],
    ["custom", "Grade 4 (Very good)", "Grade 4 (Very good)"],
  ])("%s %s → %s", (gradeType, gpa, printed) => {
    expect(formatGrade({ gpa: ` ${gpa} `, gradeType })).toBe(printed);
  });
});

describe("validateGrade", () => {
  it("accepts an empty grade on any scale", () => {
    for (const scale of GRADE_SCALES) expect(validateGrade(scale.id, "  ").valid).toBe(true);
  });

  it("keeps the old GPA rule for entries without a scale", () => {
    expect(validateGrade(undefined, "3.8 / 4.0").valid).toBe(true);
    expect(validateGrade(undefined, "great").message).toBe("Enter a GPA like 3.8 or 3.8 / 4.0.");
    expect(validateGrade(undefined, "4.2 / 4.0").message).toBe("The GPA can't be higher than its scale.");
    expect(validateGrade(undefined, "3 / 0").valid).toBe(false);
  });

  it("checks numbers against the scale's range", () => {
    expect(validateGrade("cgpa10", "9.25").valid).toBe(true);
    expect(validateGrade("cgpa10", "10.5")).toEqual({ valid: false, message: "Enter a number from 0 to 10." });
    expect(validateGrade("gpa4", "4.01").valid).toBe(false);
    expect(validateGrade("percentage", "100").valid).toBe(true);
    expect(validateGrade("germanGrade", "0.7")).toEqual({ valid: false, message: "Enter a number from 1 to 5." });
    expect(validateGrade("outOf110", "60").valid).toBe(false);
    expect(validateGrade("gpa4.3", "4.4").message).toBe("Enter a number from 0 to 4.3.");
  });

  it("allows only a short decimal, not text, on numeric scales", () => {
    expect(validateGrade("gpa4", "3.85").valid).toBe(true);
    expect(validateGrade("gpa4", "3.855").valid).toBe(false);
    expect(validateGrade("gpa4", "three").valid).toBe(false);
  });

  it("lets the 110 scale carry its honours suffix", () => {
    expect(validateGrade("outOf110", "110 cum laude").valid).toBe(true);
    expect(validateGrade("outOf110", "110 e lode").valid).toBe(true);
    expect(validateGrade("outOf110", "110 magnificent").valid).toBe(false);
  });

  it("only accepts a listed label on choice scales", () => {
    expect(validateGrade("ukClass", "First Class Honours").valid).toBe(true);
    expect(validateGrade("ukClass", "First").message).toBe("Choose a grade from the list.");
    expect(validateGrade("letter", "A+").valid).toBe(true);
  });

  it("accepts any short text on the custom scale, but caps the length", () => {
    expect(validateGrade("custom", "Sehr gut").valid).toBe(true);
    expect(validateGrade("custom", "x".repeat(41)).valid).toBe(false);
  });
});

describe("defaultGradeType", () => {
  it("picks the scale schools in the visitor's country use", () => {
    expect(defaultGradeType("IN")).toBe("cgpa10");
    expect(defaultGradeType("us")).toBe("gpa4");
    expect(defaultGradeType("GB")).toBe("ukClass");
    expect(defaultGradeType("DE")).toBe("germanGrade");
    expect(defaultGradeType("FR")).toBe("outOf20");
    expect(defaultGradeType("IT")).toBe("outOf110");
  });

  it("falls back to plain GPA for unknown or missing countries", () => {
    expect(defaultGradeType(null)).toBe("gpa");
    expect(defaultGradeType("ZZ")).toBe("gpa");
  });

  it("only maps to scales that exist", () => {
    for (const code of ["IN", "US", "GB", "AU", "NZ", "DE", "CH", "IT", "RU", "CN", "KR", "SG"]) {
      expect(getGradeScale(defaultGradeType(code)).id).toBe(defaultGradeType(code));
    }
  });
});

describe("validateGrade — input forms", () => {
  it("accepts a decimal comma, as written across Europe", () => {
    expect(validateGrade("germanGrade", "1,7").valid).toBe(true);
    expect(validateGrade("outOf20", "15,5").valid).toBe(true);
    expect(formatGrade({ gpa: "1,7", gradeType: "germanGrade" })).toBe("Grade 1,7 (German scale)");
  });

  it("tolerates a typed % on percentages without printing it twice", () => {
    expect(validateGrade("percentage", "82%").valid).toBe(true);
    expect(validateGrade("percentage", "82 %").valid).toBe(true);
    expect(formatGrade({ gpa: "82%", gradeType: "percentage" })).toBe("82%");
    expect(validateGrade("percentage", "101%").valid).toBe(false);
  });

  it("explains that the scale is added automatically when one is typed", () => {
    expect(validateGrade("gpa4", "3.8/4").message).toBe("Enter just the number (0 to 4) — the scale is added for you.");
    expect(validateGrade("cgpa10", "8.6 / 10").valid).toBe(false);
  });

  it("rejects signs, leading zeros, extra decimals and separators", () => {
    for (const value of ["-1", "+3", "03.5", "3.", ".5", "3.555", "1.000,5", "3 .5", "NaN", "Infinity"]) {
      expect(validateGrade("gpa4", value).valid).toBe(false);
    }
    expect(validateGrade("gpa4", "3.5x").message).toBe("Enter a number from 0 to 4, with up to 2 decimals.");
  });

  it("accepts the ends of each range", () => {
    for (const scale of GRADE_SCALES) {
      if (scale.kind !== "number") continue;
      expect(validateGrade(scale.id, String(scale.max)).valid).toBe(true);
      expect(validateGrade(scale.id, String(scale.min)).valid).toBe(true);
    }
  });

  it("never crashes on a non-string saved grade", () => {
    expect(formatGrade({ gpa: 3.8 as unknown as string, gradeType: "gpa4" })).toBe("");
  });
});

describe("inferGrade (imports)", () => {
  it("reads percentages and 'x / max' grades onto their scale", () => {
    expect(inferGrade("85%")).toEqual({ gpa: "85", gradeType: "percentage" });
    expect(inferGrade("CGPA: 8.6/10")).toEqual({ gpa: "8.6", gradeType: "cgpa10" });
    expect(inferGrade("3.7 / 4.0")).toEqual({ gpa: "3.7", gradeType: "gpa4" });
    expect(inferGrade("15,5/20")).toEqual({ gpa: "15,5", gradeType: "outOf20" });
  });

  it("recognises classification labels, case-insensitively", () => {
    expect(inferGrade("first class with distinction")).toEqual({ gpa: "First Class with Distinction", gradeType: "indiaClass" });
    expect(inferGrade("Magna Cum Laude")).toEqual({ gpa: "Magna cum laude", gradeType: "latinHonors" });
  });

  it("keeps a plain number as an unscaled GPA", () => {
    expect(inferGrade("3.9")).toEqual({ gpa: "3.9" });
  });

  it("drops grades that are out of range or unreadable", () => {
    expect(inferGrade("11/10")).toBeUndefined();
    expect(inferGrade("120%")).toBeUndefined();
    expect(inferGrade("excellent")).toBeUndefined();
    expect(inferGrade("A")).toBeUndefined();
    expect(inferGrade("")).toBeUndefined();
  });
});

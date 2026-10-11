import type { Education, GradeType } from "./types";

/** How a grade is entered: a number on a fixed scale, one of a fixed set of
 * labels (UK degree classes, Latin honors), or free text. */
type GradeKind =
  | { kind: "number"; min: number; max: number }
  | { kind: "choice"; options: readonly string[] }
  | { kind: "text" };

export type GradeScale = {
  id: GradeType;
  /** What the dropdown shows. */
  label: string;
  /** Dropdown optgroup. */
  group: GradeGroup;
  placeholder: string;
  /** The printed form, e.g. "CGPA 8.6/10". Gets the trimmed value. */
  format: (value: string) => string;
} & GradeKind;

export const GRADE_GROUPS = ["GPA & CGPA", "Scores & percentages", "National scales", "Classes & honours", "Other"] as const;
export type GradeGroup = (typeof GRADE_GROUPS)[number];

/** Legacy "GPA 3.8 / 4.0" — any number, optionally with its own scale. */
const LEGACY_GPA_PATTERN = /^\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?$/;
/** Up to two decimals; a comma works as the decimal mark too ("1,7" in
 * Germany). No leading zeros, signs, or thousands separators. */
const NUMBER_PATTERN = /^(0|[1-9]\d*)([.,]\d{1,2})?$/;
/** Italy's 110 scale is printed with "cum laude" / "e lode" at the top. */
const HONORS_SUFFIX = /\s+(cum laude|e lode|with honou?rs)$/i;

const MAX_GRADE_LENGTH = 40;

const numberScale = (
  id: GradeType,
  label: string,
  group: GradeGroup,
  min: number,
  max: number,
  placeholder: string,
  format: (value: string) => string,
): GradeScale => ({ id, label, group, kind: "number", min, max, placeholder, format });

const choiceScale = (
  id: GradeType,
  label: string,
  group: GradeGroup,
  options: readonly string[],
  format: (value: string) => string = (value) => value,
): GradeScale => ({ id, label, group, kind: "choice", options, placeholder: "Choose…", format });

export const GRADE_SCALES: readonly GradeScale[] = [
  {
    id: "gpa",
    label: "GPA (any scale)",
    group: "GPA & CGPA",
    kind: "text",
    placeholder: "3.8 / 4.0",
    format: (v) => `GPA ${v}`,
  },
  numberScale("gpa4", "GPA out of 4.0", "GPA & CGPA", 0, 4, "3.8", (v) => `GPA ${v}/4.0`),
  numberScale("gpa4.3", "GPA out of 4.3", "GPA & CGPA", 0, 4.3, "4.0", (v) => `GPA ${v}/4.3`),
  numberScale("gpa4.5", "GPA out of 4.5", "GPA & CGPA", 0, 4.5, "4.1", (v) => `GPA ${v}/4.5`),
  numberScale("gpa5", "GPA out of 5.0", "GPA & CGPA", 0, 5, "4.5", (v) => `GPA ${v}/5.0`),
  numberScale("gpa7", "GPA out of 7", "GPA & CGPA", 0, 7, "6.2", (v) => `GPA ${v}/7`),
  numberScale("cgpa10", "CGPA out of 10", "GPA & CGPA", 0, 10, "8.6", (v) => `CGPA ${v}/10`),
  numberScale("percentage", "Percentage", "Scores & percentages", 0, 100, "82", (v) => `${v.replace(/\s*%$/, "")}%`),
  numberScale("outOf10", "Grade out of 10", "Scores & percentages", 0, 10, "8.5", (v) => `Grade ${v}/10`),
  numberScale("outOf20", "Grade out of 20", "Scores & percentages", 0, 20, "15.5", (v) => `Grade ${v}/20`),
  numberScale("outOf30", "Average out of 30", "Scores & percentages", 0, 30, "28", (v) => `Average ${v}/30`),
  numberScale("outOf100", "Average score out of 100", "Scores & percentages", 0, 100, "86", (v) => `Average ${v}/100`),
  {
    id: "outOf110",
    label: "Final mark out of 110",
    group: "Scores & percentages",
    kind: "number",
    min: 66,
    max: 110,
    placeholder: "110 cum laude",
    format: (v) => {
      const suffix = v.match(HONORS_SUFFIX)?.[0] ?? "";
      return `Final mark ${v.slice(0, v.length - suffix.length)}/110${suffix}`;
    },
  },
  numberScale("wam", "WAM (weighted average mark)", "Scores & percentages", 0, 100, "78", (v) => `WAM ${v}`),
  numberScale("germanGrade", "German grade (1.0 best – 5.0)", "National scales", 1, 5, "1.7", (v) => `Grade ${v} (German scale)`),
  numberScale("swissGrade", "Swiss grade (6 best)", "National scales", 1, 6, "5.25", (v) => `Grade ${v}/6`),
  numberScale("russianGrade", "Grade out of 5 (Russia & CIS)", "National scales", 2, 5, "4.8", (v) => `Average grade ${v}/5`),
  choiceScale(
    "letter",
    "Letter grade (A–F)",
    "National scales",
    ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E", "F"],
    (v) => `Grade ${v}`,
  ),
  choiceScale("ects", "ECTS grade (A–F)", "National scales", ["A", "B", "C", "D", "E", "F"], (v) => `ECTS grade ${v}`),
  choiceScale("ukClass", "UK degree classification", "Classes & honours", [
    "First Class Honours",
    "Upper Second Class Honours (2:1)",
    "Lower Second Class Honours (2:2)",
    "Third Class Honours",
    "Ordinary degree",
  ]),
  choiceScale("indiaClass", "Class / division (India)", "Classes & honours", [
    "First Class with Distinction",
    "First Class",
    "Second Class",
    "Pass Class",
  ]),
  choiceScale("latinHonors", "Latin honors", "Classes & honours", ["Summa cum laude", "Magna cum laude", "Cum laude"]),
  choiceScale("honours", "Honours (Australia & NZ)", "Classes & honours", [
    "First Class Honours",
    "Second Class Honours (Division A)",
    "Second Class Honours (Division B)",
    "Third Class Honours",
  ]),
  choiceScale("passFail", "Distinction / Merit / Pass", "Classes & honours", ["Distinction", "Merit", "Pass"]),
  {
    id: "custom",
    label: "Other (type your own)",
    group: "Other",
    kind: "text",
    placeholder: "e.g. Grade 4 (Very good)",
    format: (v) => v,
  },
];

const BY_ID = new Map(GRADE_SCALES.map((scale) => [scale.id, scale]));

export function isGradeType(value: unknown): value is GradeType {
  return typeof value === "string" && BY_ID.has(value as GradeType);
}

export function getGradeScale(id: GradeType | undefined): GradeScale {
  return BY_ID.get(id ?? "gpa") ?? BY_ID.get("gpa")!;
}

/** The grade as printed on the resume, or "" when there's none. */
export function formatGrade(edu: Pick<Education, "gpa" | "gradeType">): string {
  const value = typeof edu.gpa === "string" ? edu.gpa.trim() : "";
  if (!value) return "";
  return getGradeScale(edu.gradeType).format(value);
}

export interface GradeValidation {
  valid: boolean;
  message?: string;
}

function trimNumber(n: number): string {
  return String(Number(n.toFixed(2)));
}

/** Checks a grade value against its scale. Empty is fine — grades are optional. */
export function validateGrade(type: GradeType | undefined, value: string): GradeValidation {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  if (trimmed.length > MAX_GRADE_LENGTH) {
    return { valid: false, message: `Keep this under ${MAX_GRADE_LENGTH} characters.` };
  }
  const scale = getGradeScale(type);
  switch (scale.kind) {
    case "text":
      if (scale.id === "gpa") {
        if (!LEGACY_GPA_PATTERN.test(trimmed)) return { valid: false, message: "Enter a GPA like 3.8 or 3.8 / 4.0." };
        const [grade, max] = trimmed.split("/").map((part) => Number(part.trim()));
        if (max !== undefined && (max === 0 || grade > max)) {
          return { valid: false, message: "The GPA can't be higher than its scale." };
        }
      }
      return { valid: true };
    case "choice":
      return scale.options.includes(trimmed) ? { valid: true } : { valid: false, message: "Choose a grade from the list." };
    case "number": {
      let numberPart = scale.id === "outOf110" ? trimmed.replace(HONORS_SUFFIX, "") : trimmed;
      if (scale.id === "percentage") numberPart = numberPart.replace(/\s*%$/, "");
      const range = `${trimNumber(scale.min)} to ${trimNumber(scale.max)}`;
      if (numberPart.includes("/")) {
        return { valid: false, message: `Enter just the number (${range}) — the scale is added for you.` };
      }
      const n = Number(numberPart.replace(",", "."));
      if (!NUMBER_PATTERN.test(numberPart)) {
        return { valid: false, message: `Enter a number from ${range}, with up to 2 decimals.` };
      }
      if (n < scale.min || n > scale.max) return { valid: false, message: `Enter a number from ${range}.` };
      return { valid: true };
    }
  }
}

/** The scale most schools in a country use, by ISO 3166 alpha-2 code. Only
 * a starting point for new entries — the user can pick any scale. */
const COUNTRY_GRADE_DEFAULTS: Record<string, GradeType> = {
  IN: "cgpa10",
  US: "gpa4",
  CA: "gpa4",
  GB: "ukClass",
  IE: "ukClass",
  AU: "gpa7",
  NZ: "letter",
  DE: "germanGrade",
  AT: "germanGrade",
  CH: "swissGrade",
  FR: "outOf20",
  BE: "outOf20",
  PT: "outOf20",
  MA: "outOf20",
  TN: "outOf20",
  LB: "outOf20",
  IR: "outOf20",
  IT: "outOf110",
  ES: "outOf10",
  NL: "outOf10",
  GR: "outOf10",
  BR: "outOf10",
  CO: "outOf10",
  MX: "outOf10",
  AR: "outOf10",
  RU: "russianGrade",
  UA: "russianGrade",
  BY: "russianGrade",
  KZ: "russianGrade",
  PL: "russianGrade",
  CN: "outOf100",
  TW: "outOf100",
  TR: "outOf100",
  KR: "gpa4.5",
  JP: "gpa4",
  SG: "gpa5",
  NG: "gpa5",
  GH: "gpa5",
  SA: "gpa5",
  PK: "gpa4",
  BD: "gpa4",
  NP: "gpa4",
  LK: "gpa4",
  MY: "gpa4",
  ID: "gpa4",
  AE: "gpa4",
  QA: "gpa4",
  KW: "gpa4",
  OM: "gpa4",
  BH: "gpa4",
};

export function defaultGradeType(countryIso2: string | null | undefined): GradeType {
  return (countryIso2 && COUNTRY_GRADE_DEFAULTS[countryIso2.toUpperCase()]) || "gpa";
}

const CHOICE_SCALES = GRADE_SCALES.filter((scale) => scale.kind === "choice");

/** Reads a grade as written on an imported resume ("85%", "8.6/10",
 * "3.7 / 4.0", "First Class with Distinction") onto the scale it's on.
 * Undefined when it can't be read as a valid grade. */
export function inferGrade(raw: string): { gpa: string; gradeType?: GradeType } | undefined {
  const text = raw.trim().replace(/^(c?gpa|cgpa|grade|score|percentage)\s*[:\-]?\s*/i, "");
  if (!text) return undefined;
  const lower = text.toLowerCase();
  for (const scale of CHOICE_SCALES) {
    if (scale.kind !== "choice") continue;
    const match = scale.options.find((option) => option.toLowerCase() === lower);
    // Single letters are too ambiguous to read as letter or ECTS grades.
    if (match && match.length > 2) return { gpa: match, gradeType: scale.id };
  }
  const percent = text.match(/^(\d+(?:[.,]\d{1,2})?)\s*%$/);
  if (percent && validateGrade("percentage", percent[1]).valid) return { gpa: percent[1], gradeType: "percentage" };
  const outOf = text.match(/^(\d+(?:[.,]\d{1,2})?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (outOf) {
    const byMax: Record<string, GradeType> = {
      "4": "gpa4", "4.0": "gpa4", "4.3": "gpa4.3", "4.5": "gpa4.5", "5": "gpa5", "5.0": "gpa5", "7": "gpa7",
      "10": "cgpa10", "20": "outOf20", "30": "outOf30", "100": "outOf100", "110": "outOf110",
    };
    const gradeType = byMax[outOf[2]];
    if (gradeType && validateGrade(gradeType, outOf[1]).valid) return { gpa: outOf[1], gradeType };
  }
  if (validateGrade("gpa", text).valid) return { gpa: text };
  return undefined;
}

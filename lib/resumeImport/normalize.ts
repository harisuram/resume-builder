import { COUNTRY_CODES, DEFAULT_DIAL_CODE } from "../countryCodes";
import { SECTION_ORDER } from "../persona";
import type {
  AdditionalItem,
  AdditionalSection,
  BasicInfo,
  Certification,
  Education,
  Experience,
  Language,
  LanguageLevel,
  Patent,
  Project,
  ResumeSections,
  SectionKey,
} from "../types";
import {
  LANGUAGE_LEVELS,
} from "../types";
import {
  MAX_BULLET_LENGTH,
  MAX_CHIP_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  languageKey,
  MAX_FIELD_LENGTH,
  MAX_SUMMARY_LENGTH,
  sanitizePhoneDigits,
  validateGpa,
} from "../validation";
import { keyToHeading, resolveSectionHeading, type ImportTarget } from "./synonyms";

function hasSectionContent(key: SectionKey, sections: Partial<ResumeSections>): boolean {
  const value = sections[key];
  if (key === "additional") {
    const additional = sections.additional;
    return Boolean(additional && (additional.heading.trim() || additional.items.length > 0));
  }
  if (key === "summary") {
    return typeof value === "string" && value.trim().length > 0;
  }
  return Array.isArray(value) && value.length > 0;
}

export interface ImportedResume {
  basicInfo: BasicInfo;
  sections: Partial<ResumeSections>;
  filled: ImportTarget[];
}

const EMPTY_BASIC: BasicInfo = {
  name: "",
  email: "",
  phone: "",
  location: "",
  links: {},
};

const CONTENT_KEYS: SectionKey[] = ["summary", ...SECTION_ORDER];

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const DIAL_CODES = [...new Set(COUNTRY_CODES.map((c) => c.dialCode))].sort((a, b) => b.length - a.length);

export function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? trimmed.slice(0, max).trim() : trimmed;
}

export function isPresentDate(value: string): boolean {
  return /^(present|current|now|ongoing|today)$/i.test(value.trim());
}

/** Coerce a freeform month/year into the `YYYY-MM` month-input format. */
export function parseResumeMonth(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v || isPresentDate(v)) return undefined;

  const iso = /^(\d{4})-(\d{2})$/.exec(v);
  if (iso) {
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12) return v;
  }

  const yyyyMm = /^(\d{4})[/.](\d{1,2})$/.exec(v);
  if (yyyyMm) {
    const month = Number(yyyyMm[2]);
    if (month >= 1 && month <= 12) return `${yyyyMm[1]}-${String(month).padStart(2, "0")}`;
  }

  const mmYyyy = /^(\d{1,2})[/.](\d{4})$/.exec(v);
  if (mmYyyy) {
    const month = Number(mmYyyy[1]);
    if (month >= 1 && month <= 12) return `${mmYyyy[2]}-${String(month).padStart(2, "0")}`;
  }

  const monthYear = /^([a-z]+)\.?\s+(\d{4})$/i.exec(v);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (month) return `${monthYear[2]}-${String(month).padStart(2, "0")}`;
  }

  const yearMonth = /^(\d{4})\s+([a-z]+)\.?$/i.exec(v);
  if (yearMonth) {
    const month = MONTHS[yearMonth[2].toLowerCase()];
    if (month) return `${yearMonth[1]}-${String(month).padStart(2, "0")}`;
  }

  const yearOnly = /^(\d{4})$/.exec(v);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    if (year >= 1950 && year <= 2100) return `${yearOnly[1]}-01`;
  }

  return undefined;
}

export function parseDateRange(text: string): { startDate?: string; endDate?: string; current?: boolean } {
  const current = /(present|current|now|ongoing)/i.test(text);
  const parts = text.split(/\s*(?:–|—|−|&ndash;|to)\s+/i);
  if (parts.length < 2) {
    // "Jan 2020 - Present" with a hyphen needs a date on both sides so we
    // don't split "Co-op" or "T-Mobile".
    const hyphen = text.split(/\s+-\s+/);
    if (hyphen.length >= 2 && parseResumeMonth(hyphen[0])) {
      return {
        startDate: parseResumeMonth(hyphen[0]),
        endDate: current ? undefined : parseResumeMonth(hyphen[hyphen.length - 1]),
        current: current || undefined,
      };
    }
    const only = parseResumeMonth(text);
    return only ? { startDate: only, current: current || undefined } : current ? { current: true } : {};
  }
  return {
    startDate: parseResumeMonth(parts[0]),
    endDate: current ? undefined : parseResumeMonth(parts[parts.length - 1]),
    current: current || undefined,
  };
}

const DATE_RANGE_RE =
  /((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}|\d{1,2}[/.]\d{4}|\d{4}[/.]\d{1,2}|\d{4})\s*(?:–|—|−|-|to)\s*((?:present|current|now|ongoing|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}|\d{1,2}[/.]\d{4}|\d{4}[/.]\d{1,2}|\d{4}))/i;

export function extractDateRangeFromLine(line: string): {
  startDate?: string;
  endDate?: string;
  current?: boolean;
  rest: string;
} | null {
  const match = DATE_RANGE_RE.exec(line);
  if (!match) return null;
  const parsed = parseDateRange(match[0]);
  const rest = `${line.slice(0, match.index)} ${line.slice(match.index + match[0].length)}`
    .replace(/\s+/g, " ")
    .replace(/^[|•·,\s]+|[|•·,\s]+$/g, "")
    .trim();
  return { ...parsed, rest };
}

export function splitPhone(raw: string): { phone: string; phoneCountryCode?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { phone: "" };
  const plus = trimmed.startsWith("+") || /^\+\d/.test(trimmed);
  const allDigits = trimmed.replace(/\D/g, "");
  if (!allDigits) return { phone: "" };

  if (plus) {
    for (const code of DIAL_CODES) {
      const codeDigits = code.slice(1);
      if (allDigits.startsWith(codeDigits)) {
        const rest = allDigits.slice(codeDigits.length);
        if (rest.length >= 7) {
          return { phone: sanitizePhoneDigits(rest), phoneCountryCode: code };
        }
      }
    }
  }

  if (allDigits.length === 11 && allDigits.startsWith("1")) {
    return { phone: sanitizePhoneDigits(allDigits.slice(1)), phoneCountryCode: "+1" };
  }

  if (allDigits.length >= 7) {
    return { phone: sanitizePhoneDigits(allDigits), phoneCountryCode: DEFAULT_DIAL_CODE };
  }
  return { phone: "" };
}

const LEVEL_SYNONYMS: Array<{ level: LanguageLevel; phrases: string[] }> = [
  { level: "Native", phrases: ["native", "mother tongue", "first language", "bilingual", "c2"] },
  { level: "Fluent", phrases: ["fluent", "full professional", "full professional proficiency", "c1"] },
  {
    level: "Professional",
    phrases: ["professional", "professional working", "working professional", "working proficiency", "b2"],
  },
  { level: "Intermediate", phrases: ["intermediate", "conversational", "limited working", "b1"] },
  { level: "Basic", phrases: ["basic", "elementary", "beginner", "a1", "a2"] },
];

export function parseLanguageLevel(value: string | undefined): LanguageLevel {
  const normalized = (value ?? "").toLowerCase().trim();
  if ((LANGUAGE_LEVELS as readonly string[]).includes(value ?? "")) return value as LanguageLevel;
  for (const group of LEVEL_SYNONYMS) {
    if (group.phrases.some((p) => normalized === p || normalized.includes(p))) return group.level;
  }
  return "Professional";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asStringArray(value: unknown, maxLen: number, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) {
      return splitChips(value, maxLen).slice(0, maxItems);
    }
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const text = clip(asString(item), maxLen);
    if (text) out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function splitChips(value: string, maxLen = MAX_CHIP_LENGTH): string[] {
  const parts = value
    .split(/(?:\n+|[,;|•●·]|\/(?![/]))/)
    .map((p) => clip(p.replace(/^[-–—*]\s*/, ""), maxLen))
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some((u) => u.toLowerCase() === part.toLowerCase())) unique.push(part);
  }
  return unique;
}

function optionalClip(value: unknown, max = MAX_FIELD_LENGTH): string | undefined {
  const text = clip(asString(value), max);
  return text || undefined;
}

function normalizeExperience(value: unknown, maxItems = 16): Experience[] {
  if (!Array.isArray(value)) return [];
  const out: Experience[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const company = clip(asString(item.company ?? item.organization ?? item.employer), MAX_FIELD_LENGTH);
    const role = clip(asString(item.role ?? item.title ?? item.position), MAX_FIELD_LENGTH);
    if (!company && !role) continue;
    const dates = parseDateRange(asString(item.dates ?? item.dateRange ?? ""));
    const current = item.current === true || dates.current === true;
    const bullets = asStringArray(item.bullets ?? item.highlights ?? item.responsibilities, MAX_BULLET_LENGTH, 12);
    out.push({
      company: company || role,
      role: role || company,
      startDate: parseResumeMonth(asString(item.startDate)) ?? dates.startDate ?? "",
      endDate: current ? undefined : (parseResumeMonth(asString(item.endDate)) ?? dates.endDate),
      current: current || undefined,
      bullets,
    });
    if (out.length >= maxItems) break;
  }
  return out;
}

function normalizeEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) return [];
  const out: Education[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const institution = clip(asString(item.institution ?? item.school ?? item.university), MAX_FIELD_LENGTH);
    const degree = clip(asString(item.degree ?? item.qualification), MAX_FIELD_LENGTH);
    if (!institution && !degree) continue;
    const dates = parseDateRange(asString(item.dates ?? item.dateRange ?? ""));
    const gpaRaw = clip(asString(item.gpa), 20);
    const gpa = gpaRaw && validateGpa(gpaRaw).valid ? gpaRaw : undefined;
    out.push({
      institution: institution || degree,
      degree: degree || institution,
      fieldOfStudy: optionalClip(item.fieldOfStudy ?? item.field ?? item.major),
      startDate: parseResumeMonth(asString(item.startDate)) ?? dates.startDate ?? "",
      endDate: parseResumeMonth(asString(item.endDate)) ?? dates.endDate,
      gpa,
      coursework: asStringArray(item.coursework ?? item.courses, MAX_CHIP_LENGTH, 12),
    });
    if (out.length >= 10) break;
  }
  return out;
}

function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return [];
  const out: Project[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const name = clip(asString(item.name ?? item.title), MAX_FIELD_LENGTH);
    const description = clip(asString(item.description ?? item.summary), MAX_DESCRIPTION_LENGTH);
    if (!name && !description) continue;
    out.push({
      name: name || "Project",
      description: description || name,
      link: optionalClip(item.link ?? item.url),
      technologies: asStringArray(item.technologies ?? item.tech ?? item.stack, MAX_CHIP_LENGTH, 16),
    });
    if (out.length >= 12) break;
  }
  return out;
}

function normalizeCertifications(value: unknown): Certification[] {
  if (!Array.isArray(value)) return [];
  const out: Certification[] = [];
  for (const raw of value) {
    if (typeof raw === "string") {
      const name = clip(raw, MAX_FIELD_LENGTH);
      if (name) out.push({ name, issuer: name, date: "" });
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const name = clip(asString(item.name ?? item.title), MAX_FIELD_LENGTH);
    const issuer = clip(asString(item.issuer ?? item.organization ?? item.body), MAX_FIELD_LENGTH);
    if (!name) continue;
    out.push({
      name,
      issuer: issuer || name,
      date: parseResumeMonth(asString(item.date ?? item.issued)) ?? "",
    });
    if (out.length >= 16) break;
  }
  return out;
}

function normalizePatents(value: unknown): Patent[] {
  if (!Array.isArray(value)) return [];
  const out: Patent[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const title = clip(asString(item.title ?? item.name), MAX_FIELD_LENGTH);
    if (!title) continue;
    out.push({
      title,
      number: optionalClip(item.number ?? item.patentNumber),
      date: parseResumeMonth(asString(item.date)),
      office: optionalClip(item.office ?? item.issuer),
      link: optionalClip(item.link ?? item.url),
    });
    if (out.length >= 10) break;
  }
  return out;
}

function normalizeLanguages(value: unknown): Language[] {
  if (!Array.isArray(value)) return [];
  const out: Language[] = [];
  // A resume that lists a language twice imports it once (first mention wins),
  // so the section doesn't open with a duplicate error.
  const seen = new Set<string>();
  const add = (lang: Language) => {
    const key = languageKey(lang.name);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(lang);
  };
  for (const raw of value) {
    if (typeof raw === "string") {
      const parsed = parseLanguageLine(raw);
      if (parsed) add(parsed);
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const name = clip(asString(item.name ?? item.language), MAX_FIELD_LENGTH);
    if (!name) continue;
    add({ name, level: parseLanguageLevel(asString(item.level ?? item.proficiency)) });
    if (out.length >= 12) break;
  }
  return out;
}

export function parseLanguageLine(line: string): Language | null {
  const trimmed = line.replace(/^[-–—*•]\s*/, "").trim();
  if (!trimmed) return null;
  const split = trimmed.split(/\s*[-–—,:()]\s*/).filter(Boolean);
  const name = clip(split[0] ?? "", MAX_FIELD_LENGTH);
  if (!name) return null;
  const level = split[1] ? parseLanguageLevel(split[1]) : "Professional";
  return { name, level };
}

function normalizeAdditional(value: unknown, fallbackHeading?: string): AdditionalSection | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const items = normalizeAdditionalItems(value);
    if (!items.length) return undefined;
    return { heading: clip(fallbackHeading ?? "Additional", MAX_FIELD_LENGTH), items };
  }
  if (typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const items = normalizeAdditionalItems(obj.items ?? obj.entries);
  if (!items.length) return undefined;
  return {
    heading: clip(asString(obj.heading ?? obj.title ?? fallbackHeading ?? "Additional"), MAX_FIELD_LENGTH),
    items,
  };
}

function normalizeAdditionalItems(value: unknown): AdditionalItem[] {
  if (!Array.isArray(value)) return [];
  const out: AdditionalItem[] = [];
  for (const raw of value) {
    if (typeof raw === "string") {
      const title = clip(raw, MAX_FIELD_LENGTH);
      if (title) out.push({ title, bullets: [] });
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const title = clip(asString(item.title ?? item.name), MAX_FIELD_LENGTH);
    if (!title) continue;
    out.push({
      title,
      subtitle: optionalClip(item.subtitle ?? item.organization ?? item.issuer),
      date: optionalClip(item.date, 40),
      bullets: asStringArray(item.bullets, MAX_BULLET_LENGTH, 8),
    });
    if (out.length >= 16) break;
  }
  return out;
}

function normalizeBasicInfo(raw: unknown): BasicInfo {
  if (!raw || typeof raw !== "object") return { ...EMPTY_BASIC, links: {} };
  const item = raw as Record<string, unknown>;
  const linksRaw = item.links && typeof item.links === "object" ? (item.links as Record<string, unknown>) : {};
  const parsedPhone = splitPhone(asString(item.phone ?? item.phoneNumber));
  const email = clip(asString(item.email), MAX_FIELD_LENGTH);
  return {
    name: clip(asString(item.name ?? item.fullName), MAX_FIELD_LENGTH),
    email,
    phone: parsedPhone.phone,
    phoneCountryCode: asString(item.phoneCountryCode) || parsedPhone.phoneCountryCode,
    location: clip(asString(item.location ?? item.city), MAX_FIELD_LENGTH),
    links: {
      linkedin: optionalClip(linksRaw.linkedin ?? item.linkedin),
      github: optionalClip(linksRaw.github ?? item.github),
      portfolio: optionalClip(linksRaw.portfolio ?? item.website ?? item.url),
    },
  };
}

function assignSection(sections: Partial<ResumeSections>, key: SectionKey, value: unknown, extraHeading?: string) {
  switch (key) {
    case "summary": {
      const text = clip(asString(value), MAX_SUMMARY_LENGTH);
      if (text) sections.summary = text;
      return;
    }
    case "keyAchievements": {
      const items = asStringArray(value, MAX_BULLET_LENGTH, 12);
      if (items.length) sections.keyAchievements = items;
      return;
    }
    case "skills":
    case "hobbies":
    case "softSkills": {
      const items = asStringArray(value, MAX_CHIP_LENGTH, 40);
      if (items.length) sections[key] = items;
      return;
    }
    case "education": {
      const items = normalizeEducation(value);
      if (items.length) sections.education = items;
      return;
    }
    case "experience":
    case "internships":
    case "partTime": {
      const items = normalizeExperience(value);
      if (items.length) sections[key] = items;
      return;
    }
    case "projects": {
      const items = normalizeProjects(value);
      if (items.length) sections.projects = items;
      return;
    }
    case "certifications": {
      const items = normalizeCertifications(value);
      if (items.length) sections.certifications = items;
      return;
    }
    case "patents": {
      const items = normalizePatents(value);
      if (items.length) sections.patents = items;
      return;
    }
    case "languages": {
      const items = normalizeLanguages(value);
      if (items.length) sections.languages = items;
      return;
    }
    case "additional": {
      const additional = normalizeAdditional(value, extraHeading);
      if (additional) {
        const existing = sections.additional;
        if (!existing) {
          sections.additional = additional;
        } else {
          sections.additional = {
            heading: existing.heading || additional.heading,
            items: [...existing.items, ...additional.items].slice(0, 16),
          };
        }
      }
      return;
    }
  }
}

function redistributeJobs(sections: Partial<ResumeSections>) {
  const experience = sections.experience;
  if (!experience?.length) return;
  const kept: Experience[] = [];
  const internships = [...(sections.internships ?? [])];
  const partTime = [...(sections.partTime ?? [])];
  for (const item of experience) {
    const blob = `${item.role} ${item.company}`.toLowerCase();
    if (/\bintern(ship)?\b|\bco-?op\b/.test(blob)) {
      internships.push(item);
    } else if (/\bpart[-\s]?time\b/.test(blob)) {
      partTime.push(item);
    } else {
      kept.push(item);
    }
  }
  if (kept.length) sections.experience = kept;
  else delete sections.experience;
  if (internships.length) sections.internships = internships;
  if (partTime.length) sections.partTime = partTime;
}

function hasBasicInfo(basicInfo: BasicInfo): boolean {
  return Boolean(
    basicInfo.name ||
      basicInfo.email ||
      basicInfo.phone ||
      basicInfo.location ||
      basicInfo.links.linkedin ||
      basicInfo.links.github ||
      basicInfo.links.portfolio,
  );
}

export function filledTargetsOf(basicInfo: BasicInfo, sections: Partial<ResumeSections>): ImportTarget[] {
  const filled: ImportTarget[] = [];
  if (hasBasicInfo(basicInfo)) filled.push("basicInfo");
  for (const key of CONTENT_KEYS) {
    if (hasSectionContent(key, sections)) filled.push(key);
  }
  return filled;
}

/**
 * Coerce model JSON or a heuristic object into something the store can apply.
 * Unknown keys are mapped through the same synonym table as PDF headings.
 */
export function normalizeParsedResume(raw: unknown): ImportedResume {
  const root = unwrapResume(raw);
  const sections: Partial<ResumeSections> = {};
  const basicInfo = normalizeBasicInfo(root.basicInfo ?? root.contact ?? root.basic_info);

  const nested = root.sections && typeof root.sections === "object" ? (root.sections as Record<string, unknown>) : {};
  const combined: Record<string, unknown> = { ...nested };
  for (const [key, value] of Object.entries(root)) {
    if (key === "sections" || key === "basicInfo" || key === "contact" || key === "basic_info" || key === "filled") {
      continue;
    }
    if (!(key in combined)) combined[key] = value;
  }

  for (const [key, value] of Object.entries(combined)) {
    if (value == null) continue;
    if (CONTENT_KEYS.includes(key as SectionKey)) {
      assignSection(sections, key as SectionKey, value);
      continue;
    }
    const resolved = resolveSectionHeading(keyToHeading(key));
    if (!resolved || resolved === "skip" || resolved === "basicInfo") continue;
    assignSection(sections, resolved, value, resolved === "additional" ? keyToHeading(key) : undefined);
  }

  redistributeJobs(sections);

  return {
    basicInfo,
    sections,
    filled: filledTargetsOf(basicInfo, sections),
  };
}

function unwrapResume(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  if (obj.resume && typeof obj.resume === "object") return obj.resume as Record<string, unknown>;
  if (obj.data && typeof obj.data === "object") return obj.data as Record<string, unknown>;
  return obj;
}

export function mergeImportedResumes(base: ImportedResume, overlay: ImportedResume): ImportedResume {
  const basicInfo: BasicInfo = {
    name: overlay.basicInfo.name || base.basicInfo.name,
    email: overlay.basicInfo.email || base.basicInfo.email,
    phone: overlay.basicInfo.phone || base.basicInfo.phone,
    phoneCountryCode: overlay.basicInfo.phoneCountryCode || base.basicInfo.phoneCountryCode,
    location: overlay.basicInfo.location || base.basicInfo.location,
    links: {
      linkedin: overlay.basicInfo.links.linkedin || base.basicInfo.links.linkedin,
      github: overlay.basicInfo.links.github || base.basicInfo.links.github,
      portfolio: overlay.basicInfo.links.portfolio || base.basicInfo.links.portfolio,
    },
  };
  const sections: Partial<ResumeSections> = { ...base.sections };
  for (const key of CONTENT_KEYS) {
    if (hasSectionContent(key, overlay.sections)) {
      (sections as Record<string, unknown>)[key] = overlay.sections[key];
    }
  }
  return { basicInfo, sections, filled: filledTargetsOf(basicInfo, sections) };
}

import type {
  AdditionalItem,
  AdditionalSection,
  BasicInfo,
  Certification,
  Education,
  Experience,
  Language,
  Patent,
  Project,
  ResumeSections,
  SectionKey,
} from "./types";

/** Shared cap for names, titles, locations, and similar single-line fields. */
export const MAX_FIELD_LENGTH = 200;

/** Skills, hobbies, coursework, and other chips — short on purpose. */
export const MAX_CHIP_LENGTH = 80;

/** One experience / additional-section bullet. */
export const MAX_BULLET_LENGTH = 400;

/** Project write-up. */
export const MAX_DESCRIPTION_LENGTH = 600;

/** Professional summary. */
export const MAX_SUMMARY_LENGTH = 800;

/** E.164 allows up to 15 digits total (country code + subscriber number);
 * since the dial code is stored separately, the subscriber number alone is
 * capped well under that, with 7 as a floor beneath which no real phone
 * number falls. */
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Domain(.tld) optionally followed by a path — covers bare domains
 * ("yourname.example.com") and full URLs ("https://linkedin.com/in/jordan") alike. */
const URL_PATTERN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

const GPA_PATTERN = /^\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?$/;

export interface FieldValidation {
  valid: boolean;
  message?: string;
}

const ok: FieldValidation = { valid: true };

function tooLong(value: string, max = MAX_FIELD_LENGTH): FieldValidation | null {
  return value.length > max ? { valid: false, message: `Keep it under ${max} characters.` } : null;
}

function required(value: string, message: string, max = MAX_FIELD_LENGTH): FieldValidation {
  if (!value.trim()) return { valid: false, message };
  return tooLong(value, max) ?? ok;
}

function optionalText(value: string, max = MAX_FIELD_LENGTH): FieldValidation {
  if (!value.trim()) return ok;
  return tooLong(value, max) ?? ok;
}

function hasAnyError(errors: object): boolean {
  return Object.values(errors).some((value) => {
    if (Array.isArray(value)) return value.some(Boolean);
    return Boolean(value);
  });
}

export function validateName(value: string): FieldValidation {
  return required(value, "Enter your full name.");
}

export function validateEmail(value: string): FieldValidation {
  if (!value.trim()) return { valid: false, message: "Enter your email address." };
  const long = tooLong(value);
  if (long) return long;
  if (!EMAIL_PATTERN.test(value.trim())) return { valid: false, message: "Enter a valid email address." };
  return ok;
}

export function validateLocation(value: string): FieldValidation {
  return required(value, "Enter your city and state (or country).");
}

/** Strips everything but digits, and caps length as the user types — the
 * phone field only ever holds digits, with the dial code kept separately. */
export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);
}

/** Phone is optional, but a partially-entered one still has to be a real
 * number: digits only, and long enough to be plausible. */
export function validatePhone(value: string): FieldValidation {
  if (!value) return ok;
  if (!/^\d+$/.test(value)) return { valid: false, message: "Numbers only — no spaces, dashes, or symbols." };
  if (value.length < PHONE_MIN_DIGITS) return { valid: false, message: `Enter at least ${PHONE_MIN_DIGITS} digits.` };
  if (value.length > PHONE_MAX_DIGITS) return { valid: false, message: `Enter at most ${PHONE_MAX_DIGITS} digits.` };
  return ok;
}

/** Every basic-info link is optional, but one that's filled in has to look
 * like an actual link. */
export function validateLink(value: string, label: string): FieldValidation {
  if (!value.trim()) return ok;
  const long = tooLong(value);
  if (long) return long;
  if (!URL_PATTERN.test(value.trim())) {
    return { valid: false, message: `Enter a valid ${label} link, like ${label.toLowerCase()}.com/you.` };
  }
  return ok;
}

export interface BasicInfoErrors {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links: { linkedin?: string; github?: string; portfolio?: string };
}

export function getBasicInfoErrors(basicInfo: BasicInfo): BasicInfoErrors {
  return {
    name: validateName(basicInfo.name).message,
    email: validateEmail(basicInfo.email).message,
    phone: validatePhone(basicInfo.phone).message,
    location: validateLocation(basicInfo.location).message,
    links: {
      linkedin: validateLink(basicInfo.links.linkedin ?? "", "LinkedIn").message,
      github: validateLink(basicInfo.links.github ?? "", "GitHub").message,
      portfolio: validateLink(basicInfo.links.portfolio ?? "", "Portfolio").message,
    },
  };
}

/** True once every required field is filled in correctly and every optional
 * field is either empty or correct — the gate the wizard's Next button (and
 * the section nav's Complete badge) uses for basic info. */
export function isBasicInfoValid(basicInfo: BasicInfo): boolean {
  const errors = getBasicInfoErrors(basicInfo);
  return (
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.location &&
    !errors.links.linkedin &&
    !errors.links.github &&
    !errors.links.portfolio
  );
}

export function validateEndDate(startDate: string, endDate: string): FieldValidation {
  if (!endDate) return ok;
  if (startDate && endDate < startDate) {
    return { valid: false, message: "End date cannot be before the start date." };
  }
  return ok;
}

export function validateGpa(value: string): FieldValidation {
  if (!value.trim()) return ok;
  const long = tooLong(value, 20);
  if (long) return long;
  if (!GPA_PATTERN.test(value.trim())) {
    return { valid: false, message: "Enter a GPA like 3.8 or 3.8 / 4.0." };
  }
  return ok;
}

export function validateChip(value: string, label = "item"): FieldValidation {
  if (!value.trim()) return { valid: false, message: `Enter a ${label}.` };
  return tooLong(value, MAX_CHIP_LENGTH) ?? ok;
}

export function validateSummary(value: string): FieldValidation {
  if (!value.trim()) return ok;
  return tooLong(value, MAX_SUMMARY_LENGTH) ?? ok;
}

export function validateBullet(value: string): FieldValidation {
  if (!value.trim()) return ok;
  return tooLong(value, MAX_BULLET_LENGTH) ?? ok;
}

export function validateAchievement(value: string): FieldValidation {
  return required(value, "Enter an achievement, or remove this line.", MAX_BULLET_LENGTH);
}

export function validateDescription(value: string, emptyMessage: string): FieldValidation {
  return required(value, emptyMessage, MAX_DESCRIPTION_LENGTH);
}

export interface ExperienceErrors {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  bullets: Array<string | undefined>;
}

export function getExperienceErrors(item: Experience): ExperienceErrors {
  return {
    company: required(item.company, "Enter the company or organization.").message,
    role: required(item.role, "Enter your role or title.").message,
    endDate: item.current ? undefined : validateEndDate(item.startDate, item.endDate ?? "").message,
    bullets: item.bullets.map((bullet) => validateBullet(bullet).message),
  };
}

export function isExperienceItemValid(item: Experience): boolean {
  return !hasAnyError(getExperienceErrors(item));
}

export interface EducationErrors {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  endDate?: string;
  gpa?: string;
}

export function getEducationErrors(item: Education): EducationErrors {
  return {
    institution: required(item.institution, "Enter the school or institution.").message,
    degree: required(item.degree, "Enter the degree.").message,
    fieldOfStudy: optionalText(item.fieldOfStudy ?? "").message,
    endDate: validateEndDate(item.startDate, item.endDate ?? "").message,
    gpa: validateGpa(item.gpa ?? "").message,
  };
}

export function isEducationItemValid(item: Education): boolean {
  return !hasAnyError(getEducationErrors(item));
}

export interface ProjectErrors {
  name?: string;
  description?: string;
  link?: string;
}

export function getProjectErrors(item: Project): ProjectErrors {
  return {
    name: required(item.name, "Enter the project name.").message,
    description: validateDescription(item.description, "Describe the project.").message,
    link: validateLink(item.link ?? "", "project").message,
  };
}

export function isProjectItemValid(item: Project): boolean {
  return !hasAnyError(getProjectErrors(item));
}

export interface CertificationErrors {
  name?: string;
  issuer?: string;
}

export function getCertificationErrors(item: Certification): CertificationErrors {
  return {
    name: required(item.name, "Enter the certification name.").message,
    issuer: required(item.issuer, "Enter the issuing organization.").message,
  };
}

export function isCertificationItemValid(item: Certification): boolean {
  return !hasAnyError(getCertificationErrors(item));
}

export interface PatentErrors {
  title?: string;
  number?: string;
  office?: string;
  link?: string;
}

export function getPatentErrors(item: Patent): PatentErrors {
  return {
    title: required(item.title, "Enter the patent title.").message,
    number: optionalText(item.number ?? "").message,
    office: optionalText(item.office ?? "").message,
    link: validateLink(item.link ?? "", "patent").message,
  };
}

export function isPatentItemValid(item: Patent): boolean {
  return !hasAnyError(getPatentErrors(item));
}

export interface LanguageErrors {
  name?: string;
}

/** Case- and space-insensitive: "English", " english " and "ENGLISH" are one language. */
export function languageKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/** Same language listed earlier in the section, if any. */
export function findDuplicateLanguage(item: Language, earlier: readonly Language[]): Language | undefined {
  const key = languageKey(item.name);
  return key ? earlier.find((other) => languageKey(other.name) === key) : undefined;
}

export function duplicateLanguageMessage(name: string): string {
  return `${name.trim()} is already in your list. Pick another language or remove this one.`;
}

/** `earlier` is the entries above this one: only a repeat is flagged, so the
 * first mention of a language stays valid. */
export function getLanguageErrors(item: Language, earlier: readonly Language[] = []): LanguageErrors {
  const missing = required(item.name, "Enter the language.").message;
  if (missing) return { name: missing };
  return findDuplicateLanguage(item, earlier) ? { name: duplicateLanguageMessage(item.name) } : {};
}

/** Shaped for `Array.prototype.every`, which passes the index and list. */
export function isLanguageItemValid(item: Language, index = 0, list: readonly Language[] = []): boolean {
  return !hasAnyError(getLanguageErrors(item, list.slice(0, index)));
}

export interface AdditionalItemErrors {
  title?: string;
  subtitle?: string;
  date?: string;
  bullets: Array<string | undefined>;
}

export function getAdditionalItemErrors(item: AdditionalItem): AdditionalItemErrors {
  return {
    title: required(item.title, "Enter a title for this entry.").message,
    subtitle: optionalText(item.subtitle ?? "").message,
    date: optionalText(item.date ?? "").message,
    bullets: item.bullets.map((bullet) => validateBullet(bullet).message),
  };
}

export function getAdditionalHeadingError(heading: string): string | undefined {
  return optionalText(heading).message;
}

export function isAdditionalItemValid(item: AdditionalItem): boolean {
  return !hasAnyError(getAdditionalItemErrors(item));
}

function isFilledList<T>(value: unknown, isItemValid: (item: T) => boolean): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(isItemValid);
}

export function isAdditionalSectionValid(section: AdditionalSection | undefined): boolean {
  if (!section || section.items.length === 0) return false;
  if (getAdditionalHeadingError(section.heading)) return false;
  return section.items.every(isAdditionalItemValid);
}

/** Whether a content section has at least one valid, complete entry — the
 * same gate the wizard's Next button and the nav's complete-dot use. Empty
 * is not valid (Skip is how you pass an unused section); a half-filled
 * entry is not valid either. */
export function isSectionValid(key: SectionKey, sections: Partial<ResumeSections>): boolean {
  const value = sections[key];
  switch (key) {
    case "summary":
      return typeof value === "string" && value.trim().length > 0 && validateSummary(value).valid;
    case "keyAchievements":
      return isFilledList(value, (item: string) => validateAchievement(item).valid);
    case "skills":
    case "hobbies":
    case "softSkills":
      return isFilledList(value, (item: string) => validateChip(item).valid);
    case "education":
      return isFilledList(value, isEducationItemValid);
    case "experience":
    case "internships":
    case "partTime":
      return isFilledList(value, isExperienceItemValid);
    case "projects":
      return isFilledList(value, isProjectItemValid);
    case "certifications":
      return isFilledList(value, isCertificationItemValid);
    case "patents":
      return isFilledList(value, isPatentItemValid);
    case "languages":
      return isFilledList(value, isLanguageItemValid);
    case "additional":
      return isAdditionalSectionValid(value && typeof value === "object" && "items" in value ? value : undefined);
  }
}

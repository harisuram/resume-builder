import type { BasicInfo } from "./types";

/** Shared cap for every free-text basic-info field — generous enough for a
 * real name/location/URL, tight enough to keep a resume layout from
 * breaking on a pasted paragraph. */
export const MAX_FIELD_LENGTH = 200;

/** E.164 allows up to 15 digits total (country code + subscriber number);
 * since the dial code is stored separately, the subscriber number alone is
 * capped well under that, with 7 as a floor beneath which no real phone
 * number falls. */
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Domain(.tld) optionally followed by a path — covers bare domains
 * ("jordanlee.dev") and full URLs ("https://linkedin.com/in/jordan") alike. */
const URL_PATTERN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export interface FieldValidation {
  valid: boolean;
  message?: string;
}

const ok: FieldValidation = { valid: true };

function tooLong(value: string): FieldValidation | null {
  return value.length > MAX_FIELD_LENGTH
    ? { valid: false, message: `Keep it under ${MAX_FIELD_LENGTH} characters.` }
    : null;
}

export function validateName(value: string): FieldValidation {
  if (!value.trim()) return { valid: false, message: "Enter your full name." };
  return tooLong(value) ?? ok;
}

export function validateEmail(value: string): FieldValidation {
  if (!value.trim()) return { valid: false, message: "Enter your email address." };
  const long = tooLong(value);
  if (long) return long;
  if (!EMAIL_PATTERN.test(value.trim())) return { valid: false, message: "Enter a valid email address." };
  return ok;
}

export function validateLocation(value: string): FieldValidation {
  if (!value.trim()) return { valid: false, message: "Enter your city and state (or country)." };
  return tooLong(value) ?? ok;
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

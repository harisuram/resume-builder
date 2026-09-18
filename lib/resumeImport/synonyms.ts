import { getSectionMeta } from "../persona";
import type { SectionKey } from "../types";

/** Headings we recognize but never import (they aren't builder sections). */
export type SkipHeading = "skip";

export type ImportTarget = "basicInfo" | SectionKey;

export type ResolvedHeading = ImportTarget | SkipHeading;

/**
 * Canonical heading strings (already normalized) mapped to a builder target.
 * Longer / more specific phrases are registered first so they win over a
 * shorter substring that would otherwise collide — "programming languages"
 * must not become spoken Languages.
 */
const SYNONYM_GROUPS: Array<{ key: ResolvedHeading; phrases: string[] }> = [
  {
    key: "skip",
    phrases: [
      "references",
      "referees",
      "reference",
      "declaration",
      "disclaimer",
      "cover letter",
      "page",
    ],
  },
  {
    key: "basicInfo",
    phrases: [
      "contact information",
      "contact details",
      "personal details",
      "personal information",
      "personal data",
      "contact",
    ],
  },
  {
    key: "summary",
    phrases: [
      "professional summary",
      "career summary",
      "executive summary",
      "professional profile",
      "career objective",
      "personal statement",
      "career profile",
      "about me",
      "objective",
      "summary",
      "profile",
      "overview",
      "bio",
      "biography",
      "about",
    ],
  },
  {
    key: "keyAchievements",
    phrases: [
      "key accomplishments",
      "key achievements",
      "career highlights",
      "selected achievements",
      "notable achievements",
      "awards and achievements",
      "highlights",
      "accomplishments",
      "achievements",
    ],
  },
  {
    key: "internships",
    phrases: [
      "internship experience",
      "intern experience",
      "industrial training",
      "cooperative education",
      "internships",
      "internship",
      "co ops",
      "co op",
      "coops",
      "coop",
    ],
  },
  {
    key: "partTime",
    phrases: [
      "part time work",
      "part time jobs",
      "part time experience",
      "part time",
      "campus jobs",
      "student jobs",
      "side jobs",
    ],
  },
  {
    key: "experience",
    phrases: [
      "professional experience",
      "relevant experience",
      "work experience",
      "employment history",
      "professional history",
      "professional background",
      "career history",
      "work history",
      "positions held",
      "employment",
      "experience",
    ],
  },
  {
    key: "projects",
    phrases: [
      "personal projects",
      "academic projects",
      "selected projects",
      "technical projects",
      "project experience",
      "side projects",
      "key projects",
      "projects",
      "portfolio",
    ],
  },
  {
    key: "education",
    phrases: [
      "educational background",
      "academic qualifications",
      "academic background",
      "academic history",
      "education and training",
      "education",
      "academics",
      "qualifications",
      "schooling",
      "degrees",
    ],
  },
  {
    key: "skills",
    phrases: [
      "programming languages",
      "technical proficiencies",
      "technical competencies",
      "technical skills",
      "professional skills",
      "core competencies",
      "areas of expertise",
      "computer skills",
      "core skills",
      "key skills",
      "hard skills",
      "tech stack",
      "technologies",
      "competencies",
      "expertise",
      "it skills",
      "skills",
      "tools",
    ],
  },
  {
    key: "certifications",
    phrases: [
      "licenses and certifications",
      "licences and certifications",
      "professional certifications",
      "certifications",
      "certificates",
      "credentials",
      "accreditations",
      "licenses",
      "licences",
    ],
  },
  {
    key: "patents",
    phrases: [
      "intellectual property",
      "patents",
      "patent",
      "inventions",
    ],
  },
  {
    key: "languages",
    phrases: [
      "language proficiency",
      "spoken languages",
      "foreign languages",
      "linguistic skills",
      "language skills",
      "languages",
    ],
  },
  {
    key: "hobbies",
    phrases: [
      "hobbies and interests",
      "personal interests",
      "interests",
      "hobbies",
      "leisure",
      "activities",
    ],
  },
  {
    key: "softSkills",
    phrases: [
      "interpersonal skills",
      "professional attributes",
      "transferable skills",
      "personal skills",
      "people skills",
      "soft skills",
    ],
  },
  {
    key: "additional",
    phrases: [
      "volunteer experience",
      "community service",
      "professional affiliations",
      "additional information",
      "extracurricular activities",
      "other information",
      "volunteer work",
      "volunteering",
      "publications",
      "affiliations",
      "memberships",
      "conferences",
      "presentations",
      "research",
      "leadership",
      "volunteer",
      "additional",
      "honors and awards",
      "honours and awards",
      "awards",
      "honors",
      "honours",
      "papers",
      "miscellaneous",
      "extracurricular",
      "military",
      "other",
      "extra",
    ],
  },
];

const PHRASE_TO_KEY = new Map<string, ResolvedHeading>();

for (const group of SYNONYM_GROUPS) {
  for (const phrase of group.phrases) {
    if (!PHRASE_TO_KEY.has(phrase)) PHRASE_TO_KEY.set(phrase, group.key);
  }
}

const PHRASES_BY_LENGTH = [...PHRASE_TO_KEY.keys()].sort((a, b) => b.length - a.length);

/** Lowercase, strip punctuation, collapse whitespace — shared by PDF lines and JSON keys. */
export function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[/|,;:]+/g, " ")
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `workExperience` / `technical_skills` → a heading we can resolve. */
export function keyToHeading(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
}

function matchNormalized(normalized: string): ResolvedHeading | null {
  if (!normalized) return null;
  const exact = PHRASE_TO_KEY.get(normalized);
  if (exact) return exact;
  for (const phrase of PHRASES_BY_LENGTH) {
    if (normalized === phrase) return PHRASE_TO_KEY.get(phrase) ?? null;
    if (normalized.startsWith(`${phrase} `) && phrase.length >= 4) {
      return PHRASE_TO_KEY.get(phrase) ?? null;
    }
  }
  return null;
}

/**
 * Map a resume heading (or a JSON field name) onto a builder section.
 * Returns null when the line doesn't look like a section heading.
 */
export function resolveSectionHeading(raw: string): ResolvedHeading | null {
  const stripped = raw.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
  const normalized = normalizeHeading(stripped);
  return matchNormalized(normalized);
}

const MAX_HEADING_WORDS = 8;
const MAX_HEADING_CHARS = 60;

function looksLikeBullet(line: string): boolean {
  return /^[\s]*([•●○◦▪▫–—\-*\u2022]|\d+[.)])\s+/.test(line);
}

/**
 * True when a standalone line is probably a section title rather than body
 * copy — short, not a bullet, and either a known synonym or title-like.
 */
export function isLikelySectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || looksLikeBullet(trimmed)) return false;
  if (trimmed.length > MAX_HEADING_CHARS) return false;
  if (trimmed.split(/\s+/).length > MAX_HEADING_WORDS) return false;
  return Boolean(resolveSectionHeading(trimmed));
}

export function resolvedHeadingLabel(key: ImportTarget): string {
  return key === "basicInfo" ? "Basic info" : getSectionMeta(key).label;
}

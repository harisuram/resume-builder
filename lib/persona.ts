import type { SectionKey } from "./types";

export interface SectionMeta {
  key: SectionKey;
  label: string;
  helpText: string;
}

const SECTION_META: Record<SectionKey, SectionMeta> = {
  education: {
    key: "education",
    label: "Education",
    helpText: "Schools, degrees, and coursework.",
  },
  experience: {
    key: "experience",
    label: "Experience",
    helpText: "Paid roles you've held, most recent first.",
  },
  projects: {
    key: "projects",
    label: "Projects",
    helpText: "Things you built — classwork, side projects, hackathons.",
  },
  internships: {
    key: "internships",
    label: "Internships",
    helpText: "Internships or co-ops you've done, most recent first.",
  },
  partTime: {
    key: "partTime",
    label: "Part-time work",
    helpText: "Part-time jobs outside of an internship, most recent first.",
  },
  skills: {
    key: "skills",
    label: "Skills",
    helpText: "Tools, methods, and systems — software, data, IT, trades, clinical, and more.",
  },
  certifications: {
    key: "certifications",
    label: "Certifications",
    helpText: "Licenses and certifications, with issuing body and date.",
  },
  patents: {
    key: "patents",
    label: "Patents",
    helpText: "Patents granted or pending, with number and date.",
  },
  languages: {
    key: "languages",
    label: "Languages",
    helpText: "Spoken languages, with proficiency.",
  },
  hobbies: {
    key: "hobbies",
    label: "Hobbies",
    helpText: "Interests worth listing if they add something the rest of the resume doesn't.",
  },
  softSkills: {
    key: "softSkills",
    label: "Soft skills",
    helpText: "How you work with people — communication, leadership, mentoring.",
  },
  additional: {
    key: "additional",
    label: "Additional",
    helpText: "Anything else — publications, volunteer work, awards. Name the heading yourself.",
  },
  summary: {
    key: "summary",
    label: "Summary",
    helpText: "",
  },
  keyAchievements: {
    key: "keyAchievements",
    label: "Key achievements",
    helpText: "Standout, quantifiable wins — the highlights you want noticed first.",
  },
};

/** Default order of reachable content sections. Every section is available;
 * skip anything that doesn't belong on this resume via the section nav.
 * Key achievements leads, right after the summary — see getNavSectionOrder —
 * and experience precedes education so paid work is read first. */
export const SECTION_ORDER: SectionKey[] = [
  "keyAchievements",
  "experience",
  "internships",
  "partTime",
  "projects",
  "education",
  "skills",
  "certifications",
  "patents",
  "languages",
  "hobbies",
  "softSkills",
  "additional",
];

export function getSectionOrder(): SectionMeta[] {
  return SECTION_ORDER.map((key) => SECTION_META[key]);
}

/** Resolves the order content sections actually render and navigate in:
 * the user's custom order once they've moved anything via the section
 * nav, else the default. */
export function resolveSectionOrder(custom?: SectionKey[] | null): SectionKey[] {
  return custom && custom.length > 0 ? custom : SECTION_ORDER;
}

/** Moves `key` to `toIndex` in a content-section order. Unknown keys and
 * no-op placements return the original array so a still-default order can
 * stay unmaterialized. */
export function placeSectionAt(order: SectionKey[], key: SectionKey, toIndex: number): SectionKey[] {
  const from = order.indexOf(key);
  if (from === -1) return order;
  const to = Math.max(0, Math.min(order.length - 1, toIndex));
  if (from === to) return order;
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** The summary step plus content sections, in the order the section nav
 * walks them. Summary leads so it can frame the rest of the resume, matching
 * where it renders in every template — and it's intentionally not part of
 * `custom`: it's pinned first in every template layout regardless of section
 * order, so reordering it wouldn't do anything to the actual output. */
export function getNavSectionOrder(custom?: SectionKey[] | null): SectionKey[] {
  return ["summary", ...resolveSectionOrder(custom)];
}

export function getSectionMeta(key: SectionKey): SectionMeta {
  return SECTION_META[key];
}

/** Title-cased heading used on the resume itself.
 * Nav labels stay sentence-cased in SECTION_META; this is the printed form.
 * Additional uses the user-supplied heading when one is set. */
export function resumeSectionTitle(key: SectionKey, data?: { sections: { additional?: { heading?: string } } }): string {
  if (key === "additional") {
    const heading = data?.sections.additional?.heading?.trim();
    return heading || "Additional";
  }
  switch (key) {
    case "keyAchievements":
      return "Key Achievements";
    case "partTime":
      return "Part-Time Work";
    case "softSkills":
      return "Soft Skills";
    default:
      return SECTION_META[key].label;
  }
}

export const SUMMARY_COPY = {
  label: "Summary",
  placeholder:
    "e.g. Backend engineer with 6 years building payments infrastructure at scale, specializing in distributed systems and developer tooling.",
  help: "A few sentences on what you do, what you're looking for, and what you bring to it.",
};

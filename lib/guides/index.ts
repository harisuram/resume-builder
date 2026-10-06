import type { Guide, GuideBlock } from "./types";
import { guide as resumeVsCv } from "./content/resume-vs-cv";
import { guide as resumeSummary } from "./content/how-to-write-a-resume-summary";
import { guide as freshers } from "./content/resume-for-freshers";
import { guide as bulletPoints } from "./content/how-to-write-work-experience-bullet-points";
import { guide as skills } from "./content/resume-skills-section";
import { guide as ats } from "./content/how-applicant-tracking-systems-read-resumes";
import { guide as formats } from "./content/resume-formats-explained";
import { guide as length } from "./content/how-long-should-a-resume-be";
import { guide as education } from "./content/how-to-list-education-on-a-resume";
import { guide as projects } from "./content/projects-section-on-a-resume";
import { guide as coverLetter } from "./content/how-to-write-a-cover-letter";
import { guide as mistakes } from "./content/resume-mistakes-to-avoid";
import { guide as tailor } from "./content/tailor-resume-to-job-description";
import { guide as personalDetails } from "./content/personal-details-on-a-resume-by-country";
import { guide as softwareEngineer } from "./content/software-engineer-resume-example";
import { guide as careerGap } from "./content/explain-career-gap-on-resume";

export type { Guide, GuideBlock, GuideCategory, GuideSection } from "./types";

/** Every published guide, in the order the /guides index lists them. */
export const GUIDES: readonly Guide[] = [
  resumeSummary,
  bulletPoints,
  resumeVsCv,
  freshers,
  skills,
  ats,
  formats,
  length,
  education,
  projects,
  tailor,
  coverLetter,
  mistakes,
  personalDetails,
  softwareEngineer,
  careerGap,
];

export const GUIDES_PATH = "/guides";

export function guidePath(slug: string): string {
  return `${GUIDES_PATH}/${slug}`;
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

function blockText(block: GuideBlock): string {
  switch (block.type) {
    case "p":
    case "tip":
      return block.text;
    case "ul":
    case "ol":
      return block.items.join(" ");
    case "compare":
      return [block.weak, block.strong, block.note ?? ""].join(" ");
    case "sample":
      return [block.title, ...block.lines].join(" ");
  }
}

/** All readable text in a guide — intro, sections, and FAQs. */
export function guideText(guide: Guide): string {
  return [
    guide.intro,
    ...guide.sections.flatMap((section) => [section.heading, ...section.blocks.map(blockText)]),
    ...(guide.faqs ?? []).flatMap((faq) => [faq.question, faq.answer]),
  ].join(" ");
}

export function guideWordCount(guide: Guide): number {
  return guideText(guide).split(/\s+/).filter(Boolean).length;
}

/** Rounded up at roughly 220 words a minute. */
export function guideReadMinutes(guide: Guide): number {
  return Math.max(1, Math.ceil(guideWordCount(guide) / 220));
}

/** "6 October 2026" — fixed locale and UTC so server and client agree. */
export function formatGuideDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

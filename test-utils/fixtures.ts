import { SAMPLE_RESUME } from "@/lib/sampleResume";
import type { ResumeData } from "@/lib/types";

/** A resume with every section populated, so template smoke tests exercise
 * every layout branch (sidebar vs. main column, headings, list rendering). */
export function makeFullResumeData(overrides: Partial<ResumeData> = {}): ResumeData {
  const base = JSON.parse(JSON.stringify(SAMPLE_RESUME)) as ResumeData;
  return {
    ...base,
    ...overrides,
    basicInfo: { ...base.basicInfo, ...overrides.basicInfo, links: { ...base.basicInfo.links, ...overrides.basicInfo?.links } },
    sections: { ...base.sections, ...overrides.sections },
    sectionStatus: { ...base.sectionStatus, ...overrides.sectionStatus },
  };
}

/** A resume with nothing filled in — exercises every
 * "don't render an empty heading" branch. */
export function makeEmptyResumeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    basicInfo: { name: "", email: "", phone: "", location: "", links: {} },
    sections: {},
    sectionStatus: {},
    templateId: "jakes-resume",
    ...overrides,
  };
}

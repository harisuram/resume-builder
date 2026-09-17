import { resolveSectionOrder } from "./persona";
import type { ResumeData, SectionKey } from "./types";

/** Compact sections that read well in a sidebar / narrow column. Narrative
 * sections (experience, projects, patents, additional) stay in the main
 * column so a two-column layout doesn't squeeze long bullets. Shared by the
 * HTML layouts so the split can't drift. */
export const NARROW_SECTION_KEYS = new Set<SectionKey>([
  "education",
  "skills",
  "certifications",
  "languages",
  "hobbies",
  "softSkills",
]);

/** Content sections worth rendering: not skipped, and actually has content.
 * Ordered by the default section list unless the user has moved anything via
 * the section nav (data.sectionOrder). */
export function getRenderableSections(data: ResumeData): SectionKey[] {
  return resolveSectionOrder(data.sectionOrder).filter((key) => hasSectionContent(data, key));
}

/** True once the user has filled in at least one content section (not
 * skipped, with something to render). Basic info and photo don't count —
 * photo is skippable on its own, but it isn't a content block. Drives
 * whether the export step offers to save a copy on this device. */
export function hasAddedSection(data: ResumeData): boolean {
  return getRenderableSections(data).length > 0;
}

/** Whether a content section has anything worth putting on the page.
 * Additional is an object (heading + items), not an array, so it can't
 * share the Array.isArray check the rest of the list sections use. */
export function hasSectionContent(data: ResumeData, key: SectionKey): boolean {
  if (data.sectionStatus[key] === "skipped") return false;
  if (key === "summary") return hasSummary(data);
  if (key === "additional") {
    return (data.sections.additional?.items.length ?? 0) > 0;
  }
  const value = data.sections[key];
  return Array.isArray(value) && value.length > 0;
}

export function hasSummary(data: ResumeData): boolean {
  if (data.sectionStatus.summary === "skipped") return false;
  return Boolean(data.sections.summary && data.sections.summary.trim().length > 0);
}

/** Whether the user has explicitly chosen for this section to start on a
 * fresh printed page (see ResumeData.pageBreakSections). */
export function hasForcedPageBreak(data: ResumeData, key: SectionKey): boolean {
  return Boolean(data.pageBreakSections?.includes(key));
}

/** DOM attrs every layout stamps on a section wrapper so the preview guides
 * and the print stylesheet can force that section onto a fresh page. */
export function sectionBreakProps(data: ResumeData, key: SectionKey) {
  return {
    "data-section-key": key,
    "data-force-break": hasForcedPageBreak(data, key) || undefined,
  } as const;
}

/** Addresses one list entry within a section (see ResumeData.pageBreakItems). */
export function itemBreakKey(section: SectionKey, index: number): string {
  return `${section}:${index}`;
}

export function parseItemBreakKey(key: string): { section: SectionKey; index: number } | null {
  // Digits only, and at least one: Number("") is 0, so a trailing-colon key
  // like "projects:" would otherwise parse as the section's first entry.
  const match = /^([^:]+):(\d+)$/.exec(key);
  if (!match) return null;
  return { section: match[1] as SectionKey, index: Number(match[2]) };
}

/** The entries of one section forced onto a fresh page, as their indices —
 * resolved once per section so the render path does a Set lookup per entry
 * rather than scanning the whole list for each one. */
export function forcedItemIndices(data: ResumeData, section: SectionKey): Set<number> {
  const indices = new Set<number>();
  for (const key of data.pageBreakItems ?? []) {
    const parsed = parseItemBreakKey(key);
    if (parsed && parsed.section === section) indices.add(parsed.index);
  }
  return indices;
}

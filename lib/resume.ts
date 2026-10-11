import { getNavSectionOrder, resolveSectionOrder } from "./persona";
import type { PersonalDetails, ResumeData, SectionKey } from "./types";

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
  "personalDetails",
]);

/** Content sections worth rendering: not skipped, and actually has content.
 * Ordered by the default section list unless the user has moved anything via
 * the section nav (data.sectionOrder). */
export function getRenderableSections(data: ResumeData): SectionKey[] {
  return resolveSectionOrder(data.sectionOrder).filter((key) => hasSectionContent(data, key));
}

function hasTypedBasicInfo(data: ResumeData): boolean {
  const info = data.basicInfo;
  return Boolean(
    info.name ||
      info.email ||
      info.phone ||
      info.location ||
      info.links.linkedin ||
      info.links.github ||
      info.links.portfolio,
  );
}

function hasVisiblePhoto(data: ResumeData): boolean {
  return Boolean(data.photo) && data.sectionStatus.photo !== "skipped";
}

/** True once the live preview should replace the template placeholder —
 * any typed basic-info field, a photo that isn't skipped, or a content
 * section with something to render. */
export function hasAddedSection(data: ResumeData): boolean {
  return hasTypedBasicInfo(data) || hasVisiblePhoto(data) || hasSummary(data) || getRenderableSections(data).length > 0;
}

/** Headings the empty-preview skeleton should draw: every content section
 * that isn't skipped, in the same order the real templates will use.
 * Skipped blocks stay off the placeholder the same way they stay off the
 * printed page. */
export function getPlaceholderSections(data: Pick<ResumeData, "sectionStatus" | "sectionOrder">): SectionKey[] {
  return getNavSectionOrder(data.sectionOrder).filter((key) => data.sectionStatus[key] !== "skipped");
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
  if (key === "personalDetails") return personalDetailRows(data.sections.personalDetails).length > 0;
  const value = data.sections[key];
  return Array.isArray(value) && value.length > 0;
}

export function hasSummary(data: ResumeData): boolean {
  if (data.sectionStatus.summary === "skipped") return false;
  return Boolean(data.sections.summary && data.sections.summary.trim().length > 0);
}

/** Whether the user has explicitly chosen for this section to start on a
 * fresh printed page. Forced partitions were removed — always false; kept
 * so older saved resumes / tests that call this stay harmless. */
export function hasForcedPageBreak(_data: ResumeData, _key: SectionKey): boolean {
  return false;
}

/** DOM attrs every layout stamps on a section wrapper (guides / measure). */
export function sectionBreakProps(_data: ResumeData, key: SectionKey) {
  return {
    "data-section-key": key,
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "1998-03-15" → "15 March 1998": day-month-year with the month spelled out
 * reads the same everywhere, unlike 03/15 vs 15/03. */
export function formatDateOfBirth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso.trim();
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}` : iso.trim();
}

/** The filled-in personal details as printed label/value rows, in a fixed
 * order. Shared by the HTML templates and the PDF so they can't drift. */
export function personalDetailRows(details: PersonalDetails | undefined): { label: string; value: string }[] {
  if (!details || typeof details !== "object") return [];
  // A hand-edited or corrupted save can hold non-strings; print only text.
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const dob = text(details.dateOfBirth);
  const rows = [
    { label: "Date of birth", value: dob ? formatDateOfBirth(dob) : "" },
    { label: "Gender", value: text(details.gender) },
    { label: "Marital status", value: text(details.maritalStatus) },
    { label: "Nationality", value: text(details.nationality) },
  ];
  return rows.filter((row) => row.value);
}

import type { ResumeData, SkillGroup } from "./types";
import { MAX_CHIP_LENGTH } from "./validation";

export const MAX_SKILL_GROUPS = 12;
export const MAX_SKILL_GROUP_TITLE_LENGTH = 60;
export const MAX_SKILLS_PER_GROUP = 40;

/** Skills compare the way ChipInput compares them: trimmed, ignoring case. */
const skillKey = (skill: string) => skill.trim().toLowerCase();

/** Every grouped skill once, in group order — the flat list sections.skills
 * holds while grouped mode is on. A skill typed into two groups is kept in
 * the first. */
export function flattenSkillGroups(groups: SkillGroup[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const skill of group.skills) {
      const key = skillKey(skill);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(skill);
    }
  }
  return out;
}

/** Brings saved groups in line with the flat list, for switching from the
 * list to grouped mode: skills deleted from the list leave their groups,
 * groups keep their titles and order, and skills that aren't in any group
 * yet land in the first untitled group (a new one at the end if there is
 * none). Never returns an empty array, so grouped mode always opens on a
 * group to type into. */
export function reconcileSkillGroups(skills: string[], groups: SkillGroup[]): SkillGroup[] {
  const wanted = new Set(skills.map(skillKey).filter(Boolean));
  const placed = new Set<string>();
  const next = groups.map((group) => ({
    title: group.title,
    skills: group.skills.filter((skill) => {
      const key = skillKey(skill);
      if (!wanted.has(key) || placed.has(key)) return false;
      placed.add(key);
      return true;
    }),
  }));
  const leftovers = skills.filter((skill) => {
    const key = skillKey(skill);
    if (!key || placed.has(key)) return false;
    placed.add(key);
    return true;
  });
  if (leftovers.length > 0) {
    const untitled = next.findIndex((group) => !group.title.trim());
    if (untitled >= 0) next[untitled] = { ...next[untitled], skills: [...next[untitled].skills, ...leftovers] };
    else next.push({ title: "", skills: leftovers });
  }
  return next.length > 0 ? next : [{ title: "", skills: [] }];
}

/** Coerces saved or imported JSON into well-formed groups: strings only,
 * lengths and counts capped, no duplicate skill inside one group. */
export function sanitizeSkillGroups(raw: unknown): SkillGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: SkillGroup[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { title, skills } = item as { title?: unknown; skills?: unknown };
    const seen = new Set<string>();
    const clean: string[] = [];
    if (Array.isArray(skills)) {
      for (const skill of skills) {
        if (typeof skill !== "string") continue;
        const text = skill.trim().slice(0, MAX_CHIP_LENGTH);
        const key = skillKey(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        clean.push(text);
        if (clean.length >= MAX_SKILLS_PER_GROUP) break;
      }
    }
    out.push({ title: typeof title === "string" ? title.slice(0, MAX_SKILL_GROUP_TITLE_LENGTH) : "", skills: clean });
    if (out.length >= MAX_SKILL_GROUPS) break;
  }
  return out;
}

/** The groups to print, or null to print the flat list. Null unless grouped
 * mode is on and at least one non-empty group has a title — a single
 * untitled bundle would only be the flat list drawn differently. Groups with
 * no skills are dropped; an untitled one prints as a bare line. Shared by the
 * HTML templates and the PDF so the two never disagree about what's grouped. */
export function renderableSkillGroups(data: Pick<ResumeData, "skillsLayout" | "skillGroups">): SkillGroup[] | null {
  if (data.skillsLayout !== "grouped") return null;
  // A skill in two groups prints once, in the first — as flattenSkillGroups
  // counts it.
  const seen = new Set<string>();
  const groups = sanitizeSkillGroups(data.skillGroups)
    .map((group) => ({
      title: group.title.trim(),
      skills: group.skills.filter((skill) => {
        const key = skillKey(skill);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }))
    .filter((group) => group.skills.length > 0);
  return groups.some((group) => group.title) ? groups : null;
}

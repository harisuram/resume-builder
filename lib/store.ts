import { useMemo } from "react";
import { create } from "zustand";
import { resolveSectionOrder, SECTION_ORDER } from "./persona";
import { itemBreakKey, parseItemBreakKey } from "./resume";
import { isBasicInfoValid, isSectionValid } from "./validation";
import type {
  AdditionalItem,
  BasicInfo,
  ResumeData,
  ResumeSections,
  SectionKey,
  SectionStatus,
  TemplateId,
} from "./types";

export type ListSectionKey =
  | "education"
  | "experience"
  | "projects"
  | "internships"
  | "partTime"
  | "certifications"
  | "patents"
  | "languages";
type ListItemOf<K extends ListSectionKey> = ResumeSections[K][number];

const EMPTY_BASIC_INFO: BasicInfo = {
  name: "",
  email: "",
  phone: "",
  location: "",
  links: {},
};

/** Required fields present *and* every field — required or optional — passes
 * format validation. An optional field left blank still counts as complete;
 * one that's filled in wrong (a malformed phone or link) does not. */
export function isBasicInfoComplete(basicInfo: BasicInfo): boolean {
  return isBasicInfoValid(basicInfo);
}

/** Any field the user has typed — used to enable the per-section Clear
 * control, which is a no-op (and so disabled) when there's nothing to drop. */
export function hasBasicInfoContent(basicInfo: BasicInfo): boolean {
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

function deriveStatus(key: SectionKey, sections: Partial<ResumeSections>): SectionStatus {
  return isSectionValid(key, sections) ? "complete" : "not_started";
}

/** Whether Clear would actually drop something. Broader than `complete`: a
 * heading-only Additional block, or a skipped section that still has content
 * underneath, both count. */
export function hasSectionContent(key: SectionKey, sections: Partial<ResumeSections>): boolean {
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

const CONTENT_KEYS: SectionKey[] = ["summary", ...SECTION_ORDER];

/** True if the user has typed anything in basic info, added a photo, or
 * put a value in any content section — including a skipped section that
 * still has leftover text. Used to tell a first visit from a returning draft. */
export function hasAnyResumeValue(data: {
  basicInfo?: BasicInfo | null;
  photo?: string | null;
  sections?: Partial<ResumeSections>;
} | null | undefined): boolean {
  if (!data) return false;
  if (data.photo) return true;
  if (data.basicInfo && hasBasicInfoContent(data.basicInfo)) return true;
  const sections = data.sections;
  if (!sections) return false;
  return CONTENT_KEYS.some((key) => hasSectionContent(key, sections));
}

/** Keeps forced entry page breaks pointing at the entries the user actually
 * pinned after one is deleted: the removed entry's own break goes with it,
 * and everything below it shifts up a slot to match its new index. */
function shiftItemBreaks(breaks: string[], key: SectionKey, removedIndex: number): string[] {
  const next: string[] = [];
  for (const id of breaks) {
    const parsed = parseItemBreakKey(id);
    if (!parsed || parsed.section !== key) {
      next.push(id);
      continue;
    }
    if (parsed.index === removedIndex) continue;
    next.push(parsed.index > removedIndex ? itemBreakKey(key, parsed.index - 1) : id);
  }
  return next;
}

function nextStatus(
  key: SectionKey,
  sections: Partial<ResumeSections>,
  current: Record<string, SectionStatus>,
): SectionStatus {
  // Editing hidden content of a skipped section shouldn't happen through the
  // UI, but stay defensive: a skip is a deliberate choice, don't silently
  // clear it just because content changed underneath it.
  if (current[key] === "skipped") return "skipped";
  return deriveStatus(key, sections);
}

interface BuilderState {
  basicInfo: BasicInfo;
  photo: string | null;
  setPhoto: (photo: string | null) => void;
  sections: Partial<ResumeSections>;
  sectionStatus: Record<string, SectionStatus>;
  templateId: TemplateId;
  /** Whether a copy currently lives in localStorage — drives the export
   * step's save-consent prompt. Not itself persisted; refreshed from
   * localStorage on mount and after every save/clear decision. */
  hasSavedCopy: boolean;
  setHasSavedCopy: (value: boolean) => void;

  updateBasicInfo: (patch: Partial<Omit<BasicInfo, "links">>) => void;
  updateLinks: (patch: Partial<BasicInfo["links"]>) => void;

  setSummary: (text: string) => void;
  setSkills: (skills: string[]) => void;
  setHobbies: (items: string[]) => void;
  setSoftSkills: (items: string[]) => void;
  setKeyAchievements: (items: string[]) => void;

  addListItem: <K extends ListSectionKey>(key: K, item: ListItemOf<K>) => void;
  updateListItem: <K extends ListSectionKey>(key: K, index: number, patch: Partial<ListItemOf<K>>) => void;
  removeListItem: (key: ListSectionKey, index: number) => void;

  setAdditionalHeading: (heading: string) => void;
  addAdditionalItem: (item: AdditionalItem) => void;
  updateAdditionalItem: (index: number, patch: Partial<AdditionalItem>) => void;
  removeAdditionalItem: (index: number) => void;

  toggleSkipSection: (key: SectionKey) => void;
  /** Wipes one content section's entries, skip flag, and any page-breaks
   * pinned to it. Basic info and the photo have their own setters. */
  clearSection: (key: SectionKey) => void;
  clearBasicInfo: () => void;
  setTemplateId: (id: TemplateId) => void;

  pageBreakSections: SectionKey[];
  /** Toggles whether a section is forced to start on a fresh printed page —
   * meant to be offered when a page break is otherwise falling mid-section. */
  toggleSectionPageBreak: (key: SectionKey) => void;

  pageBreakItems: string[];
  /** Toggles whether one list entry starts on a fresh printed page — offered
   * when a page break falls through that entry, where pushing its whole
   * section down would needlessly move every entry above it too. */
  toggleItemPageBreak: (key: SectionKey, index: number) => void;

  /** Custom content-section order, or null to use the default
   * (resolveSectionOrder handles the fallback everywhere this is read). */
  sectionOrder: SectionKey[] | null;
  /** Swaps a content section with its neighbor. Materializes the default
   * into a real array on first use, so moving one section doesn't require
   * the caller to already know the full current order. */
  moveSection: (key: SectionKey, direction: "up" | "down") => void;

  loadFromData: (data: ResumeData) => void;
  resetStore: () => void;
  getResumeData: () => ResumeData;
}

const DEFAULT_TEMPLATE: TemplateId = "jakes-resume";

export const useBuilderStore = create<BuilderState>((set, get) => ({
  basicInfo: EMPTY_BASIC_INFO,
  photo: null,
  setPhoto: (photo) => set({ photo }),
  sections: {},
  sectionStatus: {},
  templateId: DEFAULT_TEMPLATE,
  hasSavedCopy: false,
  setHasSavedCopy: (value) => set({ hasSavedCopy: value }),

  updateBasicInfo: (patch) =>
    set((state) => ({ basicInfo: { ...state.basicInfo, ...patch } })),

  updateLinks: (patch) =>
    set((state) => ({
      basicInfo: { ...state.basicInfo, links: { ...state.basicInfo.links, ...patch } },
    })),

  setSummary: (text) =>
    set((state) => {
      const sections = { ...state.sections, summary: text };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, summary: nextStatus("summary", sections, state.sectionStatus) },
      };
    }),

  setSkills: (skills) =>
    set((state) => {
      const sections = { ...state.sections, skills };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, skills: nextStatus("skills", sections, state.sectionStatus) },
      };
    }),

  setHobbies: (items) =>
    set((state) => {
      const sections = { ...state.sections, hobbies: items };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, hobbies: nextStatus("hobbies", sections, state.sectionStatus) },
      };
    }),

  setSoftSkills: (items) =>
    set((state) => {
      const sections = { ...state.sections, softSkills: items };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, softSkills: nextStatus("softSkills", sections, state.sectionStatus) },
      };
    }),

  setKeyAchievements: (items) =>
    set((state) => {
      const sections = { ...state.sections, keyAchievements: items };
      return {
        sections,
        sectionStatus: {
          ...state.sectionStatus,
          keyAchievements: nextStatus("keyAchievements", sections, state.sectionStatus),
        },
      };
    }),

  addListItem: (key, item) =>
    set((state) => {
      const list = [...(state.sections[key] ?? []), item] as ResumeSections[typeof key];
      const sections = { ...state.sections, [key]: list };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, [key]: nextStatus(key, sections, state.sectionStatus) },
      };
    }),

  updateListItem: (key, index, patch) =>
    set((state) => {
      const list = [...(state.sections[key] ?? [])] as Array<ListItemOf<typeof key>>;
      if (!list[index]) return state;
      list[index] = { ...list[index], ...patch };
      const sections = { ...state.sections, [key]: list };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, [key]: nextStatus(key, sections, state.sectionStatus) },
      };
    }),

  removeListItem: (key, index) =>
    set((state) => {
      const list = [...(state.sections[key] ?? [])];
      list.splice(index, 1);
      const sections = { ...state.sections, [key]: list };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, [key]: nextStatus(key, sections, state.sectionStatus) },
        pageBreakItems: shiftItemBreaks(state.pageBreakItems, key, index),
      };
    }),

  setAdditionalHeading: (heading) =>
    set((state) => {
      const additional = { heading, items: state.sections.additional?.items ?? [] };
      const sections = { ...state.sections, additional };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, additional: nextStatus("additional", sections, state.sectionStatus) },
      };
    }),

  addAdditionalItem: (item) =>
    set((state) => {
      const additional = {
        heading: state.sections.additional?.heading ?? "",
        items: [...(state.sections.additional?.items ?? []), item],
      };
      const sections = { ...state.sections, additional };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, additional: nextStatus("additional", sections, state.sectionStatus) },
      };
    }),

  updateAdditionalItem: (index, patch) =>
    set((state) => {
      const current = state.sections.additional;
      if (!current?.items[index]) return state;
      const items = [...current.items];
      items[index] = { ...items[index], ...patch };
      const sections = { ...state.sections, additional: { ...current, items } };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, additional: nextStatus("additional", sections, state.sectionStatus) },
      };
    }),

  removeAdditionalItem: (index) =>
    set((state) => {
      const current = state.sections.additional;
      if (!current) return state;
      const items = [...current.items];
      items.splice(index, 1);
      const sections = { ...state.sections, additional: { ...current, items } };
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, additional: nextStatus("additional", sections, state.sectionStatus) },
        pageBreakItems: shiftItemBreaks(state.pageBreakItems, "additional", index),
      };
    }),

  toggleSkipSection: (key) =>
    set((state) => {
      const isSkipped = state.sectionStatus[key] === "skipped";
      const status = isSkipped ? deriveStatus(key, state.sections) : "skipped";
      return { sectionStatus: { ...state.sectionStatus, [key]: status } };
    }),

  clearSection: (key) =>
    set((state) => {
      const sections = { ...state.sections };
      delete sections[key];
      return {
        sections,
        sectionStatus: { ...state.sectionStatus, [key]: "not_started" },
        pageBreakSections: state.pageBreakSections.filter((k) => k !== key),
        pageBreakItems: state.pageBreakItems.filter((id) => parseItemBreakKey(id)?.section !== key),
      };
    }),

  clearBasicInfo: () => set({ basicInfo: EMPTY_BASIC_INFO }),

  setTemplateId: (id) => set({ templateId: id }),

  pageBreakSections: [],
  toggleSectionPageBreak: (key) =>
    set((state) => ({
      pageBreakSections: state.pageBreakSections.includes(key)
        ? state.pageBreakSections.filter((k) => k !== key)
        : [...state.pageBreakSections, key],
    })),

  pageBreakItems: [],
  toggleItemPageBreak: (key, index) =>
    set((state) => {
      const id = itemBreakKey(key, index);
      return {
        pageBreakItems: state.pageBreakItems.includes(id)
          ? state.pageBreakItems.filter((k) => k !== id)
          : [...state.pageBreakItems, id],
      };
    }),

  sectionOrder: null,
  moveSection: (key, direction) =>
    set((state) => {
      const current = resolveSectionOrder(state.sectionOrder);
      const index = current.indexOf(key);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= current.length) return state;
      const next = [...current];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return { sectionOrder: next };
    }),

  loadFromData: (data) =>
    set({
      basicInfo: data.basicInfo,
      photo: data.photo ?? null,
      sections: data.sections,
      sectionStatus: data.sectionStatus,
      templateId: data.templateId,
      pageBreakSections: data.pageBreakSections ?? [],
      pageBreakItems: data.pageBreakItems ?? [],
      sectionOrder: data.sectionOrder ?? null,
    }),

  resetStore: () =>
    set({
      basicInfo: EMPTY_BASIC_INFO,
      photo: null,
      sections: {},
      sectionStatus: {},
      templateId: DEFAULT_TEMPLATE,
      hasSavedCopy: false,
      pageBreakSections: [],
      pageBreakItems: [],
      sectionOrder: null,
    }),

  getResumeData: (): ResumeData => {
    const state = get();
    return {
      basicInfo: state.basicInfo,
      photo: state.photo ?? undefined,
      sections: state.sections,
      sectionStatus: state.sectionStatus,
      templateId: state.templateId,
      pageBreakSections: state.pageBreakSections,
      pageBreakItems: state.pageBreakItems,
      sectionOrder: state.sectionOrder ?? undefined,
    };
  },
}));

/**
 * Reactive equivalent of `getResumeData()` for use during render (the
 * preview). Selecting each field separately keeps every input referentially
 * stable between unrelated updates; assembling a fresh object straight from
 * a selector (`useBuilderStore(s => s.getResumeData())`) would hand
 * useSyncExternalStore a new reference on every call and spin forever.
 */
export function useResumeData(): ResumeData {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const photo = useBuilderStore((s) => s.photo);
  const sections = useBuilderStore((s) => s.sections);
  const sectionStatus = useBuilderStore((s) => s.sectionStatus);
  const templateId = useBuilderStore((s) => s.templateId);
  const pageBreakSections = useBuilderStore((s) => s.pageBreakSections);
  const pageBreakItems = useBuilderStore((s) => s.pageBreakItems);
  const sectionOrder = useBuilderStore((s) => s.sectionOrder);

  return useMemo(
    () => ({
      basicInfo,
      photo: photo ?? undefined,
      sections,
      sectionStatus,
      templateId,
      pageBreakSections,
      pageBreakItems,
      sectionOrder: sectionOrder ?? undefined,
    }),
    [basicInfo, photo, sections, sectionStatus, templateId, pageBreakSections, pageBreakItems, sectionOrder],
  );
}

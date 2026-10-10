import { create } from "zustand";
import { emptyCoverLetter, isGuidedParagraph, MAX_LETTER_FIELDS, newCustomParagraphId, saveCoverLetter } from "./coverLetter";
import { showToast } from "./toast";
import type { CoverLetterData, LetterField, LetterParagraph, TemplateId } from "./types";

type ParagraphId = LetterParagraph["id"];
type LetterText = Omit<CoverLetterData, "fields" | "paragraphs" | "templateId">;

interface CoverLetterState {
  letter: CoverLetterData;
  hasSavedCopy: boolean;
  setHasSavedCopy: (saved: boolean) => void;

  update: (patch: Partial<LetterText>) => void;
  setTemplateId: (id: TemplateId | null) => void;

  addField: () => void;
  updateField: (index: number, patch: Partial<LetterField>) => void;
  removeField: (index: number) => void;

  updateParagraph: (id: ParagraphId, text: string) => void;
  renameParagraph: (id: ParagraphId, label: string) => void;
  /** Appends a custom paragraph and returns its id, so the caller can open it. */
  addParagraph: () => ParagraphId;
  /** Custom paragraphs only — the guided ones are switched off instead. */
  removeParagraph: (id: ParagraphId) => void;
  toggleSkipParagraph: (id: ParagraphId) => void;
  /** Swaps a paragraph with its neighbour. No-op for a skipped paragraph,
   * matching the resume's section order. */
  moveParagraph: (id: ParagraphId, direction: "up" | "down") => void;
  /** Places a paragraph at an index in the current order (clamped). */
  reorderParagraph: (id: ParagraphId, toIndex: number) => void;

  clearRecipient: () => void;
  clearGreeting: () => void;
  clearParagraph: (id: ParagraphId) => void;
  clearClosing: () => void;

  loadFromData: (letter: CoverLetterData) => void;
  resetStore: () => void;
}

function mapParagraph(letter: CoverLetterData, id: ParagraphId, patch: Partial<LetterParagraph>): CoverLetterData {
  return { ...letter, paragraphs: letter.paragraphs.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

function placeAt(letter: CoverLetterData, id: ParagraphId, toIndex: number): CoverLetterData {
  const from = letter.paragraphs.findIndex((p) => p.id === id);
  if (from === -1 || letter.paragraphs[from].skipped) return letter;
  const to = Math.max(0, Math.min(letter.paragraphs.length - 1, toIndex));
  if (to === from) return letter;
  const paragraphs = [...letter.paragraphs];
  const [moved] = paragraphs.splice(from, 1);
  paragraphs.splice(to, 0, moved);
  return { ...letter, paragraphs };
}

export const useCoverLetterStore = create<CoverLetterState>((set) => ({
  letter: emptyCoverLetter(),
  hasSavedCopy: false,
  setHasSavedCopy: (hasSavedCopy) => set({ hasSavedCopy }),

  update: (patch) => set((s) => ({ letter: { ...s.letter, ...patch } })),
  setTemplateId: (templateId) => set((s) => ({ letter: { ...s.letter, templateId } })),

  addField: () =>
    set((s) =>
      s.letter.fields.length >= MAX_LETTER_FIELDS
        ? s
        : { letter: { ...s.letter, fields: [...s.letter.fields, { label: "", value: "" }] } },
    ),
  updateField: (index, patch) =>
    set((s) => ({
      letter: { ...s.letter, fields: s.letter.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) },
    })),
  removeField: (index) =>
    set((s) => ({ letter: { ...s.letter, fields: s.letter.fields.filter((_, i) => i !== index) } })),

  updateParagraph: (id, text) => set((s) => ({ letter: mapParagraph(s.letter, id, { text }) })),
  renameParagraph: (id, label) => set((s) => ({ letter: mapParagraph(s.letter, id, { label }) })),
  addParagraph: () => {
    const id = newCustomParagraphId();
    set((s) => ({ letter: { ...s.letter, paragraphs: [...s.letter.paragraphs, { id, label: "", text: "" }] } }));
    return id;
  },
  removeParagraph: (id) =>
    set((s) =>
      isGuidedParagraph(id) ? s : { letter: { ...s.letter, paragraphs: s.letter.paragraphs.filter((p) => p.id !== id) } },
    ),
  toggleSkipParagraph: (id) =>
    set((s) => {
      const current = s.letter.paragraphs.find((p) => p.id === id);
      return current ? { letter: mapParagraph(s.letter, id, { skipped: !current.skipped }) } : s;
    }),
  moveParagraph: (id, direction) =>
    set((s) => {
      const from = s.letter.paragraphs.findIndex((p) => p.id === id);
      if (from === -1) return s;
      const next = placeAt(s.letter, id, from + (direction === "up" ? -1 : 1));
      return next === s.letter ? s : { letter: next };
    }),
  reorderParagraph: (id, toIndex) =>
    set((s) => {
      const next = placeAt(s.letter, id, toIndex);
      return next === s.letter ? s : { letter: next };
    }),

  clearRecipient: () =>
    set((s) => ({
      letter: {
        ...s.letter,
        recipientName: "",
        recipientTitle: "",
        company: "",
        companyAddress: "",
        position: "",
        fields: [],
      },
    })),
  clearGreeting: () => set((s) => ({ letter: { ...s.letter, greeting: "" } })),
  clearParagraph: (id) => set((s) => ({ letter: mapParagraph(s.letter, id, { text: "", skipped: false }) })),
  clearClosing: () => set((s) => ({ letter: { ...s.letter, closing: "", signOff: "" } })),

  loadFromData: (letter) => set({ letter }),
  resetStore: () => set({ letter: emptyCoverLetter() }),
}));

const DEFAULT_ERROR = "Couldn't save this cover letter on this device. Storage may be full.";

/** Writes the current letter to this browser — Save & Next, Skip, template
 * changes and download all go through here, as with the resume. */
export function persistCurrentLetter(errorMessage = DEFAULT_ERROR): boolean {
  try {
    saveCoverLetter(useCoverLetterStore.getState().letter);
    useCoverLetterStore.getState().setHasSavedCopy(true);
    return true;
  } catch {
    showToast(errorMessage);
    return false;
  }
}

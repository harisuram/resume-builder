import { LETTER_PARAGRAPH_KINDS, type CoverLetterData, type LetterParagraph, type LetterParagraphKind } from "./types";

const STORAGE_KEY = "coverLetterData";

/** Inline, pre-paint twin of SAVED_RESUME_MARKER_SCRIPT for the letter
 * builder: marks <html> when a saved letter exists. */
export const SAVED_LETTER_MARKER_SCRIPT = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")!==null)document.documentElement.setAttribute("data-letter-saved","")}catch(e){}})();`;

export const MAX_LETTER_PARAGRAPH_LENGTH = 1200;
export const MAX_LETTER_FIELDS = 4;

export const SIGN_OFFS = ["Sincerely,", "Kind regards,", "Best regards,", "Yours faithfully,", "With appreciation,"] as const;

/** Builder copy for the guided paragraphs, in their default order. */
export const LETTER_PARAGRAPH_META: Record<LetterParagraphKind, { label: string; help: string; placeholder: string }> = {
  opening: {
    label: "Opening",
    help: "Name the role and where you found it, and say in one line why you're writing.",
    placeholder:
      "I'm writing to apply for the Senior Product Designer role posted on your careers page. With six years designing B2B tools, I'd love to bring that experience to your team.",
  },
  interest: {
    label: "Why you're interested",
    help: "What draws you to this company or role specifically — its product, mission, or a recent piece of work.",
    placeholder:
      "Your work making payroll simple for small businesses is exactly the kind of problem I enjoy: dense workflows that deserve a calm, clear interface.",
  },
  skills: {
    label: "Skills & experience",
    help: "The two or three strengths from your resume that matter most for this job.",
    placeholder:
      "At Northwind I led design for the billing platform, working closely with engineering to ship a component library now used across four products.",
  },
  achievements: {
    label: "Achievements",
    help: "One or two concrete results, with numbers if you have them.",
    placeholder: "My redesign of the onboarding flow cut drop-off by 32% and halved support tickets in its first quarter.",
  },
  fit: {
    label: "Why you're a good fit",
    help: "Connect your experience to what the company needs right now.",
    placeholder:
      "As you expand into larger accounts, my experience designing permission-heavy admin tools would let me contribute from the first week.",
  },
};

export function isGuidedParagraph(id: string): id is LetterParagraphKind {
  return (LETTER_PARAGRAPH_KINDS as readonly string[]).includes(id);
}

export function paragraphLabel(paragraph: LetterParagraph): string {
  if (isGuidedParagraph(paragraph.id)) return LETTER_PARAGRAPH_META[paragraph.id].label;
  return paragraph.label?.trim() || "Custom paragraph";
}

const LONG_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function todayLabel(now = new Date()): string {
  return LONG_DATE.format(now);
}

export const DEFAULT_GREETING = "Dear Hiring Manager,";

export function emptyCoverLetter(now = new Date()): CoverLetterData {
  return {
    date: todayLabel(now),
    recipientName: "",
    recipientTitle: "",
    company: "",
    companyAddress: "",
    position: "",
    fields: [],
    greeting: DEFAULT_GREETING,
    paragraphs: LETTER_PARAGRAPH_KINDS.map((id) => ({ id, text: "" })),
    closing: "",
    signOff: SIGN_OFFS[0],
    templateId: null,
  };
}

/** "Dear Ms Rivera," style greeting for a named recipient. */
export function greetingFor(recipientName: string): string {
  const name = recipientName.trim();
  return name ? `Dear ${name},` : DEFAULT_GREETING;
}

export function newCustomParagraphId(): LetterParagraph["id"] {
  return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ------------------------------------------------------------ validation */

export type LetterStepKey = "details" | "recipient" | "greeting" | LetterParagraph["id"] | "closing" | "export";

export function isRecipientComplete(letter: CoverLetterData): boolean {
  return Boolean(letter.company.trim() && letter.position.trim());
}

export function isGreetingComplete(letter: CoverLetterData): boolean {
  return Boolean(letter.greeting.trim());
}

export function isClosingComplete(letter: CoverLetterData): boolean {
  return Boolean(letter.signOff.trim());
}

export function isParagraphResolved(paragraph: LetterParagraph): boolean {
  return Boolean(paragraph.skipped || paragraph.text.trim());
}

/** Paragraphs that will actually print, in order. */
export function printedParagraphs(letter: CoverLetterData): LetterParagraph[] {
  return letter.paragraphs.filter((p) => !p.skipped && p.text.trim());
}

export function hasLetterBody(letter: CoverLetterData): boolean {
  return printedParagraphs(letter).length > 0;
}

/** Anything typed beyond the defaults — tells a first visit from a draft. */
export function hasLetterContent(letter: CoverLetterData): boolean {
  return Boolean(
    letter.recipientName.trim() ||
      letter.recipientTitle.trim() ||
      letter.company.trim() ||
      letter.companyAddress.trim() ||
      letter.position.trim() ||
      letter.closing.trim() ||
      letter.fields.some((f) => f.label.trim() || f.value.trim()) ||
      letter.paragraphs.some((p) => p.text.trim()),
  );
}

/* ----------------------------------------------------------- print model */

/** Exactly what the PDF prints, with blanks and skipped paragraphs gone. */
export interface LetterContent {
  date: string;
  recipient: string[];
  subject: string;
  fields: { label: string; value: string }[];
  greeting: string;
  paragraphs: string[];
  closing: string;
  signOff: string;
}

export function letterContent(letter: CoverLetterData): LetterContent {
  return {
    date: letter.date.trim(),
    recipient: [letter.recipientName, letter.recipientTitle, letter.company, ...letter.companyAddress.split("\n")]
      .map((line) => line.trim())
      .filter(Boolean),
    subject: letter.position.trim() ? `Re: ${letter.position.trim()}` : "",
    fields: letter.fields
      .map((f) => ({ label: f.label.trim(), value: f.value.trim() }))
      .filter((f) => f.value),
    greeting: letter.greeting.trim(),
    paragraphs: printedParagraphs(letter).map((p) => p.text.trim()),
    closing: letter.closing.trim(),
    signOff: letter.signOff.trim(),
  };
}

/* --------------------------------------------------------------- storage */

export function saveCoverLetter(letter: CoverLetterData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letter));
}

/** The saved letter over an empty one, so a copy saved before a field
 * existed still loads with every field defined. Guided paragraphs missing
 * from an older copy are appended rather than lost. */
export function loadCoverLetter(): CoverLetterData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeCoverLetter(JSON.parse(raw) as Partial<CoverLetterData>);
  } catch {
    return null;
  }
}

export function normalizeCoverLetter(saved: Partial<CoverLetterData>): CoverLetterData {
  const base = emptyCoverLetter();
  const paragraphs = Array.isArray(saved.paragraphs)
    ? saved.paragraphs.filter((p): p is LetterParagraph => Boolean(p && typeof p.id === "string" && typeof p.text === "string"))
    : base.paragraphs;
  for (const kind of LETTER_PARAGRAPH_KINDS) {
    if (!paragraphs.some((p) => p.id === kind)) paragraphs.push({ id: kind, text: "" });
  }
  return {
    ...base,
    ...saved,
    fields: Array.isArray(saved.fields) ? saved.fields : [],
    paragraphs,
    templateId: typeof saved.templateId === "string" ? saved.templateId : null,
  };
}

export function clearCoverLetter() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedCoverLetter(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

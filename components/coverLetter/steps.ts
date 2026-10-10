import {
  isClosingComplete,
  isGreetingComplete,
  isParagraphResolved,
  isRecipientComplete,
  paragraphLabel,
  type LetterStepKey,
} from "@/lib/coverLetter";
import { isBasicInfoComplete } from "@/lib/store";
import type { BasicInfo, CoverLetterData, LetterParagraph } from "@/lib/types";

export type { LetterStepKey };

const FIX_FIELDS_REASON = "Fix the highlighted fields before continuing.";

export function findParagraph(letter: CoverLetterData, key: LetterStepKey): LetterParagraph | undefined {
  return letter.paragraphs.find((p) => p.id === key);
}

/** Full linear order the step wizard walks: your details, recipient,
 * greeting, the body paragraphs in the user's order, closing, download —
 * the letter's twin of the resume's getWizardOrder. */
export function getLetterWizardOrder(letter: CoverLetterData): LetterStepKey[] {
  return ["details", "recipient", "greeting", ...letter.paragraphs.map((p) => p.id), "closing", "export"];
}

export function letterStepLabel(key: LetterStepKey, letter: CoverLetterData): string {
  if (key === "details") return "Your details";
  if (key === "recipient") return "Recipient";
  if (key === "greeting") return "Greeting";
  if (key === "closing") return "Closing";
  if (key === "export") return "Download";
  const paragraph = findParagraph(letter, key);
  return paragraph ? paragraphLabel(paragraph) : "Paragraph";
}

/** Body paragraphs are the only steps that can be switched off. */
export function isLetterStepSkippable(key: LetterStepKey, letter: CoverLetterData): boolean {
  return Boolean(findParagraph(letter, key));
}

export function isLetterStepSkipped(key: LetterStepKey, letter: CoverLetterData): boolean {
  return Boolean(findParagraph(letter, key)?.skipped);
}

export function isLetterStepValid(key: LetterStepKey, letter: CoverLetterData, basicInfo: BasicInfo): boolean {
  switch (key) {
    case "details":
      return isBasicInfoComplete(basicInfo);
    case "recipient":
      return isRecipientComplete(letter);
    case "greeting":
      return isGreetingComplete(letter);
    case "closing":
      return isClosingComplete(letter);
    case "export":
      return true;
    default: {
      const paragraph = findParagraph(letter, key);
      return paragraph ? isParagraphResolved(paragraph) : true;
    }
  }
}

/** Why Save & Next is disabled, in the same voice as the resume builder. */
export function letterNextBlockedReason(
  key: LetterStepKey,
  letter: CoverLetterData,
  basicInfo: BasicInfo,
): string | undefined {
  if (isLetterStepValid(key, letter, basicInfo)) return undefined;
  switch (key) {
    case "details":
      return basicInfo.name.trim() && basicInfo.email.trim() && basicInfo.location.trim()
        ? FIX_FIELDS_REASON
        : "Fill in your name, email, and location to continue.";
    case "recipient":
      return "Add the company and the position you're applying for to continue.";
    case "greeting":
      return "Add a greeting to continue.";
    case "closing":
      return "Add a sign-off to continue.";
    default:
      return "Write this paragraph, or skip it, to continue.";
  }
}

/** Next/Back land on the nearest step that is still included. */
export function adjacentLetterStep(
  order: readonly LetterStepKey[],
  fromIndex: number,
  direction: 1 | -1,
  letter: CoverLetterData,
): LetterStepKey | undefined {
  for (let i = fromIndex + direction; i >= 0 && i < order.length; i += direction) {
    if (!isLetterStepSkipped(order[i], letter)) return order[i];
  }
  return undefined;
}

export function letterDownloadBlockedReason(letter: CoverLetterData, basicInfo: BasicInfo): string | undefined {
  if (!isBasicInfoComplete(basicInfo)) {
    return basicInfo.name.trim() && basicInfo.email.trim() && basicInfo.location.trim()
      ? "Fix the highlighted fields in Your details before downloading."
      : "Fill in your name, email, and location in Your details before downloading.";
  }
  if (!letter.paragraphs.some((p) => !p.skipped && p.text.trim())) {
    return "Write at least one paragraph before downloading.";
  }
  return undefined;
}

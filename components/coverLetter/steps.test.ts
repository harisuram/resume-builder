import { emptyCoverLetter } from "@/lib/coverLetter";
import type { BasicInfo, CoverLetterData } from "@/lib/types";
import {
  adjacentLetterStep,
  getLetterWizardOrder,
  isLetterStepSkippable,
  isLetterStepValid,
  letterDownloadBlockedReason,
  letterNextBlockedReason,
  letterStepLabel,
} from "./steps";

const INFO: BasicInfo = { name: "Ada Lovelace", email: "ada@example.com", phone: "", location: "London", links: {} };
const EMPTY_INFO: BasicInfo = { name: "", email: "", phone: "", location: "", links: {} };

function letter(patch: Partial<CoverLetterData> = {}): CoverLetterData {
  return { ...emptyCoverLetter(new Date(2026, 9, 10)), ...patch };
}

describe("cover letter wizard", () => {
  it("walks details, recipient, greeting, the paragraphs in order, closing, download", () => {
    const l = letter({ paragraphs: [{ id: "fit", text: "" }, { id: "custom-a", label: "Referral", text: "" }] });
    expect(getLetterWizardOrder(l)).toEqual(["details", "recipient", "greeting", "fit", "custom-a", "closing", "export"]);
    expect(letterStepLabel("custom-a", l)).toBe("Referral");
    expect(letterStepLabel("export", l)).toBe("Download");
  });

  it("only lets body paragraphs be skipped", () => {
    const l = letter();
    expect(isLetterStepSkippable("opening", l)).toBe(true);
    expect(isLetterStepSkippable("recipient", l)).toBe(false);
    expect(isLetterStepSkippable("closing", l)).toBe(false);
  });

  it("gates Next the way the resume does, with a reason", () => {
    const l = letter();
    expect(isLetterStepValid("details", l, EMPTY_INFO)).toBe(false);
    expect(letterNextBlockedReason("details", l, EMPTY_INFO)).toBe("Fill in your name, email, and location to continue.");
    expect(isLetterStepValid("details", l, INFO)).toBe(true);
    expect(letterNextBlockedReason("recipient", l, INFO)).toMatch(/company and the position/);
    expect(isLetterStepValid("recipient", letter({ company: "N", position: "D" }), INFO)).toBe(true);
    expect(isLetterStepValid("opening", l, INFO)).toBe(false);
    expect(isLetterStepValid("opening", letter({ paragraphs: [{ id: "opening", text: "", skipped: true }] }), INFO)).toBe(true);
    expect(isLetterStepValid("closing", letter({ signOff: " " }), INFO)).toBe(false);
  });

  it("Next and Back step over skipped paragraphs", () => {
    const l = letter({
      paragraphs: [
        { id: "opening", text: "x" },
        { id: "interest", text: "", skipped: true },
        { id: "skills", text: "" },
      ],
    });
    const order = getLetterWizardOrder(l);
    expect(adjacentLetterStep(order, order.indexOf("opening"), 1, l)).toBe("skills");
    expect(adjacentLetterStep(order, order.indexOf("skills"), -1, l)).toBe("opening");
  });

  it("blocks download until the details and at least one paragraph are there", () => {
    expect(letterDownloadBlockedReason(letter(), EMPTY_INFO)).toMatch(/Your details/);
    expect(letterDownloadBlockedReason(letter(), INFO)).toBe("Write at least one paragraph before downloading.");
    expect(
      letterDownloadBlockedReason(letter({ paragraphs: [{ id: "opening", text: "Hi", skipped: true }] }), INFO),
    ).toBeDefined();
    expect(letterDownloadBlockedReason(letter({ paragraphs: [{ id: "opening", text: "Hi" }] }), INFO)).toBeUndefined();
  });
});

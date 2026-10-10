import {
  emptyCoverLetter,
  greetingFor,
  hasLetterContent,
  letterContent,
  loadCoverLetter,
  normalizeCoverLetter,
  paragraphLabel,
  saveCoverLetter,
  todayLabel,
} from "./coverLetter";
import { persistCurrentLetter, useCoverLetterStore } from "./coverLetterStore";
import { LETTER_PARAGRAPH_KINDS } from "./types";

const NOW = new Date(2026, 9, 10);

beforeEach(() => {
  localStorage.clear();
  useCoverLetterStore.getState().resetStore();
});

describe("cover letter model", () => {
  it("starts with today's date, a default greeting and sign-off, and the five guided paragraphs", () => {
    const letter = emptyCoverLetter(NOW);
    expect(letter.date).toBe("10 October 2026");
    expect(todayLabel(NOW)).toBe("10 October 2026");
    expect(letter.greeting).toBe("Dear Hiring Manager,");
    expect(letter.signOff).toBe("Sincerely,");
    expect(letter.paragraphs.map((p) => p.id)).toEqual([...LETTER_PARAGRAPH_KINDS]);
    expect(letter.templateId).toBeNull();
    expect(hasLetterContent(letter)).toBe(false);
  });

  it("greets a named recipient by name", () => {
    expect(greetingFor("  Dana Rivera ")).toBe("Dear Dana Rivera,");
    expect(greetingFor("")).toBe("Dear Hiring Manager,");
  });

  it("names custom paragraphs by their label, or generically", () => {
    expect(paragraphLabel({ id: "fit", text: "" })).toBe("Why you're a good fit");
    expect(paragraphLabel({ id: "custom-x", label: " Referral ", text: "" })).toBe("Referral");
    expect(paragraphLabel({ id: "custom-x", text: "" })).toBe("Custom paragraph");
  });

  it("prints only what's filled: blank lines, empty and skipped paragraphs drop out", () => {
    const content = letterContent({
      ...emptyCoverLetter(NOW),
      company: "Northwind",
      companyAddress: "1 Market St\n\n  SF  ",
      position: " Designer ",
      fields: [
        { label: "Job reference", value: "ENG-1" },
        { label: "Empty", value: "  " },
      ],
      paragraphs: [
        { id: "opening", text: " Hello. " },
        { id: "interest", text: "Hidden", skipped: true },
        { id: "skills", text: "   " },
      ],
    });
    expect(content.recipient).toEqual(["Northwind", "1 Market St", "SF"]);
    expect(content.subject).toBe("Re: Designer");
    expect(content.fields).toEqual([{ label: "Job reference", value: "ENG-1" }]);
    expect(content.paragraphs).toEqual(["Hello."]);
  });

  it("round-trips through storage, filling in anything an older copy lacks", () => {
    saveCoverLetter({ ...emptyCoverLetter(NOW), company: "Northwind", templateId: "fern" });
    expect(loadCoverLetter()).toMatchObject({ company: "Northwind", templateId: "fern" });

    const old = normalizeCoverLetter({ company: "Acme", paragraphs: [{ id: "custom-a", label: "Note", text: "Hi" }] } as never);
    expect(old.paragraphs.map((p) => p.id)).toEqual(["custom-a", ...LETTER_PARAGRAPH_KINDS]);
    expect(old.signOff).toBe("Sincerely,");
    expect(old.fields).toEqual([]);
    expect(old.templateId).toBeNull();

    localStorage.setItem("coverLetterData", "{not json");
    expect(loadCoverLetter()).toBeNull();
  });
});

describe("cover letter store", () => {
  const ids = () => useCoverLetterStore.getState().letter.paragraphs.map((p) => p.id);

  it("adds, renames and removes custom paragraphs; guided ones can't be removed", () => {
    const store = useCoverLetterStore.getState();
    const id = store.addParagraph();
    expect(id).toMatch(/^custom-/);
    store.renameParagraph(id, "Referral");
    expect(useCoverLetterStore.getState().letter.paragraphs.at(-1)).toMatchObject({ id, label: "Referral" });
    store.removeParagraph("opening");
    expect(ids()).toContain("opening");
    store.removeParagraph(id);
    expect(ids()).not.toContain(id);
  });

  it("reorders like resume sections: clamped, and a skipped paragraph stays put", () => {
    const store = useCoverLetterStore.getState();
    store.moveParagraph("opening", "up");
    expect(ids()[0]).toBe("opening");
    store.moveParagraph("opening", "down");
    expect(ids().slice(0, 2)).toEqual(["interest", "opening"]);
    store.reorderParagraph("fit", 0);
    expect(ids()[0]).toBe("fit");
    store.toggleSkipParagraph("skills");
    const before = ids();
    store.reorderParagraph("skills", 0);
    store.moveParagraph("skills", "up");
    expect(ids()).toEqual(before);
  });

  it("caps extra details at four and clears each step on its own", () => {
    const store = useCoverLetterStore.getState();
    for (let i = 0; i < 6; i++) store.addField();
    expect(useCoverLetterStore.getState().letter.fields).toHaveLength(4);
    store.update({ company: "Northwind", greeting: "Hi," });
    store.updateParagraph("opening", "Text");
    store.toggleSkipParagraph("opening");
    store.clearRecipient();
    store.clearParagraph("opening");
    const letter = useCoverLetterStore.getState().letter;
    expect(letter.company).toBe("");
    expect(letter.fields).toEqual([]);
    expect(letter.greeting).toBe("Hi,");
    expect(letter.paragraphs[0]).toMatchObject({ text: "", skipped: false });
  });

  it("saves the current letter to this device", () => {
    useCoverLetterStore.getState().update({ company: "Northwind" });
    expect(persistCurrentLetter()).toBe(true);
    expect(loadCoverLetter()?.company).toBe("Northwind");
    expect(useCoverLetterStore.getState().hasSavedCopy).toBe(true);
  });
});

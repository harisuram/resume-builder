import { isValidElement, type ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { render } from "@testing-library/react";
import { getRenderableSections } from "@/lib/resume";
import { resumeSectionTitle } from "@/lib/persona";
import { emptyCoverLetter, letterContent, type LetterContent } from "@/lib/coverLetter";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { ResumePdfDocument } from "./ResumePdfDocument";
import { renderResumePdf } from "./renderResumePdf";
import { letterWordBreaks } from "./CoverLetterBody";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const PHOTO = "data:image/jpeg;base64,/9j/4AAQ";

function sampleLetter(): LetterContent {
  const letter = emptyCoverLetter(new Date(2026, 9, 10));
  return letterContent({
    ...letter,
    recipientName: "Dana Rivera",
    recipientTitle: "Head of Design",
    company: "Northwind",
    companyAddress: "1 Market St\nSan Francisco",
    position: "Senior Product Designer",
    fields: [{ label: "Job reference", value: "ENG-2041" }],
    greeting: "Dear Dana,",
    paragraphs: [
      { id: "opening", text: "I'm applying for the Senior Product Designer role." },
      { id: "interest", text: "Your payroll work is exactly my kind of problem.", skipped: true },
      { id: "custom-a", label: "Referral", text: "Sam Lee on your team suggested I apply." },
      { id: "skills", text: "" },
    ],
    closing: "I'd welcome the chance to talk.",
    signOff: "Kind regards,",
  });
}

describe("cover letter in the PDF engine", () => {
  it("prints only filled, included paragraphs, in order", () => {
    const letter = sampleLetter();
    expect(letter.paragraphs).toEqual([
      "I'm applying for the Senior Product Designer role.",
      "Sam Lee on your team suggested I apply.",
    ]);
    expect(letter.recipient).toEqual(["Dana Rivera", "Head of Design", "Northwind", "1 Market St", "San Francisco"]);
    expect(letter.subject).toBe("Re: Senior Product Designer");
  });

  it.each(TEMPLATES.map((t) => t.id))("%s draws the letter under the template's own header, without resume sections", (id) => {
    const data = makeFullResumeData({ templateId: id, photo: PHOTO });
    const letter = sampleLetter();
    const { container } = render(<ResumePdfDocument data={data} letter={letter} />);
    const textContent = container.textContent ?? "";
    expect(textContent).toContain(data.basicInfo.name);
    expect(textContent).toContain(data.basicInfo.email);
    for (const line of [letter.date, letter.subject, "Job reference: ENG-2041", letter.greeting, ...letter.paragraphs, letter.closing, letter.signOff]) {
      expect(textContent).toContain(line);
    }
    expect(textContent).not.toContain("Your payroll work");
    // No resume section headings (or the summary) leak into the letter.
    for (const key of getRenderableSections(data)) {
      const title = resumeSectionTitle(key, data);
      const headings = Array.from(container.querySelectorAll('[data-pdf="Text"]')).filter((t) => t.textContent === title);
      expect([id, key, headings.length]).toEqual([id, key, 0]);
    }
    expect(textContent).not.toContain(data.sections.summary ?? "@@");
  });

  it("names the document as a cover letter", () => {
    const data = makeFullResumeData({ templateId: "atlas" });
    const { container } = render(<ResumePdfDocument data={data} letter={sampleLetter()} />);
    expect(container.querySelector('[data-pdf="Document"]')?.getAttribute("data-title")).toBe(`${data.basicInfo.name} - Cover letter`);
  });

  it("hands the letter through renderResumePdf", async () => {
    const letter = sampleLetter();
    await renderResumePdf(makeFullResumeData(), undefined, letter);
    const [element] = (pdf as jest.Mock).mock.calls.at(-1) as [ReactElement<{ letter?: LetterContent }>];
    expect(isValidElement(element)).toBe(true);
    expect(element.props.letter).toBe(letter);
  });

  describe("long runs with no spaces", () => {
    it("leaves ordinary words whole — the PDF otherwise never hyphenates", () => {
      expect(letterWordBreaks("Northwind")).toEqual(["Northwind"]);
      expect(letterWordBreaks("internationalization")).toEqual(["internationalization"]);
    });

    it("splits a long URL after its punctuation, keeping every character", () => {
      const url = "https://www.example.com/portfolio/case-studies";
      const parts = letterWordBreaks(url);
      expect(parts.join("")).toBe(url);
      expect(parts).toContain("example.");
      expect(parts.every((part) => part.length <= 24)).toBe(true);
    });

    it("chunks a run with nothing to break on", () => {
      const run = "a".repeat(60);
      const parts = letterWordBreaks(run);
      expect(parts.join("")).toBe(run);
      expect(parts.map((part) => part.length)).toEqual([24, 24, 12]);
    });
  });
});

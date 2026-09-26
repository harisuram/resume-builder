import { zipSync } from "fflate";
import { classifyResumeFile, extractResumeText, pdfItemsToText, validateResumeFile, wantsImportPrompt } from "./extractText";

describe("classifyResumeFile", () => {
  it("recognizes pdf, docx, and text by name", () => {
    expect(classifyResumeFile({ name: "cv.pdf", type: "" })).toBe("pdf");
    expect(classifyResumeFile({ name: "cv.docx", type: "" })).toBe("docx");
    expect(classifyResumeFile({ name: "cv.txt", type: "" })).toBe("txt");
    expect(classifyResumeFile({ name: "cv.doc", type: "" })).toBe("legacy-doc");
    expect(classifyResumeFile({ name: "photo.png", type: "image/png" })).toBe("unsupported");
  });
});

describe("validateResumeFile", () => {
  it("rejects oversized and unsupported files", () => {
    const huge = new File(["x"], "cv.pdf", { type: "application/pdf" });
    Object.defineProperty(huge, "size", { value: 7 * 1024 * 1024 });
    expect(() => validateResumeFile(huge)).toThrow(/6MB/);
    expect(() => validateResumeFile(new File(["x"], "cv.doc"))).toThrow(/docx/);
  });
});

describe("extractResumeText", () => {
  it("reads a plain text file", async () => {
    const file = new File(["Jordan Lee\nEngineer"], "resume.txt", { type: "text/plain" });
    await expect(extractResumeText(file)).resolves.toBe("Jordan Lee\nEngineer");
  });

  it("reads text from a minimal docx zip", async () => {
    const xml =
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Jordan Lee</w:t></w:r></w:p><w:p><w:r><w:t>Work History</w:t></w:r></w:p></w:document>';
    const bytes = zipSync({
      "word/document.xml": Uint8Array.from(Buffer.from(xml, "utf8")),
    });
    const file = new File([bytes], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const text = await extractResumeText(file);
    expect(text).toMatch(/Jordan Lee/);
    expect(text).toMatch(/Work History/);
  });
});


describe("pdfItemsToText", () => {
  /** A PDF text item at (x, y) — y counts up from the bottom, like pdf.js. */
  const item = (str: string, x: number, y: number, width = str.length * 5) => ({ str, transform: [1, 0, 0, 1, x, y], width });

  it("reads a two-column page one column at a time, header first", () => {
    const items = [
      item("Mei Tan", 40, 800, 80),
      item("Singapore | mei@example.com | linkedin.com/in/mei-tan", 40, 785, 400),
    ];
    const left = ["KEY SKILLS", "Revit", "Rhino", "AutoCAD", "LANGUAGES", "English", "Mandarin", "INTERESTS", "Sketching", "Bouldering", "Cycling", "Chess"];
    const right = ["ABOUT ME", "Architect focused on housing", "EXPERIENCE", "Project Architect", "Studio Halde, 2020 – Present", "Delivered 120 units", "EDUCATION", "NUS", "Master of Architecture", "PATENTS", "Timber joint", "Filed 2023"];
    left.forEach((str, i) => items.push(item(str, 40, 750 - i * 14, 90)));
    right.forEach((str, i) => items.push(item(str, 220, 750 - i * 14, 200)));
    const text = pdfItemsToText(items).split("\n");
    expect(text.slice(0, 2)).toEqual(["Mei Tan", "Singapore | mei@example.com | linkedin.com/in/mei-tan"]);
    expect(text.slice(2, 2 + left.length)).toEqual(left);
    expect(text.slice(2 + left.length)).toEqual(right);
  });

  it("keeps a one-column page with right-aligned dates line by line", () => {
    const items = [item("Jordan Lee", 40, 800, 90)];
    for (let i = 0; i < 12; i++) {
      items.push(item(`Engineer ${i} at Company ${i}`, 40, 760 - i * 28, 180));
      items.push(item(`20${10 + i}`, 480, 760 - i * 28, 30));
      items.push(item(`Shipped a long-running migration that touched every service in the fleet ${i}`, 40, 746 - i * 28, 470));
    }
    const text = pdfItemsToText(items).split("\n");
    expect(text[1]).toBe("Engineer 0 at Company 0 2010");
    expect(text[2]).toMatch(/^Shipped a long-running migration/);
  });
});


describe("wantsImportPrompt", () => {
  it("reads the home page's ?import=1 flag", () => {
    expect(wantsImportPrompt("?import=1")).toBe(true);
    expect(wantsImportPrompt("template=atlas&import")).toBe(true);
    expect(wantsImportPrompt("")).toBe(false);
    expect(wantsImportPrompt("?import=0")).toBe(false);
    expect(wantsImportPrompt("?template=atlas")).toBe(false);
  });
});

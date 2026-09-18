import { zipSync } from "fflate";
import { classifyResumeFile, extractResumeText, validateResumeFile } from "./extractText";

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

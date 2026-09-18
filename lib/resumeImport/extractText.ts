import { unzipSync } from "fflate";

export const MAX_IMPORT_BYTES = 6 * 1024 * 1024;
export const ACCEPT_RESUME_FILES = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export type ResumeFileKind = "pdf" | "docx" | "txt";

export class ResumeFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeFileError";
  }
}

export function classifyResumeFile(file: Pick<File, "name" | "type">): ResumeFileKind | "legacy-doc" | "unsupported" {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (name.endsWith(".doc") && !name.endsWith(".docx")) return "legacy-doc";
  if (name.endsWith(".pdf") || type === "application/pdf") return "pdf";
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || type.startsWith("text/")) return "txt";
  return "unsupported";
}

export function validateResumeFile(file: File): ResumeFileKind {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ResumeFileError("That file is too large — try one under 6MB.");
  }
  const kind = classifyResumeFile(file);
  if (kind === "legacy-doc") {
    throw new ResumeFileError("This looks like an old .doc file. Save it as PDF or .docx and try again.");
  }
  if (kind === "unsupported") {
    throw new ResumeFileError("Use a PDF, Word (.docx), or text file.");
  }
  return kind;
}

export async function extractResumeText(file: File): Promise<string> {
  const kind = validateResumeFile(file);
  const bytes = await readFileBytes(file);
  if (kind === "txt") return new TextDecoder("utf-8").decode(bytes);
  if (kind === "docx") return extractDocxText(bytes);
  return extractPdfText(bytes);
}

function readFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new ResumeFileError("Couldn't read that file."));
    reader.readAsArrayBuffer(file);
  });
}

function extractDocxText(data: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data);
  } catch {
    throw new ResumeFileError("Couldn't read that Word file. Try exporting it as PDF.");
  }
  const decoder = new TextDecoder("utf-8");
  const parts: string[] = [];
  const names = Object.keys(files).sort((a, b) => {
    const score = (name: string) => (name.includes("header") ? 0 : name.includes("document") ? 1 : 2);
    return score(a) - score(b);
  });
  for (const name of names) {
    if (!/word\/(document|header\d*)\.xml$/i.test(name)) continue;
    parts.push(wordXmlToText(decoder.decode(files[name])));
  }
  const text = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new ResumeFileError("That Word file didn't contain readable text.");
  return text;
}

function wordXmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\b[^>]*\/>/g, "\t")
    .replace(/<w:br\b[^>]*\/?>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:drawing[\s\S]*?<\/w:drawing>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type PdfTextItem = { str?: string; transform?: number[]; hasEOL?: boolean };

async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  try {
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    const limit = Math.min(pdf.numPages, 8);
    for (let i = 1; i <= limit; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(pdfItemsToText(content.items as PdfTextItem[]));
    }
    const text = pages.filter(Boolean).join("\n\n").trim();
    if (!text) {
      throw new ResumeFileError("Couldn't read text from that PDF. Try a text-based export instead of a scan.");
    }
    return text;
  } catch (err) {
    if (err instanceof ResumeFileError) throw err;
    throw new ResumeFileError("Couldn't read that PDF. Try another file or a Word/text export.");
  }
}

function pdfItemsToText(items: PdfTextItem[]): string {
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  for (const item of items) {
    if (!item?.str) continue;
    const x = item.transform?.[4] ?? 0;
    const y = Math.round((item.transform?.[5] ?? 0) * 2) / 2;
    let line = lines.find((l) => Math.abs(l.y - y) < 2.5);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, str: item.str });
  }
  lines.sort((a, b) => b.y - a.y);
  return lines
    .map((line) =>
      line.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

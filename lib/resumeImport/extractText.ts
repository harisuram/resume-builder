import { unzipSync } from "fflate";

export const MAX_IMPORT_BYTES = 6 * 1024 * 1024;
/** `?import=1` on /builder: arrived from "Import my resume" on the home page. */
export function wantsImportPrompt(search: string): boolean {
  const value = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("import");
  return value !== null && value !== "0" && value !== "false";
}

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

type PdfTextItem = { str?: string; transform?: number[]; width?: number; hasEOL?: boolean };

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

/** Rebuilds a page's text in reading order. A two-column page is read one
 * column at a time (full-width lines above the columns first) — joined line
 * by line across the page, a sidebar's "Skills" landed in the middle of the
 * experience entries and the import lost both. */
export function pdfItemsToText(items: PdfTextItem[]): string {
  const boxes = items
    .filter((item) => item?.str && item.str.trim())
    .map((item) => ({
      str: item.str as string,
      x: item.transform?.[4] ?? 0,
      y: Math.round((item.transform?.[5] ?? 0) * 2) / 2,
      w: item.width ?? 0,
    }));
  const gutter = findColumnGutter(boxes);
  if (gutter === null) return boxesToLines(boxes);

  const sameLine = (a: number, b: number) => Math.abs(a - b) < 2.5;
  const crossingYs = boxes.filter((b) => b.x < gutter && b.x + b.w > gutter).map((b) => b.y);
  // The columns start at the first right-hand line no text crosses; anything
  // above that (name, contact line, a link wrapped under it) is the header.
  const columnTop = Math.max(
    ...boxes.filter((b) => b.x >= gutter && !crossingYs.some((y) => sameLine(y, b.y))).map((b) => b.y),
  );
  const top = boxes.filter((b) => b.y > columnTop + 2.5);
  const rest = boxes.filter((b) => b.y <= columnTop + 2.5);
  return [
    boxesToLines(top),
    boxesToLines(rest.filter((b) => b.x + b.w / 2 < gutter)),
    boxesToLines(rest.filter((b) => b.x + b.w / 2 >= gutter)),
  ]
    .filter(Boolean)
    .join("\n");
}

type TextBox = { str: string; x: number; y: number; w: number };

/** The x of a vertical gap no text crosses, with a real share of the page's
 * text on each side — or null for a single-column page. Right-aligned dates
 * in a one-column resume don't qualify: they're a small share, and the body
 * lines between them cross the middle. */
function findColumnGutter(boxes: TextBox[]): number | null {
  if (boxes.length < 20) return null;
  const minX = Math.min(...boxes.map((b) => b.x));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const span = maxX - minX;
  if (span <= 0) return null;
  let best: { g: number; crossing: number; balance: number } | null = null;
  for (let step = 20; step <= 80; step++) {
    const g = minX + (span * step) / 100;
    let crossing = 0;
    let left = 0;
    let right = 0;
    for (const b of boxes) {
      if (b.x < g && b.x + b.w > g) crossing++;
      else if (b.x + b.w <= g) left++;
      else right++;
    }
    if (left < boxes.length * 0.2 || right < boxes.length * 0.2) continue;
    const balance = Math.min(left, right);
    if (!best || crossing < best.crossing || (crossing === best.crossing && balance > best.balance)) {
      best = { g, crossing, balance };
    }
  }
  // A few header lines may cross it; the columns themselves must not.
  if (!best || best.crossing > Math.max(3, boxes.length * 0.06)) return null;
  // Both sides have to run down the page together, not one above the other.
  const leftYs = boxes.filter((b) => b.x + b.w <= best.g).map((b) => b.y);
  const rightYs = boxes.filter((b) => b.x >= best.g).map((b) => b.y);
  const overlap = Math.min(Math.max(...leftYs), Math.max(...rightYs)) - Math.max(Math.min(...leftYs), Math.min(...rightYs));
  const height = Math.max(...boxes.map((b) => b.y)) - Math.min(...boxes.map((b) => b.y));
  return overlap > height * 0.3 ? best.g : null;
}

function boxesToLines(boxes: TextBox[]): string {
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  for (const box of boxes) {
    let line = lines.find((l) => Math.abs(l.y - box.y) < 2.5);
    if (!line) {
      line = { y: box.y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x: box.x, str: box.str });
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

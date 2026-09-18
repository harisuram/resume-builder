import { AI_BACKOFF_MS, AI_LIMITED_UNTIL_KEY, AI_LIMIT_MESSAGE, AiLimitError } from "../ai";
import { extractResumeText, ResumeFileError, validateResumeFile } from "./extractText";
import { parseResumeText } from "./heuristic";
import { MAX_RESUME_CHARS, MIN_RESUME_CHARS } from "./limits";
import { mergeImportedResumes, normalizeParsedResume, type ImportedResume } from "./normalize";

export type ImportProgress = "reading" | "extracting" | "parsing" | "filling";

export async function importResumeFromFile(
  file: File,
  onProgress?: (stage: ImportProgress) => void,
): Promise<ImportedResume> {
  onProgress?.("reading");
  validateResumeFile(file);

  onProgress?.("extracting");
  const text = (await extractResumeText(file)).trim();
  if (text.length < MIN_RESUME_CHARS) {
    throw new ResumeFileError("Couldn't read enough text from that file. Try a PDF, Word, or text export.");
  }

  onProgress?.("parsing");
  const heuristic = parseResumeText(text);
  let overlay: ImportedResume | null = null;
  try {
    overlay = await parseResumeWithAi(text);
  } catch (err) {
    if (err instanceof AiLimitError && heuristic.filled.length === 0) throw err;
  }

  const merged = overlay ? mergeImportedResumes(heuristic, overlay) : heuristic;
  if (merged.filled.length === 0) {
    throw new ResumeFileError("Couldn't find resume details in that file. Try a clearer PDF or a text export.");
  }

  onProgress?.("filling");
  return merged;
}

async function parseResumeWithAi(text: string): Promise<ImportedResume> {
  if (typeof localStorage !== "undefined") {
    const until = Number(localStorage.getItem(AI_LIMITED_UNTIL_KEY) ?? 0);
    if (Date.now() < until) {
      throw new AiLimitError(AI_LIMIT_MESSAGE);
    }
  }

  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, MAX_RESUME_CHARS) }),
  });

  if (res.status === 429) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AI_LIMITED_UNTIL_KEY, String(Date.now() + AI_BACKOFF_MS));
    }
    throw new AiLimitError(AI_LIMIT_MESSAGE);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Couldn't parse that resume. Try again later.");
  }
  const body = (await res.json()) as { resume?: unknown };
  const parsed = normalizeParsedResume(body.resume ?? body);
  if (parsed.filled.length === 0) {
    throw new Error("Couldn't parse that resume. Try again later.");
  }
  return parsed;
}

export { ResumeFileError };

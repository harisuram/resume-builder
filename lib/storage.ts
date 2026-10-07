import type { ResumeData } from "./types";

const STORAGE_KEY = "resumeData";

/** Inline, pre-paint: marks <html> when a saved résumé exists so the builder
 * can keep its empty static form hidden until that copy is loaded in. */
export const SAVED_RESUME_MARKER_SCRIPT = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")!==null)document.documentElement.setAttribute("data-resume-saved","")}catch(e){}})();`;

export function saveResumeData(data: ResumeData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadResumeData(): ResumeData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ResumeData;
  } catch {
    return null;
  }
}

export function clearResumeData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedResumeData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

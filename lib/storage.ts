import type { ResumeData } from "./types";

const STORAGE_KEY = "resumeData";

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

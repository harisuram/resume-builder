export const THEME_STORAGE_KEY = "resumeTheme";
export type ColorTheme = "light" | "dark";

export function isColorTheme(value: string | null | undefined): value is ColorTheme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): ColorTheme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isColorTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function prefersDark(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolvedTheme(): ColorTheme {
  return readStoredTheme() ?? (prefersDark() ? "dark" : "light");
}

export function applyTheme(theme: ColorTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function persistTheme(theme: ColorTheme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode — the in-page theme still applies for this session.
  }
}

export function toggleTheme(current: ColorTheme = resolvedTheme()): ColorTheme {
  const next = current === "dark" ? "light" : "dark";
  persistTheme(next);
  return next;
}

/** Runs before paint so a stored choice is on the first frame. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;}}catch(e){}})();`;

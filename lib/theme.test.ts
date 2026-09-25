import {
  applyTheme,
  isColorTheme,
  persistTheme,
  readStoredTheme,
  resolvedTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from "./theme";

function setScheme(dark: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: dark && query.includes("prefers-color-scheme: dark"),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  setScheme(false);
});

describe("theme", () => {
  it("accepts only light and dark", () => {
    expect(isColorTheme("dark")).toBe(true);
    expect(isColorTheme("light")).toBe(true);
    expect(isColorTheme("system")).toBe(false);
    expect(isColorTheme(null)).toBe(false);
  });

  it("defaults to light even when the system prefers dark", () => {
    setScheme(true);
    expect(resolvedTheme()).toBe("light");
  });

  it("follows the stored choice", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
    expect(resolvedTheme()).toBe("dark");
  });

  it("ignores junk in storage and falls back to light", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    setScheme(true);
    expect(readStoredTheme()).toBeNull();
    expect(resolvedTheme()).toBe("light");
  });

  it("applies and persists a toggle", () => {
    persistTheme("light");
    expect(toggleTheme()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(toggleTheme()).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("still applies when storage throws", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    applyTheme("dark");
    persistTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    spy.mockRestore();
  });
});

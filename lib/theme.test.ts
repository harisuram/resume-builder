import {
  applyTheme,
  isColorTheme,
  persistTheme,
  prefersDark,
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

  it("follows the stored choice over the system preference", () => {
    setScheme(true);
    expect(resolvedTheme()).toBe("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(readStoredTheme()).toBe("light");
    expect(resolvedTheme()).toBe("light");
  });

  it("ignores junk in storage and falls back to the system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    setScheme(true);
    expect(readStoredTheme()).toBeNull();
    expect(resolvedTheme()).toBe("dark");
  });

  it("returns false for prefersDark when matchMedia is missing", () => {
    // @ts-expect-error — jsdom can ship a stub; this covers older environments.
    delete window.matchMedia;
    expect(prefersDark()).toBe(false);
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

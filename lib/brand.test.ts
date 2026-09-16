import { readFileSync } from "fs";
import { join } from "path";
import { BRAND } from "./brand";

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
const tokens = css.slice(0, css.indexOf(":root[data-theme="));

describe("brand tokens", () => {
  it("keeps the light-theme CSS variables aligned with BRAND", () => {
    expect(tokens).toContain(`--color-paper: ${BRAND.paper}`);
    expect(tokens).toContain(`--color-ink: ${BRAND.ink}`);
    expect(tokens).toContain(`--color-accent: ${BRAND.accent}`);
    expect(tokens).toContain(`--color-ink-soft: ${BRAND.inkSoft}`);
    expect(tokens).toContain(`--color-ink-faint: ${BRAND.inkFaint}`);
  });

  it("uses the same accent on the SVG favicon the browser tab loads", () => {
    const icon = readFileSync(join(__dirname, "..", "app", "icon.svg"), "utf8");
    expect(icon).toContain(BRAND.accent);
    expect(icon).not.toContain("#7a2e2e");
    expect(icon).not.toContain("#faf7f0");
  });
});

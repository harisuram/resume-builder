/** Colour maths for the PDF document. The HTML templates lean on CSS
 * `color-mix()` and alpha (`text-white/85`); react-pdf takes neither, so the
 * same blends are resolved to plain hex here. */

function parseHex(hex: string): [number, number, number] {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) value = value.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Not a hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(channels: number[]): string {
  return `#${channels.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** `color-mix(in srgb, <color> <weight>%, <base>)`. */
export function mixHex(color: string, weight: number, base = "#ffffff"): string {
  const a = parseHex(color);
  const b = parseHex(base);
  const w = Math.min(100, Math.max(0, weight)) / 100;
  return toHex(a.map((channel, i) => channel * w + b[i] * (1 - w)));
}

/** PDF twin of the templates' `tint()` — the accent washed toward white. */
export function tintHex(accent: string, weight = 12): string {
  return mixHex(accent, weight);
}

import type { Page } from "@playwright/test";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import type { ResumeData } from "@/lib/types";

const STORAGE_KEY = "resumeData";

/** Marker stamped into every bullet so a printed page's content can be
 * traced back to a Y on the continuous document. Letters only — pdf.js
 * splits digit runs into separate text items often enough that a numeric
 * token can't be found again in the extracted text. */
export function markerFor(i: number): string {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return "QQ" + a[Math.floor(i / 26) % 26] + a[i % 26] + "QQ";
}

/** Stamps a unique marker at the start of every block that can begin a page,
 * in document order. Bullets alone are not enough: a sheet that opens with a
 * heading or an entry title then carries no marker until partway down, and the
 * first marker found reads as a cut much lower than the real one. */
export function stampMarkers(data: ResumeData): ResumeData {
  let i = 0;
  const tag = (t: string) => `${markerFor(i++)} ${t}`;
  const s = data.sections;

  if (s.summary) s.summary = tag(s.summary);
  s.keyAchievements = s.keyAchievements?.map(tag);
  for (const key of ["experience", "internships", "partTime"] as const) {
    for (const entry of s[key] ?? []) {
      entry.role = tag(entry.role ?? "");
      entry.bullets = entry.bullets?.map(tag);
    }
  }
  for (const entry of s.education ?? []) entry.institution = tag(entry.institution ?? "");
  for (const entry of s.projects ?? []) {
    entry.name = tag(entry.name ?? "");
    if (entry.description) entry.description = tag(entry.description);
  }
  for (const entry of s.certifications ?? []) entry.name = tag(entry.name ?? "");
  for (const entry of s.patents ?? []) entry.title = tag(entry.title ?? "");
  for (const entry of s.languages ?? []) entry.name = tag(entry.name ?? "");
  for (const item of s.additional?.items ?? []) {
    item.title = tag(item.title ?? "");
    item.bullets = item.bullets?.map(tag);
  }
  s.skills = s.skills?.map(tag);
  s.hobbies = s.hobbies?.map(tag);
  s.softSkills = s.softSkills?.map(tag);
  return data;
}

export async function seedBuilder(page: Page, id: string, data: ResumeData): Promise<void> {
  await page.addInitScript(
    ([k, j, t]) => {
      window.localStorage.setItem(k, j);
      window.localStorage.setItem(t, "1");
    },
    [STORAGE_KEY, JSON.stringify(data), TOUR_DISMISSED_KEY] as const,
  );
  await page.goto(`/builder?template=${encodeURIComponent(id)}`);
  await page.getByRole("button", { name: "Preview & download" }).click();
  // Browser-print templates mount the HTML print root; PDF-engine-only
  // templates (the multi-column families) mount the PDF preview instead.
  await page.locator("#resume-print-root, [data-testid='pdf-engine-preview']").first().waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

/** Y offsets the preview drew its sheets at. */
export async function previewCuts(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-page-visual-stage]")).map((el) =>
      Math.round(-parseFloat(/translateY\((-?[\d.]+)px\)/.exec(el.style.transform)?.[1] ?? "0")),
    ),
  );
}

/** Document Y of every marker, measured on the parked print layout. */
export async function markerPositions(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("#resume-print-root")!;
    const style = getComputedStyle(root);
    // Page coordinates, not root-box coordinates: the root's own padding-top
    // (the reserved paper margin) sits above the first line of content.
    const origin = root.getBoundingClientRect().top + (parseFloat(style.paddingTop) || 0);
    const out: Record<string, number> = {};
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walk.nextNode())) {
      const m = /QQ([A-Z]{2})QQ/.exec(node.nodeValue ?? "");
      if (!m) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      out[m[1]] = Math.round(range.getBoundingClientRect().top - origin);
    }
    return out;
  });
}

export async function parkForPrint(page: Page): Promise<void> {
  await page.evaluate(() => window.dispatchEvent(new Event("resume:prepare-print")));
  await page.emulateMedia({ media: "print" });
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}

/** First marker on each printed sheet, as a document Y. Sheet 1 is always 0. */
export async function printCuts(page: Page, positions: Record<string, number>): Promise<number[]> {
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(pdf.byteLength);
  bytes.set(pdf);
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false })
    .promise;
  const cuts: number[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    // No separator: pdf.js hands back a marker split across several items.
    const text = (await pg.getTextContent()).items
      .map((it) => (it as { str: string }).str)
      .join("");
    const found = Array.from(text.matchAll(/QQ([A-Z]{2})QQ/g)).map((m) => m[1]);
    const ys = found.map((k) => positions[k]).filter((y) => y !== undefined);
    cuts.push(i === 1 ? 0 : ys.length ? Math.min(...ys) : Number.NaN);
  }
  return cuts;
}

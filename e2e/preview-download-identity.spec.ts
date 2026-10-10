import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import type { ResumeData } from "@/lib/types";
import { makeLongResume } from "./fixtures/longResume";

/**
 * Stricter than content-parity (same lines per page): for every template, at
 * a short, a medium and a long length, the PDF the preview draws and the PDF
 * the Download button saves must be the same drawing — same pages and page
 * sizes, every text run at the same position, and the same sequence of
 * drawing operations (fills, rules, rails, images). A block moved a few
 * points, a page break taken one line later, or a colour band that differs
 * all fail here even when the text lines happen to match.
 */

interface PageFingerprint {
  size: string;
  /** Each text run with its position, to 0.1pt. */
  runs: string[];
  /** Every drawing operation and its numeric arguments, to 0.1pt. Font and
   * image resource names are left out: they are per-file identifiers. */
  ops: string[];
}

async function fingerprint(data: Uint8Array): Promise<PageFingerprint[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false }).promise;
  const round = (n: number) => Math.round(n * 10) / 10;
  const numbers = (value: unknown): unknown =>
    typeof value === "number"
      ? round(value)
      : Array.isArray(value) || ArrayBuffer.isView(value)
        ? Array.from(value as ArrayLike<unknown>).map(numbers)
        : typeof value === "string"
          ? "·"
          : value && typeof value === "object"
            ? "{}"
            : value;
  const pages: PageFingerprint[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pdfPage = await doc.getPage(n);
    const { width, height } = pdfPage.getViewport({ scale: 1 });
    const items = (await pdfPage.getTextContent()).items as { str: string; transform: number[] }[];
    const runs = items
      .filter((item) => item.str.trim())
      .map((item) => `${round(item.transform[4])},${round(item.transform[5])} ${item.str}`);
    const list = await pdfPage.getOperatorList();
    const ops = list.fnArray.map((fn, i) => `${fn}:${JSON.stringify(numbers(list.argsArray[i]))}`);
    pages.push({ size: `${round(width)}x${round(height)}`, runs, ops });
    pdfPage.cleanup();
  }
  await doc.destroy();
  return pages;
}

async function openBuilder(page: Page, data: ResumeData) {
  await page.addInitScript(
    ([json, tourKey]) => {
      window.localStorage.setItem("resumeData", json);
      window.localStorage.setItem(tourKey, "1");
    },
    [JSON.stringify(data), TOUR_DISMISSED_KEY] as const,
  );
  await page.goto(`/builder?template=${encodeURIComponent(data.templateId)}`);
}

/** The PDF a preview pane drew its pages from, and how many sheets it shows.
 * Read in one step, once the pane has held the same file for a moment — a
 * resize while it settles redraws it, and two separate reads could straddle
 * that swap. */
async function previewPdf(page: Page): Promise<{ bytes: Uint8Array; shown: number }> {
  const preview = page.getByTestId("pdf-engine-preview");
  await expect(preview.getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
  const snapshot = () =>
    preview.evaluate((host) => ({
      src: host.querySelector("[data-pdf-src]")?.getAttribute("data-pdf-src") ?? "",
      shown: host.querySelectorAll("[data-pdf-page]").length,
    }));
  let before = await snapshot();
  for (;;) {
    await page.waitForTimeout(400);
    const after = await snapshot();
    if (after.src && after.src === before.src && after.shown === before.shown) break;
    before = after;
  }
  const raw = await preview.evaluate(async (host) => {
    const src = host.querySelector("[data-pdf-src]")!.getAttribute("data-pdf-src")!;
    const shown = host.querySelectorAll("[data-pdf-page]").length;
    const response = await fetch(src);
    return { bytes: Array.from(new Uint8Array(await response.arrayBuffer())), shown };
  });
  return { bytes: new Uint8Array(raw.bytes), shown: raw.shown };
}

async function downloadedPdf(page: Page): Promise<Uint8Array> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  return new Uint8Array(await readFile((await download.path())!));
}

/** First difference between two documents, as a readable line. */
function firstDifference(a: PageFingerprint[], b: PageFingerprint[]): string | null {
  if (a.length !== b.length) return `page count: preview ${a.length} vs download ${b.length}`;
  for (let p = 0; p < a.length; p++) {
    if (a[p].size !== b[p].size) return `page ${p + 1} size: ${a[p].size} vs ${b[p].size}`;
    for (const key of ["runs", "ops"] as const) {
      const [x, y] = [a[p][key], b[p][key]];
      const at = x.findIndex((v, i) => v !== y[i]);
      if (at !== -1 || x.length !== y.length) {
        const i = at === -1 ? Math.min(x.length, y.length) : at;
        return `page ${p + 1} ${key} #${i + 1}: preview "${x[i] ?? "(end)"}" vs download "${y[i] ?? "(end)"}"`;
      }
    }
  }
  return null;
}

/** Short (one or two sheets), medium, and the full ~10-page fixture. */
const LENGTHS: { label: string; roles: number }[] = [
  { label: "short", roles: 1 },
  { label: "medium", roles: 5 },
  { label: "long", roles: Infinity },
];

function sized(id: string, roles: number): ResumeData {
  const data = makeLongResume(id);
  if (Number.isFinite(roles)) {
    data.sections.experience = data.sections.experience!.slice(0, roles);
    data.sections.projects = data.sections.projects?.slice(0, roles);
  }
  return data;
}

test.describe("preview and download are the same drawing, page for page", () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id} (${theme.layout})`, async ({ page }) => {
      // Three full builder loads; the first tests also wait on a cold dev compile.
      test.setTimeout(420_000);
      for (const { label, roles } of LENGTHS) {
        const data = sized(theme.id, roles);
        await page.goto("about:blank");
        await openBuilder(page, data);

        // The live preview beside the editor…
        const live = await previewPdf(page);
        // …then the export step's preview and the file it saves.
        await page.getByRole("button", { name: "Download", exact: true }).click();
        const exported = await previewPdf(page);
        const saved = await downloadedPdf(page);

        const [liveFp, exportFp, savedFp] = await Promise.all([
          fingerprint(live.bytes),
          fingerprint(exported.bytes),
          fingerprint(saved),
        ]);
        // The sheets drawn on screen are the preview file's pages.
        expect(live.shown, `${label}: live preview sheets`).toBe(liveFp.length);
        expect(exported.shown, `${label}: export preview sheets`).toBe(exportFp.length);
        expect(savedFp.length, `${label}: downloaded pages`).toBeGreaterThan(0);
        expect(firstDifference(liveFp, savedFp), `${label}: live preview vs download`).toBeNull();
        expect(firstDifference(exportFp, savedFp), `${label}: export preview vs download`).toBeNull();
        test.info().annotations.push({ type: label, description: `${savedFp.length} page(s)` });
      }
    });
  }
});

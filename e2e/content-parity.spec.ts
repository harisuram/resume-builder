import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import type { ResumeData } from "@/lib/types";
import { makeLongResume } from "./fixtures/longResume";

/**
 * Every template previews and downloads through the PDF engine. This holds
 * the preview the user watches while editing to the file they download, line
 * by line: each page of the live preview's PDF must carry exactly the same
 * lines of text, in the same order, as the same page of the downloaded file.
 * A single line — or word — on the other side of a page break fails.
 */

/** Lines of text on each page of a PDF, in reading order, whitespace
 * normalised (pdf.js splits runs differently between otherwise identical
 * files, so compare lines, not raw items). */
async function pageLines(data: Uint8Array): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false }).promise;
  const pages: string[][] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pdfPage = await doc.getPage(n);
    const items = (await pdfPage.getTextContent()).items as { str: string; transform: number[] }[];
    // Group runs into lines by baseline, then order lines top-down and runs
    // left-to-right within a line.
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const row = rows.get(y) ?? [];
      row.push({ x, str: item.str });
      rows.set(y, row);
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, runs]) =>
        runs
          .sort((a, b) => a.x - b.x)
          .map((run) => run.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    pages.push(lines);
    pdfPage.cleanup();
  }
  await doc.destroy();
  return pages;
}

async function openBuilder(page: Page, id: string, data: ResumeData) {
  await page.addInitScript(
    ([json, tourKey]) => {
      window.localStorage.setItem("resumeData", json);
      window.localStorage.setItem(tourKey, "1");
    },
    [JSON.stringify(data), TOUR_DISMISSED_KEY] as const,
  );
  await page.goto(`/builder?template=${encodeURIComponent(id)}`);
}

/** The PDF behind a preview pane, read from the file it drew its pages from. */
async function previewPdf(page: Page): Promise<Uint8Array> {
  const preview = page.getByTestId("pdf-engine-preview");
  await expect(preview.getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
  const bytes = await preview.locator("[data-pdf-src]").evaluate(async (host) => {
    const response = await fetch(host.getAttribute("data-pdf-src")!);
    return Array.from(new Uint8Array(await response.arrayBuffer()));
  });
  return new Uint8Array(bytes);
}

async function downloadedPdf(page: Page): Promise<Uint8Array> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  return new Uint8Array(await readFile((await download.path())!));
}

function describeMismatch(preview: string[][], saved: string[][]): string[] {
  const problems: string[] = [];
  for (let i = 0; i < Math.max(preview.length, saved.length); i++) {
    const shown = preview[i] ?? [];
    const inFile = saved[i] ?? [];
    const firstDiff = shown.findIndex((line, j) => line !== inFile[j]);
    if (firstDiff !== -1 || shown.length !== inFile.length) {
      const at = firstDiff === -1 ? Math.min(shown.length, inFile.length) : firstDiff;
      problems.push(
        `page ${i + 1}, line ${at + 1}: preview "${shown[at] ?? "(page ends)"}" vs download "${inFile[at] ?? "(page ends)"}"`,
      );
    }
  }
  return problems;
}

async function compare(page: Page, id: string, data = makeLongResume(id)) {
  await openBuilder(page, id, data);
  // The live preview beside the editor.
  const live = await pageLines(await previewPdf(page));

  // The export step's preview, then the file the button saves.
  await page.getByRole("button", { name: "Preview & download" }).click();
  const exported = await pageLines(await previewPdf(page));
  const saved = await pageLines(await downloadedPdf(page));

  expect(live.flat().length, `${id}: preview has no text`).toBeGreaterThan(0);
  expect(live.length, `${id}: live preview page count`).toBe(saved.length);
  expect(describeMismatch(live, saved), `${id}: live preview vs download, line by line`).toEqual([]);
  expect(describeMismatch(exported, saved), `${id}: export preview vs download, line by line`).toEqual([]);
}

test.describe("same lines on every page: preview vs download (~10-page resume)", () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id} (${theme.layout})`, async ({ page }) => {
      await compare(page, theme.id);
    });
  }
});

test.describe("same lines on every page across document lengths", () => {
  // One template per layout family.
  for (const id of ["atlas", "ember", "twin", "dossier"]) {
    for (const roles of [2, 9, 16]) {
      test(`${id} with ${roles} roles`, async ({ page }) => {
        const data = makeLongResume(id);
        data.sections.experience = data.sections.experience!.slice(0, roles);
        await compare(page, id, data);
      });
    }
  }
});

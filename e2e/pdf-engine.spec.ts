import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { makeLongResume } from "./fixtures/longResume";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { seedBuilder } from "./helpers/printCuts";

/**
 * The react-pdf engine (components/pdf) renders the resume to a PDF file,
 * previews that file, and downloads the same file. These cases hold it to
 * that: the preview draws exactly as many pages as the downloaded PDF has,
 * the download is a real A4 PDF with the resume's text in it, and templates
 * the engine doesn't draw yet keep the browser-print path.
 */

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

/** Text of each page of a PDF, read with the same pdf.js the app uses. */
async function pdfPageTexts(data: Uint8Array): Promise<{ widthPt: number; heightPt: number; text: string }[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { width, height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pages.push({ widthPt: width, heightPt: height, text });
  }
  return pages;
}

/** Waits for the export step's preview to show the rendered PDF. */
async function useNewEngine(page: Page) {
  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, {
    timeout: 60_000,
  });
}

async function previewPageCount(page: Page): Promise<number> {
  return page.locator("[data-pdf-page]").count();
}

async function downloadPdf(page: Page): Promise<Uint8Array> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  return new Uint8Array(await readFile((await download.path())!));
}

const ENGINE_TEMPLATES = [
  // single column
  "atlas",
  "marquee",
  "grove",
  "nocturne",
  // sidebar: solid left rail, tinted right rail, name band over a tinted rail
  "ember",
  "aisle",
  "tidewater",
  // two column
  "twin",
  "prism",
  // labeled
  "dossier",
];

for (const templateId of ENGINE_TEMPLATES) {
  test(`${templateId}: the preview is the downloaded PDF, page for page`, async ({ page }) => {
    const data = makeLongResume(templateId);
    await seedBuilder(page, templateId, data);
    await useNewEngine(page);

    const shown = await previewPageCount(page);
    expect(shown).toBeGreaterThan(1);

    const pdf = await downloadPdf(page);
    const pages = await pdfPageTexts(pdf);
    expect(pages).toHaveLength(shown);
    for (const sheet of pages) {
      expect(sheet.widthPt).toBeCloseTo(A4_WIDTH_PT, 0);
      expect(sheet.heightPt).toBeCloseTo(A4_HEIGHT_PT, 0);
    }

    // Real, selectable text rather than an image of the page.
    // Whitespace collapsed: a name that wraps in a narrow rail comes back
    // from pdf.js as two runs with extra spacing between them.
    const squash = (value: string) => value.replace(/\s+/g, " ").trim();
    const all = squash(pages.map((sheet) => sheet.text).join(" "));
    expect(all).toContain(squash(data.basicInfo.name));
    for (const exp of data.sections.experience ?? []) expect(all).toContain(squash(exp.role));
    expect(all).toContain(data.basicInfo.email);
  });
}

test("the download reflects edits made just before clicking", async ({ page }) => {
  const data = makeLongResume("atlas");
  await seedBuilder(page, "atlas", data);
  await useNewEngine(page);
  const atlasPages = await previewPageCount(page);

  // Switch templates and download at once, before the preview catches up.
  // Oxford's relaxed spacing runs this resume longer than Atlas, so the page
  // count tells which template the saved file was rendered from.
  await page.getByRole("button", { name: "Use Oxford template" }).click();
  const saved = await pdfPageTexts(await downloadPdf(page));

  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, {
    timeout: 60_000,
  });
  const oxfordPages = await previewPageCount(page);
  expect(oxfordPages).not.toBe(atlasPages);
  expect(saved).toHaveLength(oxfordPages);
  expect(saved[0].text).toContain(data.basicInfo.name);
});

for (const templateId of ["atlas", "ember", "twin", "dossier"]) {
  test(`${templateId}: the live editing preview shows the downloaded PDF's pages`, async ({ page }) => {
    const data = makeLongResume(templateId);
    await page.addInitScript(
      ([json, tourKey]) => {
        window.localStorage.setItem("resumeData", json);
        window.localStorage.setItem(tourKey, "1");
      },
      [JSON.stringify(data), TOUR_DISMISSED_KEY] as const,
    );
    // The editing screen: form on the left, live preview beside it.
    await page.goto(`/builder?template=${templateId}`);
    const live = page.getByTestId("pdf-engine-preview");
    await expect(live.getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
    const livePages = await live.locator("[data-pdf-page]").count();
    expect(livePages).toBeGreaterThan(1);
    // No HTML sheets with their own page lines alongside it.
    await expect(page.locator("[data-page-sheet]")).toHaveCount(0);

    await page.getByRole("button", { name: "Preview & download" }).click();
    await useNewEngine(page);
    const pdf = await pdfPageTexts(await downloadPdf(page));
    expect(pdf).toHaveLength(livePages);
  });
}

test("switching templates shows the new template's skeleton until its PDF is drawn", async ({ page }) => {
  await seedBuilder(page, "atlas", makeLongResume("atlas"));
  await useNewEngine(page);
  const preview = page.getByTestId("pdf-engine-preview");

  await page.getByRole("button", { name: "Use Ember template" }).click();
  // Straight away: Ember's skeleton, not Atlas's pages under Ember's name.
  await expect(preview.locator('[data-pdf-skeleton="ember"]')).toBeVisible();
  await expect(preview.getByRole("status")).toHaveText("Loading Ember…");
  await expect(preview.locator("[data-pdf-page]").first()).toBeHidden();
  if (process.env.SKELETON_SHOT) await page.screenshot({ path: process.env.SKELETON_SHOT });

  // Then Ember's real pages replace it.
  await expect(preview.getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
  await expect(preview.locator("[data-pdf-skeleton]")).toHaveCount(0);
  await expect(preview.locator("[data-pdf-page]").first()).toBeVisible();
});

test("no template offers browser print — every download is the PDF itself", async ({ page }) => {
  for (const id of ["atlas", "ember", "twin", "dossier"]) {
    await seedBuilder(page, id, makeLongResume(id));
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.locator("#resume-print-root")).toHaveCount(0);
    await expect(page.getByText(/page breaks match the download exactly/)).toBeVisible();
  }
});

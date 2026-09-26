import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { PAGE_HEIGHT_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { makeLongResume } from "./fixtures/longResume";
import { readPdfPages } from "./helpers/pdfGaps";
import { seedBuilder } from "./helpers/printCuts";

/**
 * Sidebar templates preview and download through the PDF engine, so their
 * sheets are the PDF's pages. Each must be one A4 page, and every page after
 * the first must start its content at the 4% top inset — the regression this
 * guards against was a double-counted inset (PAGE_HEIGHT + PAGE_PAD).
 */
test("sidebar pages are one A4 tall with a single top inset (no double gap)", async ({ page }) => {
  await seedBuilder(page, "pacific", makeLongResume("pacific"));
  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, {
    timeout: 60_000,
  });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const sheets = await readPdfPages(new Uint8Array(await readFile((await download.path())!)));
  expect(sheets.length).toBeGreaterThan(2);

  for (const sheet of sheets) {
    // Chromium's pdf.js readout rounds to PDF points; allow a pixel.
    expect(Math.abs(sheet.widthPx - PAGE_WIDTH_PX)).toBeLessThanOrEqual(1);
    expect(Math.abs(sheet.heightPx - PAGE_HEIGHT_PX)).toBeLessThanOrEqual(1);
  }

  // Pages 2+: the first line sits just below the inset (its own half-leading
  // puts the glyph box a few px lower) — nowhere near a second inset's worth.
  for (const sheet of sheets.slice(1, -1)) {
    const firstLine = Math.min(...sheet.boxes.map((box) => box.top));
    expect(firstLine, `page ${sheet.number} starts too high`).toBeGreaterThanOrEqual(PAGE_PAD_Y_PX - 2);
    expect(firstLine, `page ${sheet.number} has a double top inset`).toBeLessThan(PAGE_PAD_Y_PX * 1.5);
  }
});

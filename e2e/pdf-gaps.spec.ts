import { readFile } from "node:fs/promises";
import { expect, test, type TestInfo } from "@playwright/test";
import { TEMPLATES, type TemplateTheme } from "@/components/templates/shared/theme";
import { PAGE_HEIGHT_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { TARGET_PAGES, makeLongResume } from "./fixtures/longResume";
import { describePx, gapBudget, MIN_PAGES } from "./helpers/gapBudget";
import { measureGaps, readPdfPages, type PageGaps, type Region } from "./helpers/pdfGaps";
import { seedBuilder } from "./helpers/printCuts";

/**
 * Every template, downloaded as a real ~10-page PDF from the PDF engine, then
 * read back sheet by sheet: any sheet that stops further above the bottom
 * than the layout can explain fails.
 *
 * A gap is "anticipated" when it is no taller than the tallest block the
 * engine is told not to split (see helpers/gapBudget.ts). Everything past
 * that is whitespace nothing asked for — the half-empty sheet a user sees in
 * the middle of their downloaded resume.
 */

/** Tallest block the engine keeps whole in the long fixture: an education
 * entry (institution, degree, three lines of coursework), or a section
 * heading held with the first ~40pt below it. Measured on the fixture;
 * generous rather than tight, since the budget also carries line slack. */
const TALLEST_UNSPLIT_PX = 150;

/** Space each layout holds back at the foot of every page on purpose. */
function reservedBottomPx(theme: TemplateTheme): number {
  return theme.layout === "asymmetric" ? 56 : PAGE_PAD_Y_PX;
}

/** Where the main column sits, for layouts whose other column can hide a
 * main column that stops halfway down the page. */
function mainColumn(theme: TemplateTheme): Region[] {
  if (theme.layout === "sidebar") {
    const rail = PAGE_WIDTH_PX * 0.34;
    return [
      theme.sidebarSide === "right"
        ? { name: "main column", left: 0, right: PAGE_WIDTH_PX - rail }
        : { name: "main column", left: rail, right: PAGE_WIDTH_PX },
    ];
  }
  if (theme.layout === "asymmetric") {
    const start = 32 + (PAGE_WIDTH_PX - 64) * 0.32;
    return [{ name: "main column", left: start, right: PAGE_WIDTH_PX }];
  }
  return [];
}

/** Sheets are compared against the budget except the last one, which is
 * short because the resume ended there. */
function interiorSheets(gaps: PageGaps[]): PageGaps[] {
  return gaps.slice(0, -1);
}

async function attachEvidence(testInfo: TestInfo, id: string, pdf: Uint8Array, report: unknown) {
  if (testInfo.errors.length === 0) return;
  await testInfo.attach(`${id}.pdf`, { body: Buffer.from(pdf), contentType: "application/pdf" });
  await testInfo.attach(`${id}-gaps.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
}

test.describe(`downloaded PDF gaps (~${TARGET_PAGES}-page resume)`, () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id} (${theme.layout})`, async ({ page }, testInfo) => {
      await seedBuilder(page, theme.id, makeLongResume(theme.id));
      await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, {
        timeout: 60_000,
      });
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Download PDF" }).click(),
      ]);
      const pdf = new Uint8Array(await readFile((await download.path())!));
      const sheets = await readPdfPages(pdf);

      expect(sheets.length, "downloaded no pages at all").toBeGreaterThan(0);
      expect(Math.abs(sheets[0]!.widthPx - PAGE_WIDTH_PX), "PDF page width should be A4").toBeLessThanOrEqual(1);
      expect(Math.abs(sheets[0]!.heightPx - PAGE_HEIGHT_PX), "PDF page height should be A4").toBeLessThanOrEqual(1);

      const budget = gapBudget(sheets[0].heightPx, TALLEST_UNSPLIT_PX, reservedBottomPx(theme));
      const gaps = measureGaps(sheets, mainColumn(theme));
      const interior = interiorSheets(gaps);

      // The fixture is sized for a long resume; a short PDF means the suite
      // stopped testing what it claims to.
      expect
        .soft(sheets.length, `fixture should run to at least ${MIN_PAGES} pages on every template`)
        .toBeGreaterThanOrEqual(MIN_PAGES);

      // A sheet with no text is a blank page in someone's download.
      expect
        .soft(
          gaps.filter((sheet) => !sheet.hasText).map((sheet) => sheet.number),
          "blank sheets in the PDF",
        )
        .toEqual([]);

      const tooShort = interior
        .filter((sheet) => sheet.bottomGapPx > budget.maxBottomGapPx)
        .map((sheet) => `page ${sheet.number}: ${describePx(sheet.bottomGapPx)} empty below the last line`);
      expect
        .soft(tooShort, `sheets ending early by more than the ${describePx(budget.maxBottomGapPx)} this layout can explain`)
        .toEqual([]);

      const columnTooShort = interior.flatMap((sheet) =>
        sheet.regions
          .filter((region) => region.hasText && region.bottomGapPx > budget.maxBottomGapPx)
          .map((region) => `page ${sheet.number} ${region.region}: ${describePx(region.bottomGapPx)} empty below the last line`),
      );
      expect
        .soft(columnTooShort, `main column ending early by more than ${describePx(budget.maxBottomGapPx)}`)
        .toEqual([]);

      // Page 1 starts below the template's own header; the sheets that begin
      // at an internal break should start near the top inset.
      const startsLate = interior
        .slice(1)
        .filter((sheet) => sheet.hasText && sheet.topGapPx > budget.maxTopGapPx)
        .map((sheet) => `page ${sheet.number}: ${describePx(sheet.topGapPx)} empty above the first line`);
      expect
        .soft(startsLate, `sheets starting more than ${describePx(budget.maxTopGapPx)} below the paper edge`)
        .toEqual([]);

      await attachEvidence(testInfo, theme.id, pdf, {
        template: theme.id,
        layout: theme.layout,
        pages: sheets.length,
        budget,
        sheets: gaps.map((sheet) => ({
          page: sheet.number,
          bottomGapPx: Math.round(sheet.bottomGapPx),
          topGapPx: Math.round(sheet.topGapPx),
          regions: sheet.regions.map((region) => ({
            region: region.region,
            bottomGapPx: region.hasText ? Math.round(region.bottomGapPx) : null,
          })),
        })),
      });
    });
  }
});

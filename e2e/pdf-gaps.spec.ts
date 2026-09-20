import { expect, test, type TestInfo } from "@playwright/test";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { TARGET_PAGES } from "./fixtures/longResume";
import { describePx, gapBudget, MIN_PAGES } from "./helpers/gapBudget";
import { measureGaps, readPdfPages, type PageGaps, type Region } from "./helpers/pdfGaps";
import { measurePrintLayout, openPrintableResume, printToPdf } from "./helpers/printResume";

/**
 * Every template, printed as a real ~10-page PDF through the same `@page`
 * rules the Download button uses, then read back sheet by sheet: any sheet
 * that stops further above the bottom than the layout can explain fails.
 *
 * A gap is "anticipated" when it is no taller than the tallest run of
 * content the print engine is not allowed to split (see helpers/gapBudget.ts).
 * Everything past that is whitespace nothing asked for — the half-empty
 * sheet a user sees in the middle of their downloaded resume.
 */

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

test.describe(`printed PDF gaps (~${TARGET_PAGES}-page resume)`, () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id} (${theme.layout})`, async ({ page }, testInfo) => {
      await openPrintableResume(page, theme.id);
      const layout = await measurePrintLayout(page);
      const pdf = await printToPdf(page);
      const sheets = await readPdfPages(pdf);

      expect(sheets.length, "printed no pages at all").toBeGreaterThan(0);
      const sheetHeight = sheets[0].heightPx;
      const budget = gapBudget(sheetHeight, layout.tallestAtomicPx);

      // Two-column templates hide gaps: the rail paints to the paper edge
      // and the main column can stop halfway up with the whole-sheet
      // measurement none the wiser. Measure that column on its own too.
      const main = layout.columns.find((column) => column.name === "main");
      const regions: Region[] = main
        ? [
            {
              name: "main column",
              left: main.leftFraction * layout.rootWidthPx,
              right: main.rightFraction * layout.rootWidthPx,
            },
          ]
        : [];
      const gaps = measureGaps(sheets, regions);
      const interior = interiorSheets(gaps);

      // The fixture is sized for a long resume; a short PDF means the suite
      // stopped testing what it claims to and the thresholds below are
      // measuring a one-page document.
      expect
        .soft(sheets.length, `fixture should print at least ${MIN_PAGES} pages on every template`)
        .toBeGreaterThanOrEqual(MIN_PAGES);

      // A sheet with no text is a blank page in someone's download.
      expect
        .soft(
          gaps.filter((sheet) => !sheet.hasText).map((sheet) => sheet.number),
          "blank sheets in the PDF",
        )
        .toEqual([]);

      // The budget below is derived from this number, so an absurd value
      // has to fail on its own or it would quietly license its own gap.
      expect
        .soft(
          layout.tallestAtomicPx,
          `tallest unbreakable block is ${describePx(layout.tallestAtomicPx)} — ${layout.tallestAtomicLabel}. ` +
            `Nothing that tall can be placed without stranding space; it needs to fragment.`,
        )
        .toBeLessThanOrEqual(budget.maxAtomicPx);

      const tooShort = interior
        .filter((sheet) => sheet.bottomGapPx > budget.maxBottomGapPx)
        .map((sheet) => `page ${sheet.number}: ${describePx(sheet.bottomGapPx)} empty below the last line`);
      expect
        .soft(
          tooShort,
          `sheets ending early by more than the ${describePx(budget.maxBottomGapPx)} this layout can explain ` +
            `(tallest unbreakable block: ${describePx(layout.tallestAtomicPx)} — ${layout.tallestAtomicLabel})`,
        )
        .toEqual([]);

      const columnTooShort = interior.flatMap((sheet) =>
        sheet.regions
          .filter((region) => region.hasText && region.bottomGapPx > budget.maxBottomGapPx)
          .map((region) => `page ${sheet.number} ${region.region}: ${describePx(region.bottomGapPx)} empty below the last line`),
      );
      expect
        .soft(columnTooShort, `main column ending early by more than ${describePx(budget.maxBottomGapPx)}`)
        .toEqual([]);

      // Page 1 starts below the template's own top padding; only the sheets
      // that begin at an internal break are expected to start at the edge.
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
        tallestAtomicPx: layout.tallestAtomicPx,
        tallestAtomicLabel: layout.tallestAtomicLabel,
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

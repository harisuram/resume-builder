import { expect, test } from "@playwright/test";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { makeLongResume } from "./fixtures/longResume";
import { measureGaps, readPdfPages } from "./helpers/pdfGaps";
import { parkForPrint, previewCuts, seedBuilder } from "./helpers/printCuts";

/**
 * The builder promises "the same look you'll get as a PDF". This holds it to
 * the coarsest version of that promise: a resume must never preview as one
 * number of sheets and download as another.
 *
 * The preview reads its cuts off a real column-fragmentation pass rather than
 * predicting them (lib/pagination/fragment.ts), so these are exact matches, not
 * approximations — which is why the tail sweep below can afford to step through
 * the boundary one line at a time.
 */

async function sheetCounts(page: import("@playwright/test").Page) {
  const preview = (await previewCuts(page)).length;
  await parkForPrint(page);
  const printed = (
    await readPdfPages(await page.pdf({ preferCSSPageSize: true, printBackground: true }))
  ).length;
  return { preview, printed };
}

test.describe("every template", () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id} (${theme.layout})`, async ({ page }) => {
      await seedBuilder(page, theme.id, makeLongResume(theme.id));
      const { preview, printed } = await sheetCounts(page);
      expect(preview, `${theme.id} preview sheets`).toBe(printed);
    });
  }
});

test.describe("across document lengths", () => {
  // One template per layout family.
  for (const id of ["jakes-resume", "bre-creative", "deedy-reversed", "dossier"]) {
    for (const roles of [2, 9, 16, 31]) {
      test(`${id} with ${roles} roles`, async ({ page }) => {
        const data = makeLongResume(id);
        data.sections.experience = data.sections.experience!.slice(0, roles);
        await seedBuilder(page, id, data);
        const { preview, printed } = await sheetCounts(page);
        expect(preview, `${id} with ${roles} roles`).toBe(printed);
      });
    }
  }
});

/* Sheet 1 printed with nothing but the candidate's name on the labeled CV: a
 * `break-inside: avoid` meant for section headings reached a grid row's label,
 * which froze the whole row and pushed it off the page. Any template that
 * strands most of its first sheet is showing the same class of bug. */
test.describe("sheet 1 carries content", () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id}`, async ({ page }) => {
      await seedBuilder(page, theme.id, makeLongResume(theme.id));
      await parkForPrint(page);
      const sheets = await readPdfPages(
        await page.pdf({ preferCSSPageSize: true, printBackground: true }),
      );
      const first = measureGaps(sheets)[0];
      expect(
        first.bottomGapPx,
        `${theme.id} leaves most of sheet 1 empty`,
      ).toBeLessThan(first.heightPx * 0.3);
    });
  }
});

/* A sheet that ends mid-line paints half a row of glyphs against its edge.
 * Block-flow templates read their slices off the fragmentation probe, which
 * hands back each sheet's own first and last line, so they cut cleanly.
 *
 * The table families are excluded: sidebar still uses the arithmetic model,
 * and two column fragments both cells at one page edge while their rows sit at
 * different heights, so one slice cannot end below the last line of both. Both
 * sliced before this work too. */
test.describe("no half-rendered line at a sheet edge", () => {
  for (const theme of TEMPLATES.filter((t) => t.layout === "single" || t.layout === "labeled")) {
    test(`${theme.name} — ${theme.id}`, async ({ page }) => {
      await seedBuilder(page, theme.id, makeLongResume(theme.id));
      const overflow = await page.evaluate(() => {
        let worst = 0;
        for (const sheet of Array.from(document.querySelectorAll("[data-page-sheet]"))) {
          const win = sheet.querySelector("[data-page-visual-stage]")?.parentElement;
          if (!win) continue;
          const box = win.getBoundingClientRect();
          const walk = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walk.nextNode())) {
            if (!(node.nodeValue ?? "").trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const rect of Array.from(range.getClientRects())) {
              if (rect.height <= 0) continue;
              const top = rect.top - box.top;
              const bottom = rect.bottom - box.top;
              if (top < box.height - 0.5 && bottom > box.height + 0.5) {
                worst = Math.max(worst, bottom - box.height);
              }
            }
          }
        }
        return worst;
      });
      expect(overflow, `${theme.id} paints a line through its sheet edge`).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("around a sheet boundary", () => {
  // Reported as: the last line sat on page 3 in the preview and page 4 in the
  // PDF. Stepping the closing section one item at a time walks the end of the
  // document across a sheet boundary, which is where the two used to part.
  for (const items of [0, 1, 2, 5, 9, 13, 17, 21]) {
    test(`closing section with ${items} items`, async ({ page }) => {
      const data = makeLongResume("jakes-resume");
      data.sections.experience = data.sections.experience!.slice(0, 9);
      const pool = data.sections.softSkills!;
      data.sections.softSkills = Array.from({ length: items }, (_, i) => pool[i % pool.length]);
      await seedBuilder(page, "jakes-resume", data);
      const { preview, printed } = await sheetCounts(page);
      expect(preview, `closing section with ${items} items`).toBe(printed);
    });
  }
});

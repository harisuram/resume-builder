import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import type { ResumeData } from "@/lib/types";
import { nearBottomResume } from "./fixtures/nearBottomResume";
import { readPdfPages, type PdfPage } from "./helpers/pdfGaps";

/**
 * A user's Ledger download ended on a blank page. Their last section stopped
 * just above the bottom margin, and padding that trailed the body didn't fit,
 * so the engine started a new page for the padding alone.
 *
 * The sample resumes never land there by chance — the band is only a few
 * lines tall — so each case here aims for it: measure where the last page
 * ends and how far one extra line moves it, add exactly enough one-line
 * achievements to put the end in the band, then require every page to carry
 * text.
 */

/** Where the last page's content should end: just above the bottom inset. */
const TARGET_END_PX = 1050;

/** The reported template. Every template is covered structurally by
 * components/pdf/ResumePdfDocument.test.tsx ("no trailing space after the
 * last section"); not every template can be steered into the band this way —
 * one whose last section is kept whole jumps straight to a new page. */
const CASES = ["ledger"];

function withExtraLines(templateId: string, lines: number): ResumeData {
  const data = nearBottomResume(templateId);
  data.sections.keyAchievements = [
    ...(data.sections.keyAchievements ?? []),
    ...Array.from({ length: lines }, (_, i) => `Short win ${i + 1}`),
  ];
  return data;
}

/** Loads `data` into the builder in `page` and returns its downloaded PDF. */
async function download(page: Page, data: ResumeData): Promise<PdfPage[]> {
  await page.evaluate(
    ([json, tourKey]) => {
      window.localStorage.setItem("resumeData", json);
      window.localStorage.setItem(tourKey, "1");
    },
    [JSON.stringify(data), TOUR_DISMISSED_KEY] as const,
  );
  await page.goto(`/builder?template=${encodeURIComponent(data.templateId)}`);
  await page.getByRole("button", { name: "Preview & download" }).click();
  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, {
    timeout: 60_000,
  });
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  return readPdfPages(new Uint8Array(await readFile((await file.path())!)));
}

/** Bottom of the last line of text in the document (on its last inked page). */
function contentEnd(sheets: PdfPage[]): { page: number; px: number } {
  const last = [...sheets].reverse().find((sheet) => sheet.boxes.length > 0)!;
  return { page: last.number, px: Math.max(...last.boxes.map((box) => box.bottom)) };
}

function blankPages(sheets: PdfPage[]): number[] {
  return sheets.filter((sheet) => sheet.boxes.length === 0).map((sheet) => sheet.number);
}

for (const id of CASES) {
  test(`${id}: no blank last page when the content ends just above the bottom margin`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/");
    // Grow the resume a line at a time (three while still far off) until the
    // last page's content ends in the band, checking for blank pages at
    // every size on the way.
    let lines = 0;
    let landed: string | null = null;
    while (lines <= 40 && !landed) {
      const sheets = await download(page, withExtraLines(id, lines));
      const end = contentEnd(sheets);
      expect(blankPages(sheets), `blank pages with ${lines} extra lines (content ends at ${Math.round(end.px)}px)`).toEqual([]);
      if (end.px >= TARGET_END_PX - 30 && end.px <= TARGET_END_PX + 20) landed = `${lines} extra lines → ends at ${Math.round(end.px)}px`;
      lines += end.px < TARGET_END_PX - 150 ? 3 : 1;
    }
    // Only meaningful if some size really ended in the band — otherwise this
    // test silently stopped testing anything.
    expect(landed, `never managed to end the content near ${TARGET_END_PX}px`).not.toBeNull();
    test.info().annotations.push({ type: "landed", description: landed! });
  });
}

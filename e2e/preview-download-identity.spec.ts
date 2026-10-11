import { expect, test } from "@playwright/test";
import { TEMPLATES } from "@/components/templates/shared/theme";
import type { ResumeData } from "@/lib/types";
import { makeLongResume } from "./fixtures/longResume";
import { downloadedPdf, fingerprint, firstDifference, openBuilder, previewPdf } from "./helpers/pdfIdentity";

/**
 * Stricter than content-parity (same lines per page): for every template, at
 * a short, a medium and a long length, the PDF the preview draws and the PDF
 * the Download button saves must be the same drawing — same pages and page
 * sizes, every text run at the same position, and the same sequence of
 * drawing operations (fills, rules, rails, images). A block moved a few
 * points, a page break taken one line later, or a colour band that differs
 * all fail here even when the text lines happen to match.
 */

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

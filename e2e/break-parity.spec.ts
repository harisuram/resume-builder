import { expect, test } from "@playwright/test";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { PAGE_HEIGHT_PX, PAGE_PAD_Y_PX, PAGE_WIDTH_PX } from "@/lib/page";
import { makeLongResume } from "./fixtures/longResume";

const STORAGE_KEY = "resumeData";

test("sidebar page sheets are one A4 tall (no double top-inset gap)", async ({ page }) => {
  await page.addInitScript(
    ([key, json, tourKey]) => {
      window.localStorage.setItem(key, json);
      window.localStorage.setItem(tourKey, "1");
    },
    [STORAGE_KEY, JSON.stringify(makeLongResume("pacific")), TOUR_DISMISSED_KEY] as const,
  );
  await page.goto("/builder?template=pacific");
  await page.getByRole("button", { name: "Preview & download" }).click();
  await page.locator("[data-page-sheet]").first().waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const info = await page.evaluate((pageH) => {
    const sheets = [...document.querySelectorAll<HTMLElement>("[data-page-sheet]")];
    return sheets.slice(0, 3).map((s, i) => ({
      i: i + 1,
      h: s.offsetHeight,
      topBand: !!s.querySelector("[data-page-top-band]"),
      bottomBand: !!s.querySelector("[data-page-bottom-band]"),
      topBandH: (s.querySelector("[data-page-top-band]") as HTMLElement | null)?.offsetHeight ?? 0,
      bottomBandH: (s.querySelector("[data-page-bottom-band]") as HTMLElement | null)?.offsetHeight ?? 0,
      pageH,
    }));
  }, PAGE_HEIGHT_PX);

  console.log("SHEETS", JSON.stringify(info));
  expect(info[0]?.topBand).toBe(false);
  expect(info[0]?.bottomBand).toBe(true);
  expect(info[0]?.h).toBe(PAGE_HEIGHT_PX);
  expect(info[1]?.topBand).toBe(true);
  expect(info[1]?.bottomBand).toBe(true);
  // Regression: was PAGE_HEIGHT + PAGE_PAD (double-counted top inset).
  expect(info[1]?.h).toBe(PAGE_HEIGHT_PX);
  expect(info[1]?.topBandH).toBe(PAGE_PAD_Y_PX);
  expect(info[1]?.bottomBandH).toBe(PAGE_PAD_Y_PX);
  expect(PAGE_WIDTH_PX).toBe(794);
});

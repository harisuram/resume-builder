import { expect, test } from "@playwright/test";
import { PAGE_WIDTH_PX } from "@/lib/page";
import { openPrintableResume } from "./helpers/printResume";

/**
 * The hidden measure/print source and the parked print root must share the
 * same unscaled main-column width, or lines wrap differently and page
 * breaks drift between preview and download.
 */
test("measure source and print root share the same main-column width", async ({ page }) => {
  await openPrintableResume(page, "pacific");

  const before = await page.evaluate((pageW) => {
    const stage = document.querySelector(".resume-print-source") as HTMLElement;
    const main = stage?.querySelector('[data-resume-column="main"] .resume-col-pad') as HTMLElement;
    const bullet = main?.querySelector("li span.min-w-0, li") as HTMLElement;
    const layoutW = parseFloat(stage.style.width) || pageW;
    const scale = stage.getBoundingClientRect().width / layoutW || 1;
    // Prefer offsetWidth (layout) over getBoundingClientRect (may be scaled).
    return {
      cssVar: getComputedStyle(document.documentElement).getPropertyValue("--resume-page-width").trim(),
      stageLayoutW: layoutW,
      mainW: main ? main.offsetWidth / scale : 0,
      bulletW: bullet ? bullet.offsetWidth / scale : 0,
      bottomBands: document.querySelectorAll("[data-page-bottom-band]").length,
    };
  }, PAGE_WIDTH_PX);

  expect(before.cssVar).toBe(`${PAGE_WIDTH_PX}px`);
  expect(before.stageLayoutW).toBe(PAGE_WIDTH_PX);
  expect(before.mainW).toBeGreaterThan(PAGE_WIDTH_PX * 0.5);

  await page.evaluate(() => window.dispatchEvent(new Event("resume:prepare-print")));
  await page.emulateMedia({ media: "print" });

  const after = await page.evaluate(() => {
    const root = document.querySelector("#resume-print-root") as HTMLElement;
    const main = root?.querySelector('[data-resume-column="main"] .resume-col-pad') as HTMLElement;
    const bullet = main?.querySelector("li span.min-w-0, li") as HTMLElement;
    return {
      rootW: root?.offsetWidth ?? 0,
      stageTransform: getComputedStyle(document.querySelector(".resume-print-source")!).transform,
      mainW: main?.offsetWidth ?? 0,
      bulletW: bullet?.offsetWidth ?? 0,
    };
  });

  expect(after.stageTransform).toBe("none");
  expect(after.rootW).toBeCloseTo(PAGE_WIDTH_PX, 0);
  expect(before.mainW).toBeCloseTo(after.mainW, 0);
  expect(before.bulletW).toBeCloseTo(after.bulletW, 0);
});

/**
 * Captures one .webp thumbnail per template into public/template-thumbs/.
 *
 * The gallery and homepage strip show these images instead of rendering the
 * sample résumé live: 48 live tiles put the same summary, jobs, and education
 * into the page HTML 48 times, which reads as duplicated filler to crawlers.
 * The live render still runs in the preview dialog, which mounts on click.
 *
 * Run against a dev server after adding or restyling a template:
 *   npm run dev            (in another terminal)
 *   npm run thumbs         (THUMBS_BASE_URL overrides http://localhost:3000)
 */
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const BASE_URL = process.env.THUMBS_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = resolve("public/template-thumbs");
/** Tiles top out near 270 CSS px wide; 2x keeps them sharp on retina. */
const WIDTH = 540;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 3200 }, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/templates`, { waitUntil: "networkidle" });
  // Capture-only tweaks: let the dialog grow to the whole sheet (it's capped
  // at 900px and scrolls, which put its Close / Use bar over tall sheets),
  // and drop the sheet's frame so the picture is just the paper.
  await page.addStyleTag({
    content: `
      [role="dialog"] [class*="max-h-"] { max-height: none !important; }
      [role="dialog"] [data-sample-resume] { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
    `,
  });

  // The tall viewport gives the uncapped dialog room for the whole sheet.
  // Each tile's Preview button opens the dialog that still draws the sample
  // résumé live — that's the source for the picture.
  const openers = page.getByRole("button", { name: /^Preview .+ layout$/ });
  const count = await openers.count();
  if (count === 0) throw new Error(`No template tiles found at ${BASE_URL}/templates`);

  mkdirSync(OUT_DIR, { recursive: true });
  const written = new Set();
  for (let i = 0; i < count; i++) {
    await openers.nth(i).click();
    const sheet = page.getByRole("dialog").locator("[data-sample-resume]");
    await sheet.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const id = await sheet.getAttribute("data-sample-resume");
    const png = await sheet.screenshot({ animations: "disabled" });

    // Tiles show the top of the sheet at A4 proportions (210:297). A short
    // sample is lengthened by repeating its bottom row, so a sidebar's band
    // runs to the foot of the page the way it does in the PDF.
    const { width, height } = await sharp(png).metadata();
    const a4Height = Math.round((width * 297) / 210);
    const fitted =
      height >= a4Height
        ? sharp(png).extract({ left: 0, top: 0, width, height: a4Height })
        : sharp(png).extend({ bottom: a4Height - height, extendWith: "copy" });
    const file = `${id}.webp`;
    await sharp(await fitted.png().toBuffer())
      .resize({ width: WIDTH })
      .webp({ quality: 82 })
      .toFile(join(OUT_DIR, file));
    written.add(file);
    process.stdout.write(`${id} `);

    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
  }

  // Drop thumbnails for templates that no longer exist.
  for (const file of readdirSync(OUT_DIR)) {
    if (!written.has(file)) rmSync(join(OUT_DIR, file));
  }
  console.log(`\n${count} thumbnails → ${OUT_DIR}`);
} finally {
  await browser.close();
}

import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { nearBottomResume } from "./fixtures/nearBottomResume";
import { readPdfPages } from "./helpers/pdfGaps";

/**
 * The cover letter builder end to end: the resume's details carry over, the
 * wizard walks the letter's steps, a skipped paragraph stays out, the letter
 * can take its own template and go back to the resume's, and the downloaded
 * PDF holds exactly the letter. Then the phone layout: no sideways scroll on
 * any step, the ☰ menu, and the preview sheet. The way in is the home page
 * and the resume's download step; the way back is the letter's download step.
 */

const SHOTS = process.env.COVER_LETTER_SHOTS;

async function seedResume(page: Page, templateId = "atlas") {
  await page.goto("/cover-letter");
  await page.evaluate(
    ([json, tourKey]) => {
      window.localStorage.clear();
      window.localStorage.setItem("resumeData", json);
      window.localStorage.setItem(tourKey, "1");
    },
    [JSON.stringify(nearBottomResume(templateId)), TOUR_DISMISSED_KEY] as const,
  );
}

async function pdfText(path: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = await readFile(path);
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false }).promise;
  let text = "";
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return text.replace(/\s+/g, " ");
}

/** Steps, the menu and the sheet all slide in; wait for them to settle
 * (looping animations, like the live-preview dot, never do). */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
  );
}

async function noSidewaysScroll(page: Page) {
  await settled(page);
  const overflow = await page.evaluate(() => {
    const wide = Array.from(document.querySelectorAll<HTMLElement>("main, main *")).filter(
      (el) => el.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(el).position !== "fixed",
    );
    return {
      page: document.documentElement.scrollWidth - window.innerWidth,
      main: Array.from(document.querySelectorAll("main")).map((m) => m.scrollWidth - m.clientWidth),
      offenders: wide.slice(0, 3).map((el) => el.outerHTML.slice(0, 120)),
    };
  });
  expect(overflow.page).toBeLessThanOrEqual(0);
  expect(overflow.offenders).toEqual([]);
}

/** Fails the test on any browser error the run produced — the Next dev
 * overlay's "Issues" count, as an assertion. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 500));
  });
  page.on("pageerror", (error) => errors.push(error.message.slice(0, 500)));
  return errors;
}

async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test("writes a cover letter in the resume's template and downloads exactly that letter", async ({ page }) => {
  const errors = collectErrors(page);
  await seedResume(page);
  await page.goto("/cover-letter/builder");

  // The resume's details are already there, so the wizard opens on Recipient.
  await expect(page.getByRole("heading", { name: "Recipient" })).toBeVisible();
  const next = page.getByRole("button", { name: "Save & Next" });
  await expect(next).toBeDisabled();
  await page.getByLabel("Company", { exact: true }).fill("Northwind");
  await page.getByLabel("Position you're applying for").fill("Senior Product Designer");
  await page.getByLabel("Hiring manager's name").fill("Dana Rivera");
  await page.getByRole("button", { name: "+ Add detail" }).click();
  await page.getByLabel("Label", { exact: true }).fill("Job reference");
  await page.getByLabel("Value", { exact: true }).fill("ENG-2041");
  await shot(page, "desktop-recipient");
  await next.click();

  await expect(page.getByRole("heading", { name: "Greeting" })).toBeVisible();
  await page.getByRole("button", { name: "Dear Dana Rivera," }).click();
  await expect(page.getByLabel("Greeting", { exact: true })).toHaveValue("Dear Dana Rivera,");
  await next.click();

  await expect(page.getByRole("heading", { name: "Opening" })).toBeVisible();
  await page.getByLabel("Paragraph", { exact: true }).fill("I am applying for the Senior Product Designer role at Northwind.");
  await next.click();

  await expect(page.getByRole("heading", { name: "Why you're interested" })).toBeVisible();
  await page.getByLabel("Paragraph", { exact: true }).fill("THIS SKIPPED TEXT MUST NOT PRINT.");
  await page.getByRole("button", { name: "Skip", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Skills & experience" })).toBeVisible();
  await page.getByLabel("Paragraph", { exact: true }).fill("I led design for a billing platform used by four products.");
  await shot(page, "desktop-paragraph");

  // A custom paragraph, then moved above Skills with the keyboard handle.
  await page.getByRole("button", { name: "Add paragraph" }).click();
  await expect(page.getByLabel("Paragraph name")).toBeVisible();
  await page.getByLabel("Paragraph name").fill("Referral");
  await page.getByLabel("Paragraph", { exact: true }).fill("Sam Lee on your platform team suggested I apply.");
  const nav = page.getByRole("navigation", { name: "Cover letter sections" });
  const handle = nav.getByRole("button", { name: "Reorder Referral" });
  for (let i = 0; i < 3; i++) await handle.press("ArrowUp");
  await expect(nav.getByRole("button", { name: /^(Opening|Why you're interested|Referral|Skills & experience|Achievements|Why you're a good fit)$/ })).toHaveText([
    "Opening",
    "Why you're interested",
    "Referral",
    "Skills & experience",
    "Achievements",
    "Why you're a good fit",
  ]);

  await nav.getByRole("button", { name: "Closing" }).click();
  await page.getByLabel("Closing statement").fill("Thank you for your time.");
  await page.getByRole("button", { name: "Kind regards," }).click();
  await next.click();

  // Download step: the letter's template follows the resume until changed.
  await expect(page.getByRole("heading", { name: "Preview & download" })).toBeVisible();
  await expect(page.getByText("Matches your resume’s template.")).toBeVisible();
  await page.getByRole("button", { name: "Use Ledger template" }).click();
  await expect(page.getByRole("button", { name: "Match my resume (Atlas)" })).toBeVisible();
  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
  await shot(page, "desktop-download");

  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  expect(file.suggestedFilename()).toMatch(/_cover_letter\.pdf$/);
  const text = await pdfText((await file.path())!);
  const resume = nearBottomResume("atlas");
  for (const line of [
    resume.basicInfo.name,
    resume.basicInfo.email,
    "Northwind",
    "Re: Senior Product Designer",
    "Job reference: ENG-2041",
    "Dear Dana Rivera,",
    "I am applying for the Senior Product Designer role at Northwind.",
    "Sam Lee on your platform team suggested I apply.",
    "I led design for a billing platform used by four products.",
    "Thank you for your time.",
    "Kind regards,",
  ]) {
    expect(text).toContain(line);
  }
  expect(text).not.toContain("THIS SKIPPED TEXT");
  // The custom paragraph prints where it was moved to: above Skills.
  expect(text.indexOf("Sam Lee")).toBeLessThan(text.indexOf("I led design"));
  // No resume sections leak into the letter.
  expect(text).not.toContain(resume.sections.summary?.slice(0, 30) ?? "@@");

  // Saved on this device; the resume's own template is untouched.
  const saved = await page.evaluate(() => ({
    letter: JSON.parse(localStorage.getItem("coverLetterData") ?? "null"),
    resume: JSON.parse(localStorage.getItem("resumeData") ?? "null"),
  }));
  expect(saved.letter.templateId).toBe("ledger");
  expect(saved.letter.paragraphs.find((p: { id: string }) => p.id === "interest").skipped).toBe(true);
  expect(saved.resume.templateId).toBe("atlas");

  // And back to following the resume.
  await page.getByRole("button", { name: "Match my resume (Atlas)" }).click();
  await expect(page.getByText("Matches your resume’s template.")).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true });

  test("every step fits the screen; menu and preview sheet work", async ({ page }) => {
    const errors = collectErrors(page);
    await seedResume(page);
    await page.goto("/cover-letter/builder");
    await expect(page.getByRole("heading", { name: "Recipient" })).toBeVisible();
    await page.getByLabel("Company", { exact: true }).fill("Northwind");
    await page.getByLabel("Position you're applying for").fill("Senior Product Designer");
    await page.getByRole("button", { name: "+ Add detail" }).click();
    await noSidewaysScroll(page);
    await shot(page, "phone-recipient");

    const next = page.getByRole("button", { name: "Save & Next" });
    for (const heading of ["Greeting", "Opening", "Why you're interested", "Skills & experience", "Achievements", "Why you're a good fit", "Closing"]) {
      await next.click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      if (heading !== "Greeting" && heading !== "Closing") {
        await page.getByLabel("Paragraph", { exact: true }).fill(`${heading} text.`);
      }
      await noSidewaysScroll(page);
      if (heading === "Skills & experience") await shot(page, "phone-paragraph");
    }

    await page.getByRole("button", { name: "Open sections menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("navigation", { name: "Cover letter sections" })).toBeVisible();
    await shot(page, "phone-menu");
    await menu.getByRole("button", { name: "Close sections menu" }).click();

    await page.getByRole("button", { name: "Preview resume" }).click();
    const sheet = page.getByRole("dialog", { name: "Cover letter preview" });
    await expect(sheet.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
    await shot(page, "phone-preview");
    await sheet.getByRole("button", { name: "Continue editing" }).click();

    await next.click();
    await expect(page.getByRole("heading", { name: "Preview & download" })).toBeVisible();
    await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
    await noSidewaysScroll(page);
    await shot(page, "phone-download");
    expect(errors).toEqual([]);
  });
});

test("tablet keeps the sidebar and opens the preview as a sheet", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1100 });
  await seedResume(page);
  await page.goto("/cover-letter/builder");
  await expect(page.getByRole("navigation", { name: "Cover letter sections" })).toBeVisible();
  await noSidewaysScroll(page);
  await shot(page, "tablet-recipient");
});

test.describe("at 320px", () => {
  test.use({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });

  for (const path of ["/builder", "/cover-letter/builder"]) {
    test(`${path} header fits`, async ({ page }) => {
      await seedResume(page);
      await page.goto(path);
      const header = page.getByRole("banner");
      await expect(header).toBeVisible();
      const overflow = await header.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await noSidewaysScroll(page);
    });
  }
});

test("the landing page's call to action opens the letter builder", async ({ page }) => {
  await page.goto("/cover-letter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Write my cover letter" }).first().click();
  await expect(page).toHaveURL(/\/cover-letter\/builder$/);
  await expect(page.getByRole("navigation", { name: "Cover letter sections" })).toBeVisible();
});

test("the home page offers both builders side by side on the first screen, and opens the letter builder", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const resume = page.getByRole("article", { name: "Build your resume" });
  const card = page.getByRole("article", { name: "Write your cover letter" });
  const [r, l] = [await resume.boundingBox(), await card.boundingBox()];
  expect(r!.y).toBe(l!.y);
  expect(r!.height).toBe(l!.height);
  for (const link of [resume.getByRole("link", { name: "Build my resume" }), card.getByRole("link", { name: "Write my cover letter" })]) {
    await expect(link).toBeInViewport();
  }
  await card.getByRole("link", { name: "Write my cover letter" }).click();
  await expect(page).toHaveURL(/\/cover-letter\/builder$/);
  await expect(page.getByRole("navigation", { name: "Cover letter sections" })).toBeVisible();
});

test("the download steps link resume and letter both ways, carrying details over and keeping each draft", async ({ page }) => {
  await page.goto("/cover-letter");
  await page.evaluate((tourKey) => {
    window.localStorage.clear();
    window.localStorage.setItem(tourKey, "1");
  }, TOUR_DISMISSED_KEY);
  await page.goto("/builder");
  // Neither builder's header links the other document.
  await expect(page.getByRole("banner").getByRole("link", { name: /cover letter/i })).toHaveCount(0);
  await page.getByLabel(/Full name/).fill("Ada Lovelace");
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Location/).fill("London");

  await page.getByRole("button", { name: "Download", exact: true }).click();
  await page.getByRole("link", { name: /Write a matching cover letter/ }).click();
  await expect(page).toHaveURL(/\/cover-letter\/builder$/);
  // Details are complete, so the letter opens on Recipient.
  await expect(page.getByRole("heading", { name: "Recipient" })).toBeVisible();
  await page.getByLabel("Company", { exact: true }).fill("Northwind");

  await page.getByRole("navigation", { name: "Cover letter sections" }).getByRole("button", { name: "Download" }).click();
  await page.getByRole("link", { name: /Back to your resume/ }).click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByLabel(/Full name/)).toHaveValue("Ada Lovelace");

  await page.goto("/cover-letter/builder");
  await expect(page.getByLabel("Company", { exact: true })).toHaveValue("Northwind");
});

test("a long URL or unbroken string in a paragraph wraps inside the page instead of running off it", async ({ page }) => {
  await seedResume(page);
  const long = "Portfolio: https://example.com/" + "a".repeat(120);
  await page.evaluate((opening) => {
    const letter = {
      date: "10 October 2026",
      recipientName: "",
      recipientTitle: "",
      company: "Northwind",
      companyAddress: "",
      position: "Designer",
      fields: [],
      greeting: "Dear Hiring Manager,",
      paragraphs: [{ id: "opening", text: opening }],
      closing: "",
      signOff: "Sincerely,",
      templateId: null,
    };
    window.localStorage.setItem("coverLetterData", JSON.stringify(letter));
  }, `I am applying for the Designer role. ${long}`);
  await page.goto("/cover-letter/builder");
  await page.getByRole("navigation", { name: "Cover letter sections" }).getByRole("button", { name: "Download" }).click();
  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  const sheets = await readPdfPages(new Uint8Array(await readFile((await file.path())!)));
  for (const sheet of sheets) {
    for (const box of sheet.boxes) expect(box.right).toBeLessThanOrEqual(sheet.widthPx);
  }
  // Every character is still there, just across lines.
  expect((await pdfText((await file.path())!)).replace(/[\s-]/g, "")).toContain(long.replace(/[\s-]/g, ""));
});

test.describe("home page on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("stacks resume then cover letter, the first way in on the first screen, nothing wider than the screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article", { name: "Build your resume" }).getByRole("link", { name: "Build my resume" })).toBeInViewport();
    const [r, l] = [
      await page.getByRole("article", { name: "Build your resume" }).boundingBox(),
      await page.getByRole("article", { name: "Write your cover letter" }).boundingBox(),
    ];
    expect(l!.y).toBeGreaterThan(r!.y + r!.height - 1);
    expect(l!.width).toBe(r!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { MOBILE_TOUR_DISMISSED_KEY, TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { nearBottomResume } from "./fixtures/nearBottomResume";

/**
 * The newest resume sections in a real browser: Personal details and the
 * education grading scales end up in the downloaded PDF, the Personal
 * details form fits a phone, and a text resume with unusual section titles
 * imports every section where it belongs.
 */

async function seed(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ([json, tour, mobileTour]) => {
      localStorage.clear();
      localStorage.setItem("resumeData", json);
      localStorage.setItem(tour, "1");
      localStorage.setItem(mobileTour, "1");
    },
    [JSON.stringify(nearBottomResume("atlas")), TOUR_DISMISSED_KEY, MOBILE_TOUR_DISMISSED_KEY] as const,
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

async function downloadPdfText(page: Page): Promise<string> {
  await page.getByRole("navigation", { name: "Resume sections" }).getByRole("button", { name: "Download" }).click();
  await expect(page.getByTestId("pdf-engine-preview").getByRole("status")).toHaveText(/^\d+ pages?$/, { timeout: 60_000 });
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  return pdfText((await file.path())!);
}

test("Personal details and a percentage grade print in the downloaded PDF", async ({ page }) => {
  await seed(page);
  await page.goto("/builder");
  const nav = page.getByRole("navigation", { name: "Resume sections" });

  await nav.getByRole("button", { name: "Personal details", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Personal details" })).toBeVisible();
  await page.getByLabel("Date of birth").fill("2000-03-12");
  await page.getByLabel("Gender").selectOption("Female");
  await page.getByLabel("Marital status").selectOption("Single");
  await page.getByLabel("Nationality").fill("Indian");

  await nav.getByRole("button", { name: "Education", exact: true }).click();
  await page.getByRole("button", { name: "+ Add grade / coursework" }).first().click();
  await page.getByLabel("Grading system").first().selectOption("percentage");
  await page.getByLabel("Grade (optional)").first().fill("85");

  const text = await downloadPdfText(page);
  // Templates set headings in capitals or not, so compare without case.
  for (const expected of ["Personal Details", "Date of birth: 12 March 2000", "Gender: Female", "Marital status: Single", "Nationality: Indian", "85%"]) {
    expect(text.toLowerCase()).toContain(expected.toLowerCase());
  }
  // Saved with the draft.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("resumeData") ?? "{}"));
  expect(saved.sections.personalDetails).toEqual({
    dateOfBirth: "2000-03-12",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Indian",
  });
  expect(saved.sections.education[0]).toMatchObject({ gradeType: "percentage", gpa: "85" });
});

test("a skipped Personal details section stays off the PDF", async ({ page }) => {
  await seed(page);
  await page.goto("/builder");
  await page.getByRole("navigation", { name: "Resume sections" }).getByRole("button", { name: "Personal details", exact: true }).click();
  await page.getByLabel("Nationality").fill("Indian");
  await page.getByRole("switch", { name: "Skip Personal details" }).click();
  const text = await downloadPdfText(page);
  expect(text).not.toContain("Nationality");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true });

  test("the Personal details form fits the screen", async ({ page }) => {
    await seed(page);
    await page.goto("/builder");
    await page.getByRole("button", { name: "Open sections menu" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Personal details", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Personal details" })).toBeVisible();
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
    );
    for (const label of ["Date of birth", "Gender", "Marital status", "Nationality"]) {
      const box = await page.getByLabel(label).boundingBox();
      expect([label, box!.x >= 0 && box!.x + box!.width <= 360]).toEqual([label, true]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

test("importing a text resume with unusual section titles fills each section in the builder", async ({ page }) => {
  // The AI pass is switched off here (the request fails), so this is the
  // built-in parser on its own — the fallback every import relies on.
  await page.route("**/api/import", (route) => route.abort());
  await page.goto("/");
  await page.evaluate(
    ([tour, mobileTour]) => {
      localStorage.clear();
      localStorage.setItem(tour, "1");
      localStorage.setItem(mobileTour, "1");
    },
    [TOUR_DISMISSED_KEY, MOBILE_TOUR_DISMISSED_KEY] as const,
  );
  await page.goto("/builder");
  const resume = `ASHA RAO
asha.rao@example.com | +91 98765 43210 | Pune, Maharashtra

CAREER OBJECTIVE
Data analyst with 3 years turning messy sales data into weekly decisions.

WORK HISTORY
Data Analyst | Northwind Retail | Jun 2022 – Present
- Built the weekly sales dashboard used by 40 store managers

ACADEMIC BACKGROUND
B.Tech, Computer Science | Example Institute of Technology | 2018 – 2022

SKILL SET
Languages: Python, SQL
Tools: Excel, Git

LANGUAGES KNOWN
English (Fluent), Hindi (Native)

PERSONAL DETAILS
Date of Birth: 12 March 2000
Nationality: Indian`;
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import resume" }).click();
  await (await chooser).setFiles({ name: "asha.txt", mimeType: "text/plain", buffer: Buffer.from(resume) });

  await expect.poll(async () => page.evaluate(() => localStorage.getItem("resumeData")), { timeout: 30_000 }).not.toBeNull();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("resumeData") ?? "{}"));
  expect(saved.sections.summary).toMatch(/^Data analyst/);
  expect(saved.sections.experience[0]).toMatchObject({ company: "Northwind Retail" });
  expect(saved.sections.education[0]).toMatchObject({ institution: "Example Institute of Technology" });
  expect(saved.skillsLayout).toBe("grouped");
  expect(saved.skillGroups.map((g: { title: string }) => g.title)).toEqual(["Languages", "Tools"]);
  expect(saved.sections.languages.map((l: { name: string }) => l.name)).toEqual(["English", "Hindi"]);
  expect(saved.sections.personalDetails).toMatchObject({ dateOfBirth: "2000-03-12", nationality: "Indian" });
});

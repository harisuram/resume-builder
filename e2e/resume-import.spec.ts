import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import type { ResumeData } from "@/lib/types";
import { DUMMY_RESUMES, dummyResumeDocx, dummyResumeHtml, type DummyResume } from "./fixtures/dummyResumes";

/**
 * Imports realistic PDF and Word resumes through the builder's Import button
 * and checks every field lands in the right section — with headings worded
 * the way real resumes word them ("Career Objective", "Work History",
 * "Languages Known"). Runs each file twice: with the AI parser, and with it
 * unavailable so only the built-in heading matcher runs.
 */

async function buildFile(page: Page, resume: DummyResume, dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${resume.id}.${resume.format}`);
  if (resume.format === "docx") {
    await writeFile(file, dummyResumeDocx(resume));
  } else {
    const printer = await page.context().newPage();
    await printer.setContent(dummyResumeHtml(resume));
    await writeFile(file, await printer.pdf({ format: "A4", preferCSSPageSize: true }));
    await printer.close();
  }
  return file;
}

async function importThroughButton(page: Page, file: string): Promise<ResumeData> {
  await page.addInitScript((tourKey) => window.localStorage.setItem(tourKey, "1"), TOUR_DISMISSED_KEY);
  await page.goto("/builder");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import resume" }).click();
  await (await chooser).setFiles(file);
  // The import saves the draft once it has filled the builder.
  const handle = await page.waitForFunction(() => window.localStorage.getItem("resumeData"), undefined, { timeout: 90_000 });
  return JSON.parse((await handle.jsonValue()) as string) as ResumeData;
}

const squash = (value: unknown) => JSON.stringify(value ?? "").toLowerCase().replace(/\\u2013|\\u2014/g, "-");

/** Every expectation the import missed, as readable lines. */
function missing(resume: DummyResume, data: ResumeData): string[] {
  const out: string[] = [];
  const info = data.basicInfo;
  const want = resume.expect.basicInfo;
  if (info.name.trim() !== want.name) out.push(`basicInfo.name: got "${info.name}"`);
  if (info.email !== want.email) out.push(`basicInfo.email: got "${info.email}"`);
  if (!info.phone.replace(/\D/g, "").endsWith(want.phone)) out.push(`basicInfo.phone: got "${info.phone}"`);
  if (!info.location.toLowerCase().includes(want.location.toLowerCase())) out.push(`basicInfo.location: got "${info.location}"`);
  for (const link of ["linkedin", "github", "portfolio"] as const) {
    const expected = want[link];
    if (expected && !(info.links[link] ?? "").includes(expected)) out.push(`links.${link}: got "${info.links[link] ?? ""}"`);
  }
  for (const [key, needles] of Object.entries(resume.expect.sections)) {
    const got = squash(data.sections[key as keyof ResumeData["sections"]]);
    for (const needle of needles ?? []) {
      if (!got.includes(needle.toLowerCase())) out.push(`${key}: missing "${needle}"`);
    }
  }
  return out;
}

for (const mode of ["with AI", "without AI"] as const) {
  test.describe(`resume import ${mode}`, () => {
    for (const resume of DUMMY_RESUMES) {
      test(`${resume.id} (${resume.format}${resume.twoColumn ? ", two-column" : ""})`, async ({ page }, testInfo) => {
        test.setTimeout(150_000);
        if (mode === "without AI") {
          await page.route("**/api/import", (route) =>
            route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "off", code: "unavailable" }) }),
          );
        }
        const file = await buildFile(page, resume, testInfo.outputDir);
        // Record whether the AI pass actually answered (it's optional: the
        // built-in matcher alone must still pass these checks).
        const aiStatus = page.waitForResponse("**/api/import", { timeout: 90_000 }).then(async (r) => (r.ok() ? String(r.status()) : `${r.status()} ${await r.text()}`)).catch(() => null);
        const data = await importThroughButton(page, file);
        testInfo.annotations.push({ type: "ai /api/import", description: String(await aiStatus) });
        console.log(`[${mode}] ${resume.id}: /api/import → ${await aiStatus}`);
        await testInfo.attach("imported.json", { body: JSON.stringify(data, null, 2), contentType: "application/json" });
        const gaps = missing(resume, data);
        if (gaps.length) console.log(`[${mode}] ${resume.id} missed:\n  ${gaps.join("\n  ")}`);
        expect(gaps, `${resume.id} ${mode}`).toEqual([]);
      });
    }
  });
}

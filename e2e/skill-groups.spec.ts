import { expect, test, type Page } from "@playwright/test";
import { TEMPLATES } from "@/components/templates/shared/theme";
import { MOBILE_TOUR_DISMISSED_KEY, TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import type { ResumeData, SkillGroup } from "@/lib/types";
import { makeLongResume } from "./fixtures/longResume";
import { downloadedPdf, fingerprint, firstDifference, openBuilder, previewPdf } from "./helpers/pdfIdentity";

/**
 * Grouped skills, end to end. For every template the live preview, the
 * export preview and the downloaded file must be the same drawing (same
 * pages, same text positions), and no group may be split across two pages.
 * Then the Skills form itself is driven at phone, tablet and desktop widths.
 */

/** Titles and skills chosen to appear nowhere else in the fixture, so a run
 * of text on a page can be traced back to exactly one group. */
const GROUPS: SkillGroup[] = [
  { title: "Frontend stack", skills: ["TypeScript", "GraphQL", "Bazel"] },
  { title: "Backend stack", skills: ["Rust", "Java", "gRPC", "Kafka", "Redis"] },
  { title: "Data platform", skills: ["PostgreSQL", "ClickHouse", "Spark", "Airflow"] },
  { title: "Cloud and infra", skills: ["Kubernetes", "Terraform", "AWS", "GCP", "Envoy", "Vault"] },
  { title: "Observability", skills: ["Datadog", "OpenTelemetry"] },
];

function groupedResume(id: string, roles: number): ResumeData {
  const data = makeLongResume(id);
  if (Number.isFinite(roles)) {
    data.sections.experience = data.sections.experience!.slice(0, roles);
    data.sections.projects = data.sections.projects?.slice(0, roles);
  }
  data.skillsLayout = "grouped";
  data.skillGroups = GROUPS;
  data.sections.skills = GROUPS.flatMap((group) => group.skills);
  return data;
}

/** The page each group's title is on and the page its last skill is on. */
function groupPages(pages: { runs: string[] }[]): { title: string; first: number; last: number }[] {
  const text = pages.map((page) => page.runs.map((run) => run.slice(run.indexOf(" ") + 1)).join(" "));
  return GROUPS.map((group) => {
    const first = text.findIndex((page) => page.includes(`${group.title}:`));
    const lastSkill = group.skills[group.skills.length - 1];
    // The last skill on or after the title's page — the same word could only
    // appear earlier if the fixture changed, and that would fail loudly here.
    const last = text.findIndex((page, i) => i >= first && page.includes(lastSkill));
    return { title: group.title, first, last };
  });
}

const LENGTHS: { label: string; roles: number }[] = [
  { label: "short", roles: 1 },
  { label: "long", roles: Infinity },
];

test.describe("grouped skills: preview and download are the same drawing", () => {
  for (const theme of TEMPLATES) {
    test(`${theme.name} — ${theme.id} (${theme.layout})`, async ({ page }) => {
      test.setTimeout(300_000);
      for (const { label, roles } of LENGTHS) {
        await page.goto("about:blank");
        await openBuilder(page, groupedResume(theme.id, roles));

        const live = await previewPdf(page);
        await page.getByRole("button", { name: "Download", exact: true }).click();
        const exported = await previewPdf(page);
        const saved = await downloadedPdf(page);

        const [liveFp, exportFp, savedFp] = await Promise.all([
          fingerprint(live.bytes),
          fingerprint(exported.bytes),
          fingerprint(saved),
        ]);
        expect(live.shown, `${label}: live preview sheets`).toBe(liveFp.length);
        expect(firstDifference(liveFp, savedFp), `${label}: live preview vs download`).toBeNull();
        expect(firstDifference(exportFp, savedFp), `${label}: export preview vs download`).toBeNull();

        for (const group of groupPages(savedFp)) {
          expect(group.first, `${label}: "${group.title}" is printed`).toBeGreaterThanOrEqual(0);
          expect(group.last, `${label}: "${group.title}" is split across pages`).toBe(group.first);
        }
      }
    });
  }
});

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

async function openSkillsStep(page: Page, phone: boolean) {
  await page.addInitScript((keys) => {
    for (const key of keys) window.localStorage.setItem(key, "1");
  }, [TOUR_DISMISSED_KEY, MOBILE_TOUR_DISMISSED_KEY]);
  await page.goto("/builder");
  if (phone) await page.getByRole("button", { name: "Open sections menu" }).click();
  await page.getByRole("button", { name: /^Skills\b/ }).first().click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
}

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}

for (const viewport of VIEWPORTS) {
  test(`skills form works on ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const phone = viewport.width < 768;
    await openSkillsStep(page, phone);

    await page.getByRole("radio", { name: "Grouped" }).click();
    await expect(page.getByRole("radio", { name: "Grouped" })).toHaveAttribute("aria-checked", "true");

    const titles = page.getByLabel("Group title");
    await titles.first().fill("Frontend");
    const skillInputs = page.getByRole("combobox");
    await skillInputs.first().fill("A very long skill name that should wrap rather than overflow");
    await skillInputs.first().press("Enter");
    await skillInputs.first().fill("React");
    await skillInputs.first().press("Enter");
    // Close the suggestions, as a user would, before reaching past them.
    await skillInputs.first().press("Escape");

    await page.getByRole("button", { name: "+ Add group" }).click();
    await expect(titles.nth(1)).toBeVisible();
    await titles.nth(1).fill("Backend with a fairly long group title for narrow screens");
    await skillInputs.last().fill("Node");
    await skillInputs.last().press("Enter");
    await skillInputs.last().press("Escape");

    if (phone) {
      // One open at a time: the first group folded to its summary row.
      await expect(page.getByRole("button", { name: /^Frontend 2 skills/ })).toHaveAttribute("aria-expanded", "false");
      await expect(titles.first()).toBeHidden();
    } else {
      // Tablet and desktop keep every group open.
      await expect(titles.first()).toBeVisible();
    }

    await expectNoSidewaysScroll(page);
    const add = await page.getByRole("button", { name: "+ Add group" }).boundingBox();
    expect(add!.height, "tap target height").toBeGreaterThanOrEqual(phone ? 44 : 28);

    // Back to the simple list: every skill is still there.
    await page.getByRole("radio", { name: "Simple list" }).click();
    for (const skill of ["React", "Node"]) {
      await expect(page.getByRole("button", { name: `Remove ${skill}`, exact: true })).toBeVisible();
    }
    await expectNoSidewaysScroll(page);
  });
}

/** One group line is 12px at 1.625 line height; groups sit 6px apart. In
 * PDF points (0.75pt per px) that puts consecutive one-line groups this far
 * apart, baseline to baseline. */
const GROUP_PITCH_PT = (12 * 1.625 + 6) * 0.75;

for (const id of ["atlas", "sterling", "kernel"]) {
  test(`${id}: skill groups are one line plus a 6px gap apart in the downloaded PDF`, async ({ page }) => {
    await openBuilder(page, groupedResume(id, 1));
    await previewPdf(page);
    await page.getByRole("button", { name: "Download", exact: true }).click();
    const pages = await fingerprint(await downloadedPdf(page));

    // Baseline Y of each group's title run, on the page it's printed on.
    const titles = GROUPS.map((group) => {
      for (const [p, sheet] of pages.entries()) {
        const run = sheet.runs.find((r) => r.slice(r.indexOf(" ") + 1).startsWith(`${group.title}:`));
        if (run) return { page: p, y: Number(run.slice(run.indexOf(",") + 1, run.indexOf(" "))) };
      }
      throw new Error(`"${group.title}" not printed`);
    });
    let compared = 0;
    for (let i = 1; i < titles.length; i++) {
      if (titles[i].page !== titles[i - 1].page) continue;
      // PDF Y grows upwards, so the next group's baseline is lower.
      expect(titles[i - 1].y - titles[i].y, `gap above "${GROUPS[i].title}"`).toBeCloseTo(GROUP_PITCH_PT, 0);
      compared++;
    }
    expect(compared, "groups compared on one page").toBeGreaterThan(0);
  });
}

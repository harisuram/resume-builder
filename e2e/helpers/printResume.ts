import type { Page } from "@playwright/test";
import { TOUR_DISMISSED_KEY } from "@/lib/builderTour";
import { makeLongResume } from "../fixtures/longResume";

/** Same key lib/storage.ts writes the draft under. Seeding it is how a test
 * gets a full resume into the builder without driving 14 forms. */
const STORAGE_KEY = "resumeData";

export interface ColumnRange {
  name: "rail" | "main";
  /** Fraction of the print root's width, left and right edge. */
  leftFraction: number;
  rightFraction: number;
}

export interface PrintLayout {
  /** Print root width in CSS px — 760, pinned by the print stylesheet. The
   * sheet is wider (A4 is ~793px at 96dpi) and `@page { margin: 0 }` leaves
   * the root flush against its left edge, so a column's x on the sheet is
   * its fraction of *this* width, not of the sheet's. */
  rootWidthPx: number;
  /** Tallest run of content the print engine is not allowed to split —
   * a `.break-inside-avoid` entry, or a heading glued to the block after
   * it. The largest legitimate bottom gap is one of these being pushed. */
  tallestAtomicPx: number;
  /** What that tallest block is, for the failure message. */
  tallestAtomicLabel: string;
  columns: ColumnRange[];
}

/**
 * Loads the builder with the long fixture on `templateId`, walks to the
 * export step, and leaves the page parked exactly as the Download button
 * leaves it right before `window.print()`.
 */
export async function openPrintableResume(page: Page, templateId: string): Promise<void> {
  await page.addInitScript(
    ([key, json, tourKey]) => {
      window.localStorage.setItem(key, json);
      // A seeded draft already suppresses the first-run tour; setting this
      // too keeps the suite off that code path entirely, so a change to what
      // counts as a first-run visitor can't start covering the nav.
      window.localStorage.setItem(tourKey, "1");
    },
    [STORAGE_KEY, JSON.stringify(makeLongResume(templateId)), TOUR_DISMISSED_KEY] as const,
  );

  await page.goto(`/builder?template=${encodeURIComponent(templateId)}`);
  await page.getByRole("button", { name: "Preview & download" }).click();
  await page.locator("#resume-print-root").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);

  // The Download button fires this before window.print() so the print
  // viewport is parked and re-measured before Chromium snapshots the page.
  // page.pdf() takes that snapshot without a click, so the test has to fire
  // the same event or it prints a layout the real export never produces.
  await page.evaluate(() => window.dispatchEvent(new Event("resume:prepare-print")));
  await page.emulateMedia({ media: "print" });
  // Two frames: one for the parked re-measure, one for the resulting layout.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/** Reads the print DOM for the numbers the gap thresholds are derived from. */
export async function measurePrintLayout(page: Page): Promise<PrintLayout> {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("#resume-print-root");
    if (!root) throw new Error("no #resume-print-root — the export step never rendered");
    const rootRect = root.getBoundingClientRect();

    const isAtomic = (el: Element) =>
      el.classList.contains("break-inside-avoid") &&
      !el.parentElement?.closest(".break-inside-avoid");

    let tallestAtomicPx = 0;
    let tallestAtomicLabel = "(none)";
    const note = (el: Element, height: number, kind: string) => {
      if (height <= tallestAtomicPx) return;
      tallestAtomicPx = height;
      const section = el.closest("[data-section-key]")?.getAttribute("data-section-key") ?? "?";
      tallestAtomicLabel = `${kind} in "${section}": ${(el.textContent ?? "").trim().slice(0, 60)}`;
    };

    for (const el of Array.from(root.querySelectorAll("*"))) {
      if (isAtomic(el)) note(el, el.getBoundingClientRect().height, "unbreakable block");
    }

    // `break-after-avoid` glues a heading to whatever follows it, so the two
    // together are one unbreakable run even though neither carries
    // break-inside-avoid on its own. Only the *first* unbreakable unit after
    // the heading is glued to it — the rest of the section fragments
    // normally. Experience/project cards are fragmentable, so skip them and
    // look for a real `.break-inside-avoid` (education, cert, …); otherwise
    // measuring the whole list would report a multi-page section as one
    // atomic block and license (or fail on) absurd bottom gaps.
    const glued = root.querySelectorAll(".break-after-avoid, [data-section-key] > h3");
    for (const heading of Array.from(glued)) {
      const next = heading.nextElementSibling;
      if (!next) continue;
      const first = next.classList.contains("break-inside-avoid")
        ? next
        : next.querySelector(".break-inside-avoid");
      if (!first) continue;
      const a = heading.getBoundingClientRect();
      const b = first.getBoundingClientRect();
      note(heading, Math.max(a.height, b.bottom - a.top), "heading + first entry");
    }

    const columns = Array.from(root.querySelectorAll<HTMLElement>("[data-resume-column]"))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          name: el.getAttribute("data-resume-column") as "rail" | "main",
          leftFraction: (rect.left - rootRect.left) / rootRect.width,
          rightFraction: (rect.right - rootRect.left) / rootRect.width,
        };
      })
      .filter((c) => c.name === "rail" || c.name === "main");

    return {
      rootWidthPx: rootRect.width,
      tallestAtomicPx,
      tallestAtomicLabel,
      columns,
    };
  });
}

/** Prints the parked page through the real `@page` rules (A4, zero margin). */
export async function printToPdf(page: Page): Promise<Uint8Array> {
  return page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
}

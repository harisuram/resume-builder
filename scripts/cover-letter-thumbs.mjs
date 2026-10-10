/**
 * Captures a cover letter thumbnail per showcased template into
 * public/cover-letter-thumbs/, for the homepage's resume + cover letter pairs.
 *
 * Each picture is the letter builder's own preview — the PDF the download
 * saves, drawn by pdf.js — for the same sample person (name and portrait) the
 * template's resume thumbnail shows, so the two read as a matching set.
 *
 * Run against a dev server after restyling a showcased template:
 *   npm run dev                (in another terminal)
 *   npm run thumbs:letters     (THUMBS_BASE_URL overrides http://localhost:3000)
 */
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const BASE_URL = process.env.THUMBS_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = resolve("public/cover-letter-thumbs");
/** Same size as public/template-thumbs (TemplateThumb's TEMPLATE_THUMB_*). */
const WIDTH = 540;

/** Keep in sync with SHOWCASE_TEMPLATE_IDS in components/site/MatchingSet.tsx. */
const SHOWCASE = ["atlas", "ember", "fern", "marquee", "vellum"];

/** lib/sampleResume.ts's SAMPLE_PORTRAITS — a template's sample person is the
 * portrait at its index in TEMPLATES, modulo this list. */
const PORTRAITS = [
  { src: "/samples/portraits/woman-1.webp", name: "Alexandra Montgomery-Whitfield" },
  { src: "/samples/portraits/man-1.webp", name: "Alexander Montgomery-Whitfield" },
  { src: "/samples/portraits/woman-2.webp", name: "Alexandra Montgomery-Whitfield" },
  { src: "/samples/portraits/man-2.webp", name: "Alexander Montgomery-Whitfield" },
  { src: "/samples/portraits/woman-3.webp", name: "Alexandra Montgomery-Whitfield" },
];

/** The sample resume's contact details (lib/sampleResume.ts). */
const BASIC_INFO = {
  email: "alexandra@example.com",
  phone: "5550100199",
  phoneCountryCode: "+1",
  location: "San Francisco, CA",
  links: {
    linkedin: "linkedin.com/in/alexandra-mw-sample",
    github: "github.com/alexandra-mw-sample",
    portfolio: "alexandra.example.com",
  },
};

const LETTER = {
  date: "10 October 2026",
  recipientName: "Jordan Lee",
  recipientTitle: "Director of Engineering",
  company: "Northwind Labs",
  companyAddress: "500 Market Street\nSan Francisco, CA 94105",
  position: "Principal Backend Engineer",
  fields: [],
  greeting: "Dear Jordan Lee,",
  paragraphs: [
    {
      id: "opening",
      text: "I'm writing to apply for the Principal Backend Engineer role at Northwind Labs. For nine years I've built the kind of resilient, high-throughput infrastructure your platform runs on, and I'd love to bring that experience to your team.",
    },
    {
      id: "interest",
      text: "Northwind's move to real-time pricing is the problem I enjoy most: systems that have to stay fast and correct while traffic and data keep growing.",
    },
    {
      id: "skills",
      text: "At Nimbus Systems I lead the streaming platform behind every customer-facing service, owning its Kafka pipelines, capacity planning and on-call practice across four teams.",
    },
    {
      id: "achievements",
      text: "Last year I redesigned our event ingestion path, cutting p99 latency by 38% and saving $1.2M a year in compute.",
    },
    { id: "fit", text: "", skipped: true },
  ],
  closing: "Thank you for your time. I'd be glad to talk about how I could help your team.",
  signOff: "Kind regards,",
  templateId: null,
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 2 });

  // Template order decides each template's sample portrait; the gallery
  // lists every template in that order.
  await page.goto(`${BASE_URL}/templates`, { waitUntil: "networkidle" });
  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .map((img) => decodeURIComponent(img.getAttribute("src") ?? "").match(/\/template-thumbs\/([a-z0-9-]+)\.webp/)?.[1])
      .filter((id, i, all) => id && all.indexOf(id) === i),
  );
  if (order.length === 0) throw new Error(`No template thumbnails found at ${BASE_URL}/templates`);

  mkdirSync(OUT_DIR, { recursive: true });
  const written = new Set();
  for (const id of SHOWCASE) {
    const index = order.indexOf(id);
    if (index === -1) throw new Error(`Template "${id}" isn't in the gallery`);
    const portrait = PORTRAITS[index % PORTRAITS.length];
    const resume = {
      basicInfo: { ...BASIC_INFO, name: portrait.name },
      photo: portrait.src,
      sections: {},
      sectionStatus: {},
      templateId: id,
    };
    await page.evaluate(
      ([resumeJson, letterJson]) => {
        localStorage.clear();
        localStorage.setItem("resumeData", resumeJson);
        localStorage.setItem("coverLetterData", letterJson);
      },
      [JSON.stringify(resume), JSON.stringify(LETTER)],
    );
    await page.goto(`${BASE_URL}/cover-letter/builder`, { waitUntil: "networkidle" });
    await page.getByRole("navigation", { name: "Cover letter sections" }).getByRole("button", { name: "Download" }).click();
    const preview = page.getByTestId("pdf-engine-preview");
    await preview.getByRole("status").filter({ hasText: /^\d+ pages?$/ }).waitFor({ timeout: 60_000 });
    const sheet = preview.locator("canvas").first();
    await sheet.waitFor();
    await page.waitForTimeout(300);
    const png = await sheet.screenshot({ animations: "disabled" });

    // A4 proportions, like the resume thumbnails.
    const { width, height } = await sharp(png).metadata();
    const a4Height = Math.round((width * 297) / 210);
    const fitted = sharp(png).extract({ left: 0, top: 0, width, height: Math.min(height, a4Height) });
    const file = `${id}.webp`;
    await sharp(await fitted.png().toBuffer())
      .resize({ width: WIDTH })
      .webp({ quality: 82 })
      .toFile(join(OUT_DIR, file));
    written.add(file);
    process.stdout.write(`${id} `);
  }

  for (const file of readdirSync(OUT_DIR)) {
    if (!written.has(file)) rmSync(join(OUT_DIR, file));
  }
  console.log(`\n${written.size} cover letter thumbnails → ${OUT_DIR}`);
} finally {
  await browser.close();
}

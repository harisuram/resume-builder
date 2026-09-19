import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

/** `output: "export"` cannot emit POST `/api/*` routes. Those files are
 * only for `next dev`. Stash them for the production static build; Cloudflare
 * serves the same paths from workers/index.ts (or functions/api/*.ts
 * on a Pages project). */
const apiDir = resolve("app/api");
const stashDir = resolve(".next-export-stash/api");
const nextDir = resolve(".next");
const outDir = resolve("out");

/** `next dev` writes `.next/dev/types/validator.ts` that imports every route,
 * including POST /api/optimize. After we stash that folder for the static
 * export, a leftover validator fails typecheck and aborts `next build`. */
function clearStaleNextCache() {
  if (existsSync(nextDir)) rmSync(nextDir, { recursive: true, force: true });
}

function stashApiRoute() {
  if (!existsSync(apiDir)) return false;
  mkdirSync(resolve(".next-export-stash"), { recursive: true });
  if (existsSync(stashDir)) rmSync(stashDir, { recursive: true, force: true });
  renameSync(apiDir, stashDir);
  return true;
}

function restoreApiRoute(stashed) {
  if (!stashed) return;
  if (existsSync(apiDir)) rmSync(apiDir, { recursive: true, force: true });
  mkdirSync(resolve("app"), { recursive: true });
  renameSync(stashDir, apiDir);
}

/**
 * Next static export emits `opengraph-image` with no extension, and meta tags
 * like `/opengraph-image?hash`. WhatsApp, iMessage, and some other scrapers
 * skip previews when the image URL has no `.png`/`.jpg` suffix — even when
 * Content-Type is correct. Copy to `/og.png` and rewrite the HTML.
 */
function publishOgPng() {
  const generated = join(outDir, "opengraph-image");
  if (!existsSync(generated)) {
    console.warn("publishOgPng: out/opengraph-image missing — skip");
    return;
  }
  copyFileSync(generated, join(outDir, "og.png"));

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith(".html") && !entry.name.endsWith(".txt")) continue;
      const before = readFileSync(path, "utf8");
      const after = before
        .replace(/\/opengraph-image\?[^"'\\\s]+/g, "/og.png")
        .replace(/\/opengraph-image(?=["'\\?\s])/g, "/og.png");
      if (after !== before) writeFileSync(path, after);
    }
  }
  walk(outDir);
}

clearStaleNextCache();
const stashed = stashApiRoute();
try {
  const result = spawnSync("npx", ["next", "build"], { stdio: "inherit" });
  restoreApiRoute(stashed);
  if (result.status === 0) publishOgPng();
  process.exit(result.status === null ? 1 : result.status);
} catch (error) {
  restoreApiRoute(stashed);
  throw error;
}

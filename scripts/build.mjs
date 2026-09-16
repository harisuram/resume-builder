import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

/** `output: "export"` cannot emit a POST /api/optimize route. That file is
 * only for `next dev`. Stash it for the production static build; Cloudflare
 * serves the same path from workers/index.ts (or functions/api/optimize.ts
 * on a Pages project). */
const apiDir = resolve("app/api");
const stashDir = resolve(".next-export-stash/api");

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

const stashed = stashApiRoute();
try {
  const result = spawnSync("npx", ["next", "build"], { stdio: "inherit" });
  restoreApiRoute(stashed);
  process.exit(result.status === null ? 1 : result.status);
} catch (error) {
  restoreApiRoute(stashed);
  throw error;
}

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

/** `output: "export"` cannot emit POST `/api/*` routes. Those files are
 * only for `next dev`. Stash them for the production static build; Cloudflare
 * serves the same paths from workers/index.ts (or functions/api/*.ts
 * on a Pages project). */
const apiDir = resolve("app/api");
const stashDir = resolve(".next-export-stash/api");
const nextDir = resolve(".next");

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

clearStaleNextCache();
const stashed = stashApiRoute();
try {
  const result = spawnSync("npx", ["next", "build"], { stdio: "inherit" });
  restoreApiRoute(stashed);
  process.exit(result.status === null ? 1 : result.status);
} catch (error) {
  restoreApiRoute(stashed);
  throw error;
}

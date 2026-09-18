import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const toDir = resolve(root, "public");
const to = resolve(toDir, "pdf.worker.min.mjs");

if (!existsSync(from)) {
  console.warn("pdfjs-dist worker not found; skip copy.");
  process.exit(0);
}
mkdirSync(toDir, { recursive: true });
copyFileSync(from, to);

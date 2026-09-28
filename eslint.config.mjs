import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated output (all gitignored): build stashes, deploy dry-runs,
    // test reports, coverage, and the copied pdf.js worker.
    ".next-export-stash/**",
    ".wrangler/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    "e2e/.artifacts/**",
    ".tmp-pdf-preview/**",
    "public/pdf.worker.min.mjs",
  ]),
  {
    // A leading underscore marks a parameter kept for its signature only
    // (e.g. a no-op that older callers still pass arguments to).
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // CommonJS by necessity — next/jest's config factory is consumed here,
    // and Jest doesn't load a TS config without an extra ts-node dependency.
    files: ["jest.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;

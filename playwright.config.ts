import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite. Everything here drives a real Chromium and prints a real
 * PDF through the same `@page`/print stylesheet the Download button uses —
 * jsdom can't paginate, so page-break behavior has no other way to be tested.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.artifacts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  // Each case renders a ~10-page resume and prints it; the default 30s is
  // not enough for that on a cold dev-server compile.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // page.pdf() is Chromium-only, so the gap suite has a single project.
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});

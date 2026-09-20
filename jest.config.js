const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // e2e/ is Playwright: real Chromium, real printed PDFs. Its *.spec.ts
  // files match Jest's default testMatch, so they have to be excluded here
  // or `npm test` tries to run them in jsdom.
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/out/", "<rootDir>/node_modules/", "<rootDir>/e2e/"],
  collectCoverageFrom: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "!**/*.d.ts"],
};

module.exports = createJestConfig(config);

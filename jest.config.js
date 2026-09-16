const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/out/", "<rootDir>/node_modules/"],
  collectCoverageFrom: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "!**/*.d.ts"],
};

module.exports = createJestConfig(config);

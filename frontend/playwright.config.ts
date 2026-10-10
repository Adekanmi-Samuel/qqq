import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    locale: "en-NG",
    timezoneId: "Africa/Lagos",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: "Desktop Chrome", use: { browserName: "chromium" } },
  ],
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  // do not parallelise tests; we are using a file-backed InMemoryStore
  // as data store which is not safe to use from multiple processes concurrently
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  // ensure we are running all tests serially to prevent concurrency issues with
  // the file-backed InMemoryStore
  workers: 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: "html",

  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    baseURL: "http://127.0.0.1:3000",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  testMatch: /.*.e2e\.ts/,

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      env: {
        DB_FILE: "data.e2e.json",
      },
      command:
        "cd ../../examples/fullstack-e2e-encrypted-locker-nextjs && pnpm dev",
      url: "http://127.0.0.1:3000",
      // reuseExistingServer: !process.env.CI,
      reuseExistingServer: false,
      stdout: "pipe",
    },
  ],
});

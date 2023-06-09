import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: "html",

  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
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
      command: "cd ../../examples/server-simple && pnpm dev --no-fs",
      url: "http://127.0.0.1:8089/private",
      // reuseExistingServer: !process.env.CI,
      reuseExistingServer: false,
      env: {
        TEST_RESET_CODE: "1234567890",
      },
    },
    {
      command: "cd ../../examples/client-simple-webpack && pnpm dev",
      url: "http://127.0.0.1:8080",
      // reuseExistingServer: !process.env.CI,
      reuseExistingServer: false,
    },
  ],
});

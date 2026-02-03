import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for staging environment tests
 * Run with: npx playwright test --config=config/playwright.staging.config.ts
 */
require('dotenv').config();

export default defineConfig({
  testDir: '../e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests — staging Cloud Run may return transient 503s */
  retries: process.env.CI ? 2 : 1,
  /* Cap workers at 2 — staging Cloud Run (single instance) saturates above this */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use */
  reporter: 'html',
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for staging - direct Cloud Run URL */
    /* Note: The app has basePath=/gear-staging, so pages are at /gear-staging/ */
    /* But Playwright's baseURL path joining doesn't work well with paths, so we use the root URL */
    /* and prefix API paths with /gear-staging in tests */
    baseURL: process.env.STAGING_URL || 'https://p2p-gear-rental-staging-737733013547.europe-west2.run.app',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Increase timeouts for staging (may have cold starts) */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* Global timeout for each test */
  timeout: 60000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* No webServer config - staging is always running */
});

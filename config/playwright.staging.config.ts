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
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: 'html',
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for staging - via load balancer */
    baseURL: process.env.STAGING_URL || 'https://smeyatsky.com/gear-staging',

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

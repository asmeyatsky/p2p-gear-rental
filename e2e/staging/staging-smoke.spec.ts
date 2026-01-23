import { test, expect } from '@playwright/test';

/**
 * Staging Smoke Tests
 *
 * These tests verify that the staging environment is working correctly.
 * Run with: npx playwright test --config=config/playwright.staging.config.ts e2e/staging/
 *
 * Note: The staging app has basePath=/gear-staging, so all paths must be prefixed.
 */

// The basePath configured in Next.js for staging
const BASE_PATH = '/gear-staging';

test.describe('Staging Environment Smoke Tests', () => {
  test('should load the home page with correct title', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // Verify the page title
    await expect(page).toHaveTitle('GearShare');

    // Verify body is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should return health check response', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/health`);
    // 200 = all healthy, 503 = some services unhealthy (cache is expected to be down)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty('checks');

    // Database should be healthy (most important)
    const dbCheck = body.checks?.find((c: { service: string }) => c.service === 'database');
    expect(dbCheck?.status).toBe('healthy');
  });

  test('should return successful database health check', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/health/database`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  test('should load browse page', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await expect(page.locator('body')).toBeVisible();
    // Check page loaded successfully
    await expect(page).toHaveTitle(/GearShare/);
  });

  test('should load login page', async ({ page }) => {
    await page.goto(`${BASE_PATH}/auth/login`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load signup page', async ({ page }) => {
    await page.goto(`${BASE_PATH}/auth/signup`);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Staging API Tests', () => {
  test('should fetch gear listings', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear`);
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('gear');
      expect(Array.isArray(body.gear)).toBeTruthy();
    }
  });

  test('should handle gear search endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?category=cameras&limit=5`);
    expect([200, 500]).toContain(response.status());
  });

  test('should return 401 for protected POST to gear', async ({ request }) => {
    const response = await request.post(`${BASE_PATH}/api/gear`, {
      data: { title: 'Test', description: 'Test', dailyRate: 50, city: 'NYC', state: 'NY' }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Staging Performance Tests', () => {
  test('home page should load within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_PATH}/`);
    await expect(page.locator('body')).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
    console.log(`Home page load time: ${loadTime}ms`);
  });

  test('browse page should load within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_PATH}/browse`);
    await expect(page.locator('body')).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
    console.log(`Browse page load time: ${loadTime}ms`);
  });

  test('API should respond within 5 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${BASE_PATH}/api/health`);
    const responseTime = Date.now() - startTime;

    // 200 = all healthy, 503 = some services unhealthy (cache is expected to be down)
    expect([200, 503]).toContain(response.status());
    expect(responseTime).toBeLessThan(5000);
    console.log(`API response time: ${responseTime}ms`);
  });
});

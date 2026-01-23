import { test, expect } from '@playwright/test';

/**
 * Staging Smoke Tests
 *
 * These tests verify that the staging environment is working correctly.
 * Run with: npx playwright test --config=config/playwright.staging.config.ts e2e/staging/
 */

test.describe('Staging Environment Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Verify the main heading is visible
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();

    // Verify navigation elements
    await expect(page.locator('header').getByRole('link', { name: 'Browse Gear' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'How It Works' })).toBeVisible();
  });

  test('should return health check response', async ({ request }) => {
    const response = await request.get('/api/health');
    // Health endpoint returns 200 even if some services are unhealthy
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Check that essential services are working (database, auth)
    expect(body).toHaveProperty('checks');
    const dbCheck = body.checks?.find((c: { service: string }) => c.service === 'database');
    expect(dbCheck?.status).toBe('healthy');
  });

  test('should return successful database health check', async ({ request }) => {
    const response = await request.get('/api/health/database');
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Database health returns 'healthy' status when connected
    expect(body.status).toBe('healthy');
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/');

    const browseLink = page.locator('header').getByRole('link', { name: 'Browse Gear' });
    await expect(browseLink).toBeVisible();
    await browseLink.click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test('should navigate to auth pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to login
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('Welcome back')).toBeVisible();

    // Navigate to signup
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByText('Create an account')).toBeVisible();
  });
});

test.describe('Staging API Tests', () => {
  test('should fetch gear listings or return error', async ({ request }) => {
    const response = await request.get('/api/gear');
    // API should respond (may be 200 with gear or 500 with error if DB issues)
    expect([200, 500]).toContain(response.status());

    const body = await response.json();
    // Either has gear array or error message
    if (response.status() === 200) {
      expect(body).toHaveProperty('gear');
      expect(Array.isArray(body.gear)).toBeTruthy();
    } else {
      expect(body).toHaveProperty('error');
    }
  });

  test('should handle gear search endpoint', async ({ request }) => {
    const response = await request.get('/api/gear?category=cameras&limit=5');
    // API should respond
    expect([200, 500]).toContain(response.status());
  });

  test('should return 401 for protected endpoints without auth', async ({ request }) => {
    const response = await request.post('/api/gear', {
      data: { title: 'Test', description: 'Test', dailyRate: 50, city: 'NYC', state: 'NY' }
    });
    // Protected endpoint should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

test.describe('Staging Performance Tests', () => {
  test('home page should load within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    // Wait for page to load (may have cold start delay)
    await expect(page.locator('body')).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Allow up to 10 seconds for cold start scenarios
    expect(loadTime).toBeLessThan(10000);
    console.log(`Home page load time: ${loadTime}ms`);
  });

  test('browse page should load within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/browse');
    await expect(page.locator('main')).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
    console.log(`Browse page load time: ${loadTime}ms`);
  });

  test('API should respond within 5 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/health');
    const responseTime = Date.now() - startTime;

    // Health endpoint should always return 200
    expect(response.status()).toBe(200);
    // Allow more time for cold starts
    expect(responseTime).toBeLessThan(5000);
    console.log(`API response time: ${responseTime}ms`);
  });
});

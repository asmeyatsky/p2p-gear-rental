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

  test('should return successful health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('should return successful database health check', async ({ request }) => {
    const response = await request.get('/api/health/database');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
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
  test('should fetch gear listings', async ({ request }) => {
    const response = await request.get('/api/gear');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('gear');
    expect(Array.isArray(body.gear)).toBeTruthy();
  });

  test('should handle gear search with filters', async ({ request }) => {
    const response = await request.get('/api/gear?category=cameras&limit=5');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('gear');
    expect(Array.isArray(body.gear)).toBeTruthy();
  });

  test('should return 401 for protected endpoints without auth', async ({ request }) => {
    const response = await request.post('/api/gear', {
      data: { title: 'Test', description: 'Test', dailyRate: 50, city: 'NYC', state: 'NY' }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Staging Performance Tests', () => {
  test('home page should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    console.log(`Home page load time: ${loadTime}ms`);
  });

  test('browse page should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/browse');
    await expect(page.locator('main')).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    console.log(`Browse page load time: ${loadTime}ms`);
  });

  test('API should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/gear?limit=10');
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(2000);
    console.log(`API response time: ${responseTime}ms`);
  });
});

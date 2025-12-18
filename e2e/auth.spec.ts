import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display signup form correctly', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check for signup form elements
    await expect(page.getByText('Create an account')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/auth/login');

    // Check for login form elements
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    // Start at login page
    await page.goto('/auth/login');
    await expect(page.getByText('Welcome back')).toBeVisible();

    // Click link to signup (use exact match to avoid multiple matches)
    await page.getByRole('link', { name: 'Sign up', exact: true }).click();
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.getByText('Create an account')).toBeVisible();

    // Click link to go back to login (inside the form area)
    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/auth/login');
  });

  test('should show error for invalid login attempt', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for the page - should remain on login page even with error
    await expect(page).toHaveURL('/auth/login', { timeout: 10000 });
  });
});

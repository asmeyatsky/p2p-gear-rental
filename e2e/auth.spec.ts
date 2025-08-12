import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow a user to sign up and then log in', async ({ page }) => {
    // Sign up
    await page.goto('/auth/signup');
    await page.fill('input[name="name"]', 'Playwright User');
    await page.fill('input[name="email"]', `playwright-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Expect to be redirected to the home page after signup
    await expect(page).toHaveURL('/');
    await expect(page.getByText('GearShare')).toBeVisible(); // Check for a common element on home page

    // Log out
    await page.click('text=Log Out');
    await expect(page).toHaveURL('/auth/login');

    // Log in
    const userEmail = await page.locator('input[name="email"]').inputValue(); // Get the email used for signup
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Expect to be redirected to the home page after login
    await expect(page).toHaveURL('/');
    await expect(page.getByText('GearShare')).toBeVisible();
  });

  test('should display an error for invalid login credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Expect an error toast to be visible
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL('/auth/login'); // Should remain on login page
  });
});

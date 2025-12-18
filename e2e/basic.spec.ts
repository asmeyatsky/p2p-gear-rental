import { test, expect } from '@playwright/test';

test('should navigate to the home page and find "GearShare" text', async ({ page }) => {
  await page.goto('/');
  // Use more specific selector to avoid multiple matches
  await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
  // Check for navigation link in header (use locator with header)
  await expect(page.locator('header').getByRole('link', { name: 'Browse Gear' })).toBeVisible();
});

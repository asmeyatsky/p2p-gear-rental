import { test, expect } from '@playwright/test';

test('should navigate to the home page and find "GearShare" text', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('GearShare')).toBeVisible();
});

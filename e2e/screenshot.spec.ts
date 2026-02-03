import { test, expect } from '@playwright/test';

test('take screenshot of homepage', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshot.png' });
});

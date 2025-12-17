import { test, expect } from '@playwright/test';

test('take screenshot of homepage', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: 'screenshot.png' });
});

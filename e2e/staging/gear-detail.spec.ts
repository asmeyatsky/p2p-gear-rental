import { test, expect } from '@playwright/test';

const BASE_PATH = '/gear-staging';

test.describe('Gear Detail Page — Navigation', () => {
  test('should navigate to a gear detail page by clicking a card', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await page.waitForSelector(`a[href*="/gear/"]`, { timeout: 15000 });

    await page.locator(`a[href*="/gear/"]`).first().click();

    await expect(page).toHaveURL(/\/gear\/.+/);
  });

  test('should return to browse when browser back is used', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await page.waitForSelector(`a[href*="/gear/"]`, { timeout: 15000 });

    await page.locator(`a[href*="/gear/"]`).first().click();
    await expect(page).toHaveURL(/\/gear\/.+/);

    await page.goBack();
    await expect(page).toHaveURL(/\/browse/);
  });
});

test.describe('Gear Detail Page — Content', () => {
  // Grab a real gear item from the API to assert against
  let gearId: string;
  let gearTitle: string;
  let gearCity: string;
  let gearCategory: string;
  let gearCondition: string;

  test.beforeAll(async ({ request }) => {
    // Retry up to 3 times — Cloud Run staging may return 503 on cold start
    let item: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await request.get(`${BASE_PATH}/api/gear?page=1&limit=1`);
      if (res.status() === 200) {
        const body = await res.json();
        item = body.data?.[0];
        if (item) break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!item) throw new Error('Failed to fetch a gear item after 3 attempts');
    gearId        = item.id;
    gearTitle     = item.title;
    gearCity      = item.city;
    gearCategory  = item.category;
    gearCondition = item.condition;
  });

  test('should display the gear title', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);
    // Title is in an h1 on the detail page — use heading role to avoid strict-mode on duplicates
    await expect(page.getByRole('heading', { name: gearTitle }).first()).toBeVisible();
  });

  test('should display the daily rate with "/ day" label', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    // The pricing block contains "$XX.XX" followed by "/ day"
    // Use getByText with a regex scoped to the pricing container to avoid strict-mode issues
    await expect(page.getByText('/ day')).toBeVisible();
    // At least one element on the page matches a dollar amount
    const priceEl = page.locator('text=/\\$\\d+\\.\\d+/').first();
    await expect(priceEl).toBeVisible();
  });

  test('should display the category badge', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    // Category badge is a capitalize span with purple styling
    await expect(page.getByText(gearCategory, { exact: true }).first()).toBeVisible();
  });

  test('should display the condition badge', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    await expect(page.getByText(gearCondition, { exact: true }).first()).toBeVisible();
  });

  test('should display the description section', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    await expect(page.getByText('Description')).toBeVisible();
  });

  test('should display the location city', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    await expect(page.locator('body')).toContainText(gearCity);
  });

  test('should display the owner section with a seed lister name', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    await expect(page.getByText('Listed by')).toBeVisible();

    const ownerNames = [
      'Maya Chen', 'James Rodriguez', 'Sarah Mitchell', 'Derek Thompson',
      'Aisha Patel', 'Tom Nakamura', 'Rachel Kim', 'Marcus Bell',
      'Olivia Grant', 'Chris Donovan',
    ];
    const bodyText = await page.locator('body').textContent();
    const hasOwner = ownerNames.some(name => bodyText!.includes(name));
    expect(hasOwner).toBe(true);
  });

  test('should show Request Rental and Message Owner buttons', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    await expect(page.getByRole('button', { name: 'Request Rental' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Message Owner' })).toBeVisible();
  });

  test('should show the Reviews section', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/${gearId}`);

    await expect(page.getByRole('heading', { name: 'Reviews' }).first()).toBeVisible();
  });

  test('should show weekly and monthly rates when available', async ({ page, request }) => {
    // Find a gear item that has both rates
    const res = await request.get(`${BASE_PATH}/api/gear?page=1&limit=20`);
    const body = await res.json();
    const item = body.data.find((i: any) => i.weeklyRate && i.monthlyRate);
    if (!item) {
      test.skip('No gear with weekly/monthly rates found');
      return;
    }

    await page.goto(`${BASE_PATH}/gear/${item.id}`);

    await expect(page.getByText(/Weekly:/)).toBeVisible();
    await expect(page.getByText(/Monthly:/)).toBeVisible();
  });
});

test.describe('Gear Detail Page — 404 Handling', () => {
  test('should show a not-found page for a non-existent gear ID', async ({ page }) => {
    await page.goto(`${BASE_PATH}/gear/this-id-does-not-exist-anywhere`);

    // Next.js notFound() renders the not-found page content.
    // Cloud Run may return HTTP 200 wrapping it, so check the page content instead.
    const bodyText = await page.locator('body').textContent();
    expect(
      bodyText!.toLowerCase().includes('not found') ||
      bodyText!.includes('404')
    ).toBe(true);
  });
});

import { test, expect } from '@playwright/test';

const BASE_PATH = '/gear-staging';

// Helper: wait for gear cards to appear after client-side hydration + API fetch.
// NOTE: networkidle never fires on Cloud Run (background activity), so we rely
// solely on waitForSelector to detect when cards have rendered.
async function waitForCards(page: import('@playwright/test').Page) {
  await page.waitForSelector(`a[href*="/gear/"]`, { timeout: 15000 });
}

test.describe('Browse Page — Gear Cards Render', () => {
  test('should display gear cards with titles and prices', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    const cards = page.locator(`a[href*="/gear/"]`);
    expect(await cards.count()).toBeGreaterThan(0);

    // First card should contain a title (h3) and a price ($XX/d)
    const firstCard = cards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard).toContainText('$');
    await expect(firstCard).toContainText('/d');
  });

  test('should show category badges on cards', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Category badges are small spans — at least some cards have one
    const badges = page.locator(`a[href*="/gear/"] span`).filter({
      hasText: /^(cameras|lenses|drones|lighting|audio|tripods|accessories|stabilizers|monitors)$/i,
    });
    expect(await badges.count()).toBeGreaterThan(0);
  });

  test('should show location on cards', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Location is rendered as "City,State" (no space after comma in GearCard)
    const locationPattern = /(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose)/;
    await expect(page.locator(`a[href*="/gear/"]`).first()).toContainText(locationPattern);
  });

  test('should display results count', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Results count: "X items found"
    await expect(page.locator('text=/\\d+ items found/')).toBeVisible();
  });
});

test.describe('Browse Page — Category Filtering', () => {
  test('should filter by clicking a category pill', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Click the "Cameras" category pill and wait for the API response + re-render
    await Promise.all([
      page.waitForResponse(/\/api\/gear/),
      page.getByRole('button', { name: /Cameras/ }).click(),
    ]);
    await waitForCards(page);

    // All visible category badges should now be "cameras"
    // NOTE: "X items found" shows gear.length (page size = 24), not the API total,
    // so we verify the card content instead of comparing counts.
    const badges = page.locator(`a[href*="/gear/"] span`).filter({
      hasText: /^(cameras|lenses|drones|lighting|audio|tripods|accessories|stabilizers|monitors)$/i,
    });
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText(/^cameras$/i);
    }
  });

  test('should reset results when clicking All Categories', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Filter to cameras first
    await Promise.all([
      page.waitForResponse(/\/api\/gear/),
      page.getByRole('button', { name: /Cameras/ }).click(),
    ]);
    await waitForCards(page);

    // Verify filtered — at least one badge is "cameras"
    const cameraBadges = page.locator(`a[href*="/gear/"] span`).filter({ hasText: /^cameras$/i });
    expect(await cameraBadges.count()).toBeGreaterThan(0);

    // Click All Categories to reset
    const responsePromise = page.waitForResponse(/\/api\/gear/);
    await page.getByRole('button', { name: /All Categories/ }).click();
    await responsePromise;

    // Wait until the DOM actually shows cards from more than one category
    // (waitForCards alone isn't enough — old filtered cards may still be visible)
    await page.waitForFunction(() => {
      const spans = document.querySelectorAll('a[href*="/gear/"] span');
      const cats = new Set<string>();
      spans.forEach(s => {
        const t = (s.textContent || '').toLowerCase().trim();
        if (/^(cameras|lenses|drones|lighting|audio|tripods|accessories|stabilizers|monitors)$/.test(t))
          cats.add(t);
      });
      return cats.size > 1;
    }, { timeout: 15000 });

    // Verify we now see at least 2 distinct categories
    const allBadges = page.locator(`a[href*="/gear/"] span`).filter({
      hasText: /^(cameras|lenses|drones|lighting|audio|tripods|accessories|stabilizers|monitors)$/i,
    });
    const seen = new Set<string>();
    const total = await allBadges.count();
    for (let i = 0; i < total; i++) {
      seen.add((await allBadges.nth(i).textContent())!.toLowerCase());
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  test('should filter by multiple categories sequentially', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    const categories = [
      { label: 'Lenses', value: 'lenses' },
      { label: 'Drones', value: 'drones' },
      { label: 'Audio',  value: 'audio' },
    ];

    for (const cat of categories) {
      // Set up response listener before the click so we don't miss fast responses
      const responsePromise = page.waitForResponse(/\/api\/gear/);
      await page.getByRole('button', { name: new RegExp(cat.label) }).click();
      await responsePromise;

      // Wait for a card badge matching the selected category to appear in the DOM
      // (don't use waitForCards — old cards may still be present momentarily)
      const expectedBadge = page.locator(`a[href*="/gear/"] span`).filter({
        hasText: new RegExp(`^${cat.value}$`, 'i'),
      });
      await expectedBadge.first().waitFor({ timeout: 15000 });
      expect(await expectedBadge.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Browse Page — Sort and Price Filters', () => {
  test('should open the expanded filters panel', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Click the "Filters" toggle button
    await page.getByText('Filters').click();

    // The expanded panel has condition, price, city, sort selects
    expect(await page.locator('select').count()).toBeGreaterThanOrEqual(2);
  });

  test('should sort by price low to high', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    // Open filters and select sort
    await page.getByText('Filters').click();
    // Sort is the last select (after Condition, Radius)
    const selects = page.locator('select');
    const sortSelect = selects.last();
    await Promise.all([
      page.waitForResponse(/\/api\/gear/),
      sortSelect.selectOption('price-low'),
    ]);
    // Brief pause for React to batch-update the card list after API response
    await page.waitForTimeout(1000);
    await waitForCards(page);

    // Extract prices from the first few visible cards
    const cards = page.locator(`a[href*="/gear/"]`);
    const prices: number[] = [];
    for (let i = 0; i < 5; i++) {
      const text = await cards.nth(i).textContent();
      // Price format: "$XX.XX/d" — grab the number before "/d"
      const match = text!.match(/\$(\d+\.?\d*)\/d/);
      if (match) prices.push(parseFloat(match[1]));
    }

    expect(prices.length).toBeGreaterThan(1);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('should sort by price high to low', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    await page.getByText('Filters').click();
    const sortSelect = page.locator('select').last();
    await Promise.all([
      page.waitForResponse(/\/api\/gear/),
      sortSelect.selectOption('price-high'),
    ]);
    // Brief pause for React to batch-update the card list after API response
    await page.waitForTimeout(1000);
    await waitForCards(page);

    const cards = page.locator(`a[href*="/gear/"]`);
    const prices: number[] = [];
    for (let i = 0; i < 5; i++) {
      const text = await cards.nth(i).textContent();
      const match = text!.match(/\$(\d+\.?\d*)\/d/);
      if (match) prices.push(parseFloat(match[1]));
    }

    expect(prices.length).toBeGreaterThan(1);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });
});

test.describe('Browse Page — Pagination', () => {
  test('should show a "More" button and load additional items', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    await waitForCards(page);

    const cardsBefore = await page.locator(`a[href*="/gear/"]`).count();

    // Click "More" button to load next page - use role to distinguish from product names
    await page.getByRole('button', { name: 'More' }).click();
    // Wait for new cards to appear (count should increase)
    await page.waitForFunction(
      (prevCount) => document.querySelectorAll('a[href*="/gear/"]').length > prevCount,
      cardsBefore,
      { timeout: 15000 }
    );

    const cardsAfter = await page.locator(`a[href*="/gear/"]`).count();
    expect(cardsAfter).toBeGreaterThan(cardsBefore);
  });
});

test.describe('Browse Page — Search Input', () => {
  test('should have a visible search input', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    // Search bar is in the gradient header — renders immediately, no need to wait for cards
    await expect(page.getByPlaceholder('Search gear...')).toBeVisible();
  });

  test('should accept text input in the search box', async ({ page }) => {
    await page.goto(`${BASE_PATH}/browse`);
    const searchInput = page.getByPlaceholder('Search gear...');
    // Use pressSequentially so each character fires onChange properly on the
    // React controlled input (fill() can race with re-renders from the per-keystroke API fetch)
    await searchInput.click();
    await searchInput.pressSequentially('Canon');
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('Canon');
  });
});

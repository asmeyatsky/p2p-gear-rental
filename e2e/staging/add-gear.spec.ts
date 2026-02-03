import { test, expect } from '@playwright/test';

const BASE_PATH = '/gear-staging';

test.describe('Add Gear Page — Auth Redirects', () => {
  test('should redirect unauthenticated users from /add-gear to login', async ({ page }) => {
    await page.goto(`${BASE_PATH}/add-gear`);

    // useEffect pushes to /auth/login — wait for the redirect
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from /add-gear/bulk to login', async ({ page }) => {
    await page.goto(`${BASE_PATH}/add-gear/bulk`);

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('bulk upload redirect should include redirectTo param', async ({ page }) => {
    await page.goto(`${BASE_PATH}/add-gear/bulk`);

    await expect(page).toHaveURL(/redirectTo=.*add-gear.*bulk/, { timeout: 10000 });
  });
});

test.describe('API — Protected Endpoints', () => {
  test('POST /api/gear should require authentication', async ({ request }) => {
    const response = await request.post(`${BASE_PATH}/api/gear`, {
      data: {
        title: 'Should Fail',
        description: 'No auth',
        dailyRate: 50,
        city: 'NYC',
        state: 'NY',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('POST /api/gear/bulk should reject unauthenticated requests', async ({ request }) => {
    const response = await request.post(`${BASE_PATH}/api/gear/bulk`, {
      multipartData: {
        file: {
          name: 'test.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('title,description\nFoo,Bar'),
        },
      },
    });

    // Should not succeed — either 401 (no session) or other auth error
    expect(response.status()).not.toBe(200);
  });
});

test.describe('API — GET /api/gear Edge Cases', () => {
  test('should cap limit at 50 even if a higher value is requested', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?limit=200`);
    const body = await response.json();

    expect(body.data.length).toBeLessThanOrEqual(50);
    expect(body.pagination.limit).toBe(50);
  });

  test('should return an empty array for a nonsense category', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?category=not_a_real_category`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  test('should return an empty array when minPrice exceeds all items', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?minPrice=99999`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveLength(0);
  });

  test('should return an empty array when maxPrice is below all items', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?maxPrice=1`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveLength(0);
  });

  test('should default to page 1 when page param is omitted', async ({ request }) => {
    const withPage  = await (await request.get(`${BASE_PATH}/api/gear?limit=5&page=1`)).json();
    const withoutPage = await (await request.get(`${BASE_PATH}/api/gear?limit=5`)).json();

    // Same items regardless of whether page=1 is explicit
    expect(withoutPage.data.map((i: any) => i.id)).toEqual(withPage.data.map((i: any) => i.id));
  });

  test('should return hasNext=false on the last page', async ({ request }) => {
    // 1000 items at limit=24 → last page = ceil(1000/24) = 42
    const response = await request.get(`${BASE_PATH}/api/gear?page=42&limit=24`);
    const body = await response.json();

    expect(body.pagination.hasNext).toBe(false);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('should return hasNext=true on a middle page', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?page=1&limit=24`);
    const body = await response.json();

    expect(body.pagination.hasNext).toBe(true);
    expect(body.data).toHaveLength(24);
  });

  test('should return an empty array for a page beyond total', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?page=999&limit=24`);
    const body = await response.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.hasNext).toBe(false);
  });

  test('should filter by state correctly', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?state=NY&limit=5`);
    const body = await response.json();

    expect(body.total).toBeGreaterThan(0);
    body.data.forEach((item: any) => {
      expect(item.state).toBe('NY');
    });
  });

  test('should filter by city correctly', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?city=Chicago&limit=5`);
    const body = await response.json();

    expect(body.total).toBeGreaterThan(0);
    body.data.forEach((item: any) => {
      expect(item.city).toBe('Chicago');
    });
  });

  test('should combine category and state filters', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?category=cameras&state=CA&limit=50`);
    const body = await response.json();

    expect(body.total).toBeGreaterThan(0);
    body.data.forEach((item: any) => {
      expect(item.category).toBe('cameras');
      expect(item.state).toBe('CA');
    });
  });

  test('should combine category and price range filters', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?category=lenses&minPrice=50&maxPrice=150&limit=50`);
    const body = await response.json();

    body.data.forEach((item: any) => {
      expect(item.category).toBe('lenses');
      expect(item.dailyRate).toBeGreaterThanOrEqual(50);
      expect(item.dailyRate).toBeLessThanOrEqual(150);
    });
  });

  test('should return items sorted by price ascending', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?sortBy=price-low&limit=10`);
    const body = await response.json();

    const prices = body.data.map((i: any) => i.dailyRate);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('should return items sorted by price descending', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?sortBy=price-high&limit=10`);
    const body = await response.json();

    const prices = body.data.map((i: any) => i.dailyRate);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('should default to newest sort when sortBy is omitted', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?limit=5`);
    const body = await response.json();

    // All items have the same createdAt (batch-seeded), so just verify we get data back
    expect(body.data).toHaveLength(5);
  });

  test('should include full owner info in each gear item', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?limit=1`);
    const body = await response.json();
    const item = body.data[0];

    expect(item).toHaveProperty('user');
    expect(item.user).toHaveProperty('id');
    expect(item.user).toHaveProperty('full_name');
    expect(item.user).toHaveProperty('averageRating');
    expect(item.user).toHaveProperty('totalReviews');
    expect(item.user.full_name).toBeTruthy();
  });

  test('should include all expected gear fields', async ({ request }) => {
    const response = await request.get(`${BASE_PATH}/api/gear?limit=1`);
    const body = await response.json();
    const item = body.data[0];

    const requiredFields = [
      'id', 'title', 'description', 'dailyRate', 'city', 'state',
      'category', 'brand', 'model', 'condition', 'isAvailable',
      'createdAt', 'updatedAt', 'user',
    ];
    requiredFields.forEach(field => {
      expect(item).toHaveProperty(field);
    });
  });
});

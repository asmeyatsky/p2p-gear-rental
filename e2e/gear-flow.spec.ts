import { test, expect } from '@playwright/test';

test.describe('Gear Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should display gear listings on home page', async ({ page }) => {
    // Check that the main header is visible
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();

    // Check for navigation elements in header (matches actual page.tsx)
    await expect(page.locator('header').getByRole('link', { name: 'Browse Gear' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'How It Works' })).toBeVisible();

    // Check for authentication links (actual text on homepage)
    await expect(page.locator('header').getByText('Sign In')).toBeVisible();
    await expect(page.locator('header').getByText('Get Started')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('/auth/signup');

    // Check for signup form elements (actual text from signup page)
    await expect(page.getByText('Create an account')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/auth/login');

    // Check for login form elements (actual text from login page)
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should display footer information', async ({ page }) => {
    // Check footer content - matches actual homepage inline footer
    await expect(page.getByText('© 2024 GearShare')).toBeVisible();
    await expect(page.locator('footer').getByText('About')).toBeVisible();
    await expect(page.locator('footer').getByText('Terms')).toBeVisible();
    await expect(page.locator('footer').getByText('Privacy')).toBeVisible();
  });

  test('should handle responsive navigation', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Main navigation should still be accessible
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();

    // Get Started button should be visible on mobile (in header)
    await expect(page.locator('header').getByText('Get Started')).toBeVisible();
  });

  test('should show hero section', async ({ page }) => {
    // Check for hero section content
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('Gear Browse Flow', () => {
  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/');

    // Click browse gear link in header
    const browseLink = page.locator('header').getByRole('link', { name: 'Browse Gear' });
    await expect(browseLink).toBeVisible();
    await browseLink.click();
    await expect(page).toHaveURL('/browse');
  });
});

test.describe('About and Info Pages', () => {
  test('should navigate to about page via How It Works', async ({ page }) => {
    await page.goto('/');

    const aboutLink = page.locator('header').getByRole('link', { name: 'How It Works' });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL('/about');
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/');

    const contactLink = page.locator('header').getByRole('link', { name: 'Contact' });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL('/contact');
  });

  test('should navigate to browse page from header', async ({ page }) => {
    await page.goto('/');

    const browseLink = page.locator('header').getByRole('link', { name: 'Browse Gear' });
    await expect(browseLink).toBeVisible();
    await browseLink.click();
    await expect(page).toHaveURL('/browse');
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect appropriately
    // This will depend on your 404 page implementation
    const pageContent = await page.content();
    expect(pageContent).toContain('404');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('/api/gear', route => route.abort());
    
    await page.goto('/');
    
    // Should still show the basic page structure
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
  });
});
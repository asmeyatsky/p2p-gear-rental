import { test, expect } from '@playwright/test';

test.describe('Gear Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should display gear listings on home page', async ({ page }) => {
    // Check that the main header is visible
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
    
    // Check for navigation elements
    await expect(page.getByText('Browse Gear')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
    
    // Check for authentication links
    await expect(page.getByText('Log In')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/auth/signup');
    
    // Check for signup form elements
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Log In' }).click();
    await expect(page).toHaveURL('/auth/login');
    
    // Check for login form elements
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('should display footer information', async ({ page }) => {
    // Check footer content
    await expect(page.getByText('Your go-to marketplace for renting')).toBeVisible();
    await expect(page.getByText('Quick Links')).toBeVisible();
    await expect(page.getByText('Follow Us')).toBeVisible();
    await expect(page.getByText('© 2025 GearShare. All rights reserved.')).toBeVisible();
  });

  test('should handle responsive navigation', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main navigation should still be accessible
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
    
    // Test authentication buttons are still visible
    await expect(page.getByText('Log In')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // The page should show loading state initially
    await expect(page.getByText('Loading gear...')).toBeVisible();
  });
});

test.describe('Gear Browse Flow', () => {
  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/');
    
    // Try to click browse gear if it's a link
    const browseLink = page.getByText('Browse Gear');
    await expect(browseLink).toBeVisible();
    
    // If it's clickable, test the navigation
    if (await browseLink.isEnabled()) {
      await browseLink.click();
      // Add expectations for browse page when implemented
    }
  });
});

test.describe('About and Info Pages', () => {
  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    
    const aboutLink = page.getByText('About');
    await expect(aboutLink).toBeVisible();
    
    if (await aboutLink.isEnabled()) {
      await aboutLink.click();
      // Add expectations for about page when implemented
    }
  });

  test('should navigate to FAQ page', async ({ page }) => {
    await page.goto('/');
    
    const faqLink = page.getByText('FAQ');
    await expect(faqLink).toBeVisible();
    
    if (await faqLink.isEnabled()) {
      await faqLink.click();
      // Add expectations for FAQ page when implemented
    }
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/');
    
    const contactLink = page.getByText('Contact');
    await expect(contactLink).toBeVisible();
    
    if (await contactLink.isEnabled()) {
      await contactLink.click();
      // Add expectations for contact page when implemented
    }
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
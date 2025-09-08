import { test, expect } from '@playwright/test';

test.describe('Complete Rental Flow', () => {
  let userEmail: string;
  let ownerEmail: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique emails for this test session
    const timestamp = Date.now();
    userEmail = `renter-${timestamp}@example.com`;
    ownerEmail = `owner-${timestamp}@example.com`;
  });

  test('should complete full rental workflow: signup, create gear, rent, pay, review', async ({ page }) => {
    // STEP 1: Owner signs up and creates gear
    await page.goto('/auth/signup');
    await page.fill('input[name="name"]', 'Gear Owner');
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should be redirected to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Gear Owner')).toBeVisible();

    // Navigate to create gear page
    await page.getByRole('link', { name: 'List Gear' }).click();
    await expect(page).toHaveURL('/gear/create');

    // Fill out gear creation form
    await page.fill('input[name="title"]', 'Canon EOS R5 Camera');
    await page.fill('textarea[name="description"]', 'Professional mirrorless camera perfect for photography and videography. Excellent condition with all original accessories.');
    await page.fill('input[name="dailyRate"]', '75');
    await page.fill('input[name="weeklyRate"]', '450');
    await page.fill('input[name="monthlyRate"]', '1500');
    await page.selectOption('select[name="category"]', 'cameras');
    await page.fill('input[name="brand"]', 'Canon');
    await page.fill('input[name="model"]', 'EOS R5');
    await page.selectOption('select[name="condition"]', 'like-new');
    await page.fill('input[name="city"]', 'San Francisco');
    await page.fill('input[name="state"]', 'CA');
    
    // Add sample image URL
    await page.fill('input[name="images"]', 'https://example.com/canon-r5.jpg');
    
    // Submit gear creation
    await page.click('button[type="submit"]');
    
    // Should redirect to gear detail page
    await expect(page).toHaveURL(/\/gear\/[a-zA-Z0-9]+/);
    await expect(page.getByText('Canon EOS R5 Camera')).toBeVisible();
    await expect(page.getByText('$75/day')).toBeVisible();

    // Log out as owner
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();
    await expect(page).toHaveURL('/');

    // STEP 2: Renter signs up
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.fill('input[name="name"]', 'Gear Renter');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // STEP 3: Browse and find the gear
    await page.goto('/');
    await page.getByText('Canon EOS R5 Camera').click();
    await expect(page.getByText('Canon EOS R5 Camera')).toBeVisible();
    await expect(page.getByText('Professional mirrorless camera')).toBeVisible();

    // STEP 4: Create rental request
    await page.click('button:has-text("Request Rental")');
    
    // Fill rental request form
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await page.fill('input[name="startDate"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', nextWeek.toISOString().split('T')[0]);
    await page.fill('textarea[name="message"]', 'I need this camera for a wedding shoot. I have experience with professional cameras and will take excellent care of it.');
    
    await page.click('button[type="submit"]:has-text("Send Request")');
    
    // Should show success message
    await expect(page.getByText(/rental request sent/i)).toBeVisible();

    // Navigate to my rentals page
    await page.getByRole('link', { name: 'My Rentals' }).click();
    await expect(page).toHaveURL('/my-rentals');
    await expect(page.getByText('Canon EOS R5 Camera')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();

    // STEP 5: Owner approves rental
    // Log out as renter
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();

    // Log in as owner
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Go to dashboard to see rental requests
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Pending Requests')).toBeVisible();
    await expect(page.getByText('Canon EOS R5 Camera')).toBeVisible();

    // Approve the rental
    await page.click('button:has-text("Approve")');
    await expect(page.getByText(/rental approved/i)).toBeVisible();

    // STEP 6: Renter pays for rental
    // Log out as owner
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();

    // Log in as renter
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Go to my rentals
    await page.getByRole('link', { name: 'My Rentals' }).click();
    await expect(page.getByText('Approved')).toBeVisible();

    // Click to pay
    await page.click('button:has-text("Pay Now")');
    await expect(page).toHaveURL(/\/rentals\/[a-zA-Z0-9]+\/confirm-payment/);
    
    // Fill payment form (test mode)
    await page.fill('input[data-testid="card-number"]', '4242424242424242');
    await page.fill('input[data-testid="card-expiry"]', '12/28');
    await page.fill('input[data-testid="card-cvc"]', '123');
    await page.fill('input[data-testid="billing-name"]', 'Gear Renter');
    
    await page.click('button[type="submit"]:has-text("Pay")');
    
    // Should redirect to confirmation page
    await expect(page).toHaveURL(/\/rentals\/[a-zA-Z0-9]+\/confirmation/);
    await expect(page.getByText('Payment Successful')).toBeVisible();
    await expect(page.getByText('Your rental is confirmed')).toBeVisible();

    // STEP 7: Simulate rental completion and review
    // For testing purposes, we'll navigate directly to review flow
    await page.goto('/my-rentals');
    
    // In a real app, rental would be marked as completed after end date
    // For testing, we'll assume it's completed and review button is available
    await page.click('button:has-text("Write Review")');
    
    // Fill review form
    await page.click('[data-testid="star-5"]'); // 5-star rating
    await page.fill('textarea[name="comment"]', 'Excellent camera! The owner was very responsive and the equipment was in perfect condition. Would definitely rent again!');
    
    await page.click('button[type="submit"]:has-text("Submit Review")');
    await expect(page.getByText(/review submitted/i)).toBeVisible();
  });

  test('should handle rental rejection flow', async ({ page }) => {
    // Similar setup as above but test rejection path
    // Owner signs up and creates gear (abbreviated)
    await page.goto('/auth/signup');
    await page.fill('input[name="name"]', 'Strict Owner');
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Create basic gear
    await page.getByRole('link', { name: 'List Gear' }).click();
    await page.fill('input[name="title"]', 'Sony FX3 Camera');
    await page.fill('textarea[name="description"]', 'Professional cinema camera');
    await page.fill('input[name="dailyRate"]', '100');
    await page.fill('input[name="city"]', 'Los Angeles');
    await page.fill('input[name="state"]', 'CA');
    await page.click('button[type="submit"]');

    // Log out and renter signs up
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();
    
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.fill('input[name="name"]', 'Hopeful Renter');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Find and request gear
    await page.getByText('Sony FX3 Camera').click();
    await page.click('button:has-text("Request Rental")');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await page.fill('input[name="startDate"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', nextWeek.toISOString().split('T')[0]);
    await page.fill('textarea[name="message"]', 'Need this for a personal project.');
    
    await page.click('button[type="submit"]:has-text("Send Request")');

    // Switch back to owner and reject
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();
    
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.click('button:has-text("Reject")');
    
    // Should be able to provide rejection reason
    await page.fill('textarea[name="rejectionReason"]', 'Unfortunately, this equipment is needed for a commercial project during those dates.');
    await page.click('button[type="submit"]:has-text("Confirm Rejection")');
    
    await expect(page.getByText(/rental rejected/i)).toBeVisible();

    // Verify renter sees rejection
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();
    
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.getByRole('link', { name: 'My Rentals' }).click();
    await expect(page.getByText('Rejected')).toBeVisible();
    await expect(page.getByText('commercial project')).toBeVisible();
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Set up approved rental (abbreviated setup)
    // ... setup code similar to main flow ...

    // Navigate to payment with invalid card
    await page.goto('/rentals/test-rental-id/confirm-payment');
    
    // Use declined card number
    await page.fill('input[data-testid="card-number"]', '4000000000000002');
    await page.fill('input[data-testid="card-expiry"]', '12/28');
    await page.fill('input[data-testid="card-cvc"]', '123');
    await page.fill('input[data-testid="billing-name"]', 'Test User');
    
    await page.click('button[type="submit"]:has-text("Pay")');
    
    // Should show payment failure message
    await expect(page.getByText(/payment failed/i)).toBeVisible();
    await expect(page.getByText(/try a different payment method/i)).toBeVisible();
    
    // Should remain on payment page for retry
    await expect(page).toHaveURL(/\/rentals\/[a-zA-Z0-9]+\/confirm-payment/);
  });
});

test.describe('Gear Search and Filter Flow', () => {
  test('should search and filter gear effectively', async ({ page }) => {
    await page.goto('/');
    
    // Test basic search
    await page.fill('input[placeholder*="Search"]', 'Canon');
    await page.click('button:has-text("Search")');
    
    // Should show search results
    await expect(page.getByText('Canon')).toBeVisible();
    
    // Test category filter
    await page.selectOption('select[name="category"]', 'cameras');
    await page.click('button:has-text("Apply Filters")');
    
    // Test price range filter
    await page.fill('input[name="minPrice"]', '50');
    await page.fill('input[name="maxPrice"]', '200');
    await page.click('button:has-text("Apply Filters")');
    
    // Test location filter
    await page.fill('input[name="location"]', 'San Francisco, CA');
    await page.click('button:has-text("Apply Filters")');
    
    // Test date availability filter
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await page.fill('input[name="startDate"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', nextWeek.toISOString().split('T')[0]);
    await page.click('button:has-text("Check Availability")');
    
    // Should show available gear for those dates
    await expect(page.getByText('Available')).toBeVisible();
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Search for something that doesn't exist
    await page.fill('input[placeholder*="Search"]', 'NonexistentBrand12345');
    await page.click('button:has-text("Search")');
    
    // Should show empty state
    await expect(page.getByText('No gear found')).toBeVisible();
    await expect(page.getByText('Try adjusting your search')).toBeVisible();
    await expect(page.getByText('Clear filters')).toBeVisible();
  });

  test('should show gear details with all necessary information', async ({ page }) => {
    await page.goto('/');
    
    // Click on first gear item
    await page.click('[data-testid="gear-card"]:first-child');
    
    // Should show all gear details
    await expect(page.getByText('Daily Rate')).toBeVisible();
    await expect(page.getByText('Weekly Rate')).toBeVisible();
    await expect(page.getByText('Monthly Rate')).toBeVisible();
    await expect(page.getByText('Location')).toBeVisible();
    await expect(page.getByText('Condition')).toBeVisible();
    await expect(page.getByText('Owner')).toBeVisible();
    await expect(page.getByText('Reviews')).toBeVisible();
    
    // Should have request rental button
    await expect(page.getByText('Request Rental')).toBeVisible();
  });
});

test.describe('User Dashboard and Profile Flow', () => {
  test('should display comprehensive dashboard information', async ({ page }) => {
    // Login as existing user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Should show key statistics
    await expect(page.getByText('Total Gear Listed')).toBeVisible();
    await expect(page.getByText('Active Rentals')).toBeVisible();
    await expect(page.getByText('Pending Requests')).toBeVisible();
    await expect(page.getByText('Total Earnings')).toBeVisible();
    await expect(page.getByText('Average Rating')).toBeVisible();
    
    // Should show recent activity
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Recent Reviews')).toBeVisible();
    
    // Should show earnings chart
    await expect(page.getByText('Earnings Overview')).toBeVisible();
    await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible();
  });

  test('should allow profile editing', async ({ page }) => {
    // Login and go to profile
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Profile').click();
    await expect(page).toHaveURL('/profile');
    
    // Edit profile information
    await page.click('button:has-text("Edit Profile")');
    await page.fill('input[name="fullName"]', 'Updated Name');
    await page.fill('textarea[name="bio"]', 'I am an experienced photographer who loves sharing great gear with the community.');
    await page.fill('input[name="phone"]', '+1 (555) 123-4567');
    await page.fill('input[name="location"]', 'San Francisco, CA');
    
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
    
    // Verify changes are saved
    await expect(page.getByText('Updated Name')).toBeVisible();
    await expect(page.getByText('experienced photographer')).toBeVisible();
  });

  test('should display user reviews and ratings correctly', async ({ page }) => {
    await page.goto('/profile/test-user-id');
    
    // Should show user's basic info
    await expect(page.getByText('Member since')).toBeVisible();
    await expect(page.getByText('Response rate')).toBeVisible();
    await expect(page.getByText('Average rating')).toBeVisible();
    
    // Should show reviews
    await expect(page.getByText('Reviews')).toBeVisible();
    await expect(page.getByText('★')).toBeVisible(); // Star ratings
    
    // Should show user's gear
    await expect(page.getByText('Available Gear')).toBeVisible();
  });
});

test.describe('Messaging and Communication Flow', () => {
  test('should enable real-time messaging between users', async ({ page }) => {
    // This would test the messaging system
    await page.goto('/rentals/test-rental-id/messages');
    
    // Should show message history
    await expect(page.getByText('Messages')).toBeVisible();
    
    // Should allow sending new message
    await page.fill('textarea[name="message"]', 'Hi! I have a question about the pickup time.');
    await page.click('button:has-text("Send")');
    
    // Should show sent message immediately
    await expect(page.getByText('Hi! I have a question about the pickup time.')).toBeVisible();
    
    // Should show typing indicator when other user is typing
    await expect(page.getByText('typing...')).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure for API calls
    await page.route('/api/**', route => route.abort());
    
    await page.goto('/');
    
    // Should still show basic layout
    await expect(page.getByRole('link', { name: 'GearShare' })).toBeVisible();
    
    // Should show error message for failed data loading
    await expect(page.getByText('Unable to load gear')).toBeVisible();
    await expect(page.getByText('Please try again')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Clear session/cookies to simulate expiration
    await page.context().clearCookies();
    
    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByText('Please log in to continue')).toBeVisible();
  });

  test('should validate form inputs properly', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    
    // Try invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
    
    // Try weak password
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });
});
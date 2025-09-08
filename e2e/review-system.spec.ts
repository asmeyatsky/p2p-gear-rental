import { test, expect } from '@playwright/test';

test.describe('Review System Flow', () => {
  let renterEmail: string;
  let ownerEmail: string;

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now();
    renterEmail = `renter-${timestamp}@example.com`;
    ownerEmail = `owner-${timestamp}@example.com`;
  });

  test('should complete full review cycle for both parties', async ({ page }) => {
    // Setup: Create completed rental (abbreviated setup)
    await page.goto('/test-setup/completed-rental');
    
    // Login as renter to leave review for owner
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', renterEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to completed rentals
    await page.getByRole('link', { name: 'My Rentals' }).click();
    await page.click('[data-testid="rental-tab-completed"]');
    
    // Find completed rental and write review
    await page.click('button:has-text("Write Review")');
    await expect(page).toHaveURL(/\/rentals\/[a-zA-Z0-9]+\/review/);
    
    // Should show review form with rental details
    await expect(page.getByText('Review Your Experience')).toBeVisible();
    await expect(page.getByText('Rate the gear owner')).toBeVisible();
    await expect(page.getByText('Rate the gear condition')).toBeVisible();
    
    // Fill owner review
    await page.click('[data-testid="owner-rating-5"]'); // 5 stars for owner
    await page.click('[data-testid="gear-rating-4"]'); // 4 stars for gear
    await page.fill('textarea[name="ownerComment"]', 'Excellent owner! Very responsive and helpful. The gear was exactly as described and in perfect condition. Highly recommend!');
    await page.fill('textarea[name="gearComment"]', 'Great camera, worked perfectly for my shoot. Well maintained and all accessories included.');
    
    // Submit review
    await page.click('button[type="submit"]:has-text("Submit Review")');
    await expect(page.getByText('Review submitted successfully')).toBeVisible();
    
    // Should redirect back to rentals page
    await expect(page).toHaveURL('/my-rentals');
    await expect(page.getByText('Review Submitted')).toBeVisible();
    
    // Log out as renter
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByText('Log Out').click();
    
    // Login as owner to leave review for renter
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to dashboard to see completed rentals
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.click('[data-testid="completed-rentals-section"]');
    await page.click('button:has-text("Review Renter")');
    
    // Fill renter review
    await page.click('[data-testid="renter-rating-5"]'); // 5 stars for renter
    await page.fill('textarea[name="renterComment"]', 'Fantastic renter! Very careful with my equipment and returned it in perfect condition. Great communication throughout the rental period.');
    
    await page.click('button[type="submit"]:has-text("Submit Review")');
    await expect(page.getByText('Review submitted successfully')).toBeVisible();
    
    // Verify both reviews are visible
    // Go to gear page to see owner review
    await page.goto('/gear/test-gear-id');
    await expect(page.getByText('Excellent owner!')).toBeVisible();
    await expect(page.getByText('5.0')).toBeVisible(); // Average rating
    
    // Go to renter profile to see their review
    await page.goto('/profile/renter-id');
    await expect(page.getByText('Fantastic renter!')).toBeVisible();
    await expect(page.getByText('5.0')).toBeVisible(); // Renter rating
  });

  test('should display review summary and statistics correctly', async ({ page }) => {
    // Go to a user profile with existing reviews
    await page.goto('/profile/established-user-id');
    
    // Should show review summary
    await expect(page.getByText('Reviews')).toBeVisible();
    await expect(page.getByText('Average Rating')).toBeVisible();
    await expect(page.getByText('4.8')).toBeVisible(); // Example rating
    await expect(page.getByText('24 reviews')).toBeVisible();
    
    // Should show rating breakdown
    await expect(page.getByText('5 stars')).toBeVisible();
    await expect(page.getByText('4 stars')).toBeVisible();
    await expect(page.getByText('3 stars')).toBeVisible();
    
    // Should show rating distribution bars
    await expect(page.locator('[data-testid="rating-bar-5"]')).toBeVisible();
    await expect(page.locator('[data-testid="rating-bar-4"]')).toBeVisible();
    
    // Should show recent reviews
    await expect(page.getByText('Recent Reviews')).toBeVisible();
    await expect(page.locator('[data-testid="review-card"]')).toBeVisible();
    
    // Review cards should contain required info
    await expect(page.getByText('★★★★★')).toBeVisible(); // Star display
    await expect(page.getByText(/ago/)).toBeVisible(); // Time ago
    await expect(page.getByText('Verified Rental')).toBeVisible(); // Verification badge
  });

  test('should handle review pagination and filtering', async ({ page }) => {
    // Go to profile with many reviews
    await page.goto('/profile/popular-user-id');
    
    // Should show review filters
    await expect(page.getByText('Filter Reviews')).toBeVisible();
    await expect(page.locator('select[name="rating"]')).toBeVisible();
    await expect(page.locator('select[name="sortBy"]')).toBeVisible();
    
    // Test rating filter
    await page.selectOption('select[name="rating"]', '5');
    await page.click('button:has-text("Apply Filter")');
    
    // Should show only 5-star reviews
    await expect(page.getByText('★★★★★')).toBeVisible();
    await expect(page.getByText('★★★★☆')).not.toBeVisible();
    
    // Test sorting
    await page.selectOption('select[name="sortBy"]', 'oldest');
    await page.click('button:has-text("Apply Filter")');
    
    // Should reorder reviews
    await expect(page.getByText('Showing oldest first')).toBeVisible();
    
    // Test pagination
    if (await page.locator('button:has-text("Load More")').isVisible()) {
      await page.click('button:has-text("Load More")');
      await expect(page.getByText('Loading more reviews...')).toBeVisible();
      // Should load additional reviews
      const reviewCount = await page.locator('[data-testid="review-card"]').count();
      expect(reviewCount).toBeGreaterThan(10);
    }
  });

  test('should prevent duplicate and invalid reviews', async ({ page }) => {
    // Setup: User who already submitted a review
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'reviewer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Try to review same rental again
    await page.goto('/rentals/already-reviewed-rental/review');
    
    // Should show message that review already exists
    await expect(page.getByText('You have already reviewed this rental')).toBeVisible();
    await expect(page.getByText('Edit Review')).toBeVisible();
    await expect(page.getByText('Delete Review')).toBeVisible();
    
    // Try to access review page for active rental
    await page.goto('/rentals/active-rental-id/review');
    
    // Should show error or redirect
    await expect(page.getByText('Reviews can only be submitted after rental completion')).toBeVisible();
    
    // Try to review own gear
    await page.goto('/rentals/own-gear-rental/review');
    await expect(page.getByText('You cannot review your own gear')).toBeVisible();
  });

  test('should handle review editing and deletion', async ({ page }) => {
    // Login and go to existing review
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'reviewer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/my-rentals');
    await page.click('[data-testid="rental-tab-completed"]');
    await page.click('button:has-text("Edit Review")');
    
    // Should show pre-filled form
    await expect(page.getByText('Edit Your Review')).toBeVisible();
    await expect(page.locator('textarea[name="ownerComment"]')).toHaveValue();
    
    // Update review
    await page.click('[data-testid="owner-rating-4"]'); // Change from 5 to 4 stars
    await page.fill('textarea[name="ownerComment"]', 'Updated review: Good experience overall, though pickup was slightly delayed.');
    
    await page.click('button[type="submit"]:has-text("Update Review")');
    await expect(page.getByText('Review updated successfully')).toBeVisible();
    
    // Verify changes are reflected
    await page.goto('/gear/reviewed-gear-id');
    await expect(page.getByText('Updated review')).toBeVisible();
    await expect(page.getByText('4.0')).toBeVisible(); // Updated rating
    
    // Test review deletion
    await page.goto('/my-rentals');
    await page.click('button:has-text("Delete Review")');
    
    // Should show confirmation
    await expect(page.getByText('Are you sure you want to delete this review?')).toBeVisible();
    await expect(page.getByText('This action cannot be undone')).toBeVisible();
    
    await page.click('button:has-text("Confirm Delete")');
    await expect(page.getByText('Review deleted successfully')).toBeVisible();
    
    // Verify review is removed
    await page.goto('/gear/reviewed-gear-id');
    await expect(page.getByText('Updated review')).not.toBeVisible();
  });

  test('should display review response and interaction features', async ({ page }) => {
    // Go to gear page with reviews
    await page.goto('/gear/popular-gear-id');
    
    // Should show review responses
    await expect(page.getByText('Response from owner')).toBeVisible();
    await expect(page.getByText('Thank you for the great review!')).toBeVisible();
    
    // Test helpful voting (if logged in)
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/gear/popular-gear-id');
    
    // Vote on review helpfulness
    await page.click('[data-testid="helpful-yes"]:first-child');
    await expect(page.getByText('Thanks for your feedback')).toBeVisible();
    
    // Should show updated count
    await expect(page.getByText('1 person found this helpful')).toBeVisible();
    
    // Test review reporting
    await page.click('[data-testid="review-options"]:first-child');
    await page.getByText('Report Review').click();
    
    await page.selectOption('select[name="reportReason"]', 'inappropriate');
    await page.fill('textarea[name="details"]', 'Contains inappropriate language');
    await page.click('button[type="submit"]:has-text("Submit Report")');
    
    await expect(page.getByText('Review reported successfully')).toBeVisible();
  });

  test('should handle review moderation and admin actions', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@gearshare.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Go to admin moderation panel
    await page.goto('/admin/reviews');
    
    // Should show flagged reviews
    await expect(page.getByText('Review Moderation')).toBeVisible();
    await expect(page.getByText('Flagged Reviews')).toBeVisible();
    await expect(page.getByText('Recent Reports')).toBeVisible();
    
    // Review flagged content
    await page.click('[data-testid="flagged-review"]:first-child');
    
    // Should show review details and moderation options
    await expect(page.getByText('Review Details')).toBeVisible();
    await expect(page.getByText('Flagging Reason')).toBeVisible();
    await expect(page.getByText('Reporter Information')).toBeVisible();
    
    // Take moderation action
    await page.click('button:has-text("Remove Review")');
    await page.fill('textarea[name="reason"]', 'Violates community guidelines - inappropriate language');
    await page.click('button:has-text("Confirm Removal")');
    
    await expect(page.getByText('Review removed successfully')).toBeVisible();
    
    // Test warning user
    await page.click('[data-testid="flagged-review"]:first-child');
    await page.click('button:has-text("Warn User")');
    await page.fill('textarea[name="warning"]', 'Please keep reviews professional and constructive');
    await page.click('button:has-text("Send Warning")');
    
    await expect(page.getByText('Warning sent to user')).toBeVisible();
  });

  test('should calculate and display accurate rating statistics', async ({ page }) => {
    // Go to gear with multiple reviews
    await page.goto('/gear/multi-review-gear');
    
    // Should show accurate average rating
    await expect(page.getByText('4.2')).toBeVisible(); // Example average
    await expect(page.getByText('Based on 15 reviews')).toBeVisible();
    
    // Should show rating breakdown
    await expect(page.getByText('5 stars: 8 reviews')).toBeVisible();
    await expect(page.getByText('4 stars: 4 reviews')).toBeVisible();
    await expect(page.getByText('3 stars: 2 reviews')).toBeVisible();
    await expect(page.getByText('2 stars: 1 review')).toBeVisible();
    await expect(page.getByText('1 star: 0 reviews')).toBeVisible();
    
    // Go to user profile
    await page.goto('/profile/multi-review-user');
    
    // Should show combined ratings across all interactions
    await expect(page.getByText('Overall Rating: 4.5')).toBeVisible();
    await expect(page.getByText('As Owner: 4.8')).toBeVisible();
    await expect(page.getByText('As Renter: 4.2')).toBeVisible();
    await expect(page.getByText('Total Reviews: 28')).toBeVisible();
    
    // Should show response rate and other metrics
    await expect(page.getByText('Response Rate: 98%')).toBeVisible();
    await expect(page.getByText('Average Response Time: 2 hours')).toBeVisible();
  });

  test('should handle review photos and rich content', async ({ page }) => {
    // Setup completed rental and go to review page
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'renter@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/rentals/photo-review-rental/review');
    
    // Should allow photo uploads
    await expect(page.getByText('Add Photos')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Upload review photos
    await page.setInputFiles('input[type="file"]', [
      'test-files/review-photo1.jpg',
      'test-files/review-photo2.jpg'
    ]);
    
    await expect(page.getByText('2 photos selected')).toBeVisible();
    
    // Fill review with rich content
    await page.click('[data-testid="owner-rating-5"]');
    await page.fill('textarea[name="ownerComment"]', 'Amazing experience! The Canon EOS R5 performed flawlessly during my wedding shoot. See photos of the results below.');
    
    await page.click('button[type="submit"]:has-text("Submit Review")');
    await expect(page.getByText('Review with photos submitted successfully')).toBeVisible();
    
    // Verify photos are visible in review
    await page.goto('/gear/photo-reviewed-gear');
    await expect(page.locator('[data-testid="review-photo"]')).toBeVisible();
    await expect(page.getByText('2 photos')).toBeVisible();
    
    // Test photo lightbox
    await page.click('[data-testid="review-photo"]:first-child');
    await expect(page.locator('[data-testid="photo-lightbox"]')).toBeVisible();
    await expect(page.getByText('Photo 1 of 2')).toBeVisible();
    
    // Navigate photos in lightbox
    await page.click('[data-testid="next-photo"]');
    await expect(page.getByText('Photo 2 of 2')).toBeVisible();
    
    await page.press('body', 'Escape');
    await expect(page.locator('[data-testid="photo-lightbox"]')).not.toBeVisible();
  });
});

test.describe('Review System Edge Cases', () => {
  test('should handle review system with no reviews gracefully', async ({ page }) => {
    // Go to new user profile with no reviews
    await page.goto('/profile/new-user-id');
    
    // Should show empty state
    await expect(page.getByText('No reviews yet')).toBeVisible();
    await expect(page.getByText('This user is new to the platform')).toBeVisible();
    await expect(page.getByText('Be the first to leave a review')).toBeVisible();
    
    // Should not show rating if no reviews
    await expect(page.getByText('No rating')).toBeVisible();
    await expect(page.locator('[data-testid="star-display"]')).not.toBeVisible();
  });

  test('should handle review submission errors gracefully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'renter@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/rentals/test-rental-id/review');
    
    // Try to submit without rating
    await page.fill('textarea[name="ownerComment"]', 'Great owner!');
    await page.click('button[type="submit"]:has-text("Submit Review")');
    
    // Should show validation error
    await expect(page.getByText('Please provide a rating')).toBeVisible();
    
    // Try to submit with too long comment
    const longComment = 'a'.repeat(2001); // Exceeds character limit
    await page.click('[data-testid="owner-rating-5"]');
    await page.fill('textarea[name="ownerComment"]', longComment);
    await page.click('button[type="submit"]:has-text("Submit Review")');
    
    await expect(page.getByText('Comment is too long')).toBeVisible();
    
    // Test network error handling
    await page.route('/api/reviews', route => route.abort());
    
    await page.fill('textarea[name="ownerComment"]', 'Valid comment');
    await page.click('button[type="submit"]:has-text("Submit Review")');
    
    await expect(page.getByText('Unable to submit review')).toBeVisible();
    await expect(page.getByText('Please try again')).toBeVisible();
  });

  test('should handle review loading states and skeleton UI', async ({ page }) => {
    // Slow down network to see loading states
    await page.route('/api/reviews**', route => 
      setTimeout(() => route.continue(), 2000)
    );
    
    await page.goto('/gear/popular-gear-id');
    
    // Should show review loading skeletons
    await expect(page.getByText('Loading reviews...')).toBeVisible();
    await expect(page.locator('[data-testid="review-skeleton"]')).toBeVisible();
    
    // Should show actual reviews after loading
    await expect(page.getByText('Loading reviews...')).not.toBeVisible();
    await expect(page.locator('[data-testid="review-card"]')).toBeVisible();
  });

  test('should handle review sorting and filtering edge cases', async ({ page }) => {
    await page.goto('/profile/user-with-mixed-reviews');
    
    // Test edge case: filter by rating that doesn't exist
    await page.selectOption('select[name="rating"]', '1'); // No 1-star reviews
    await page.click('button:has-text("Apply Filter")');
    
    await expect(page.getByText('No reviews match your filter')).toBeVisible();
    await expect(page.getByText('Try adjusting your filters')).toBeVisible();
    
    // Test sorting with tied ratings
    await page.selectOption('select[name="rating"]', 'all');
    await page.selectOption('select[name="sortBy"]', 'rating_high');
    await page.click('button:has-text("Apply Filter")');
    
    // Should handle ties gracefully (by date as secondary sort)
    const firstReviewRating = await page.locator('[data-testid="review-card"]:first-child [data-testid="star-display"]').textContent();
    expect(firstReviewRating).toContain('5');
  });
});
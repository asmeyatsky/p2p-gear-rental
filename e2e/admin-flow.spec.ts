import { test, expect } from '@playwright/test';

test.describe('Admin Panel Flow', () => {
  let adminEmail = 'admin@gearshare.com';
  
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigate to admin panel
    await page.goto('/admin');
  });

  test('should display admin dashboard with key metrics', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    
    // Key metrics should be visible
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Total Gear Listed')).toBeVisible();
    await expect(page.getByText('Active Rentals')).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Pending Disputes')).toBeVisible();
    await expect(page.getByText('Platform Health')).toBeVisible();
    
    // Charts should be visible
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="rental-trends-chart"]')).toBeVisible();
  });

  test('should manage users effectively', async ({ page }) => {
    // Navigate to user management
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/admin/users');
    
    // Should show user list with search and filters
    await expect(page.getByText('User Management')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search users"]')).toBeVisible();
    await expect(page.locator('select[name="userType"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    
    // Test user search
    await page.fill('input[placeholder*="Search users"]', 'john@example.com');
    await page.press('input[placeholder*="Search users"]', 'Enter');
    
    // Should show filtered results
    await expect(page.getByText('john@example.com')).toBeVisible();
    
    // Test user actions
    await page.click('[data-testid="user-actions-dropdown"]:first-child');
    await expect(page.getByText('View Profile')).toBeVisible();
    await expect(page.getByText('Send Message')).toBeVisible();
    await expect(page.getByText('Suspend User')).toBeVisible();
    await expect(page.getByText('Delete User')).toBeVisible();
    
    // Test user suspension
    await page.getByText('Suspend User').click();
    await page.fill('textarea[name="reason"]', 'Violation of community guidelines');
    await page.fill('input[name="duration"]', '7');
    await page.click('button:has-text("Confirm Suspension")');
    
    await expect(page.getByText('User suspended successfully')).toBeVisible();
    await expect(page.getByText('Suspended')).toBeVisible();
  });

  test('should manage gear listings and content moderation', async ({ page }) => {
    await page.getByRole('link', { name: 'Gear' }).click();
    await expect(page).toHaveURL('/admin/gear');
    
    // Should show gear management interface
    await expect(page.getByText('Gear Management')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search gear"]')).toBeVisible();
    
    // Test filtering options
    await page.selectOption('select[name="status"]', 'flagged');
    await page.click('button:has-text("Apply Filters")');
    
    // Should show flagged items
    await expect(page.getByText('Flagged for Review')).toBeVisible();
    
    // Test gear moderation
    await page.click('[data-testid="gear-actions"]:first-child');
    await expect(page.getByText('Approve')).toBeVisible();
    await expect(page.getByText('Remove')).toBeVisible();
    await expect(page.getByText('Request Changes')).toBeVisible();
    
    // Test gear removal
    await page.getByText('Remove').click();
    await page.fill('textarea[name="reason"]', 'Inappropriate content detected');
    await page.click('button:has-text("Confirm Removal")');
    
    await expect(page.getByText('Gear removed successfully')).toBeVisible();
  });

  test('should handle dispute resolution', async ({ page }) => {
    await page.getByRole('link', { name: 'Disputes' }).click();
    await expect(page).toHaveURL('/admin/disputes');
    
    // Should show dispute list
    await expect(page.getByText('Dispute Resolution')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Created')).toBeVisible();
    
    // Filter by high priority disputes
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Filter")');
    
    // View dispute details
    await page.click('[data-testid="dispute-row"]:first-child');
    await expect(page).toHaveURL(/\/admin\/disputes\/[a-zA-Z0-9]+/);
    
    // Should show dispute details
    await expect(page.getByText('Dispute Details')).toBeVisible();
    await expect(page.getByText('Parties Involved')).toBeVisible();
    await expect(page.getByText('Timeline')).toBeVisible();
    await expect(page.getByText('Evidence')).toBeVisible();
    await expect(page.getByText('Messages')).toBeVisible();
    
    // Test resolution actions
    await page.click('button:has-text("Resolve Dispute")');
    await page.selectOption('select[name="resolution"]', 'refund_renter');
    await page.fill('textarea[name="explanation"]', 'Based on evidence provided, issuing full refund to renter. Gear was damaged as described.');
    await page.click('button:has-text("Apply Resolution")');
    
    await expect(page.getByText('Dispute resolved successfully')).toBeVisible();
  });

  test('should manage platform settings and configuration', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/admin/settings');
    
    // General settings
    await expect(page.getByText('Platform Settings')).toBeVisible();
    await expect(page.getByText('General')).toBeVisible();
    await expect(page.getByText('Payments')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    
    // Test updating platform fee
    await page.click('button:has-text("General")');
    await page.fill('input[name="platformFee"]', '5.5');
    await page.fill('input[name="maxRentalDays"]', '365');
    await page.click('button:has-text("Save General Settings")');
    
    await expect(page.getByText('Settings updated successfully')).toBeVisible();
    
    // Test payment settings
    await page.click('button:has-text("Payments")');
    await page.fill('input[name="minimumPayout"]', '25.00');
    await page.selectOption('select[name="payoutSchedule"]', 'weekly');
    await page.click('button:has-text("Save Payment Settings")');
    
    await expect(page.getByText('Payment settings updated')).toBeVisible();
    
    // Test security settings
    await page.click('button:has-text("Security")');
    await page.check('input[name="requireEmailVerification"]');
    await page.check('input[name="enableTwoFactor"]');
    await page.fill('input[name="sessionTimeout"]', '30');
    await page.click('button:has-text("Save Security Settings")');
    
    await expect(page.getByText('Security settings updated')).toBeVisible();
  });

  test('should generate and view reports', async ({ page }) => {
    await page.getByRole('link', { name: 'Reports' }).click();
    await expect(page).toHaveURL('/admin/reports');
    
    // Should show reporting interface
    await expect(page.getByText('Analytics & Reports')).toBeVisible();
    await expect(page.getByText('User Analytics')).toBeVisible();
    await expect(page.getByText('Revenue Reports')).toBeVisible();
    await expect(page.getByText('Platform Health')).toBeVisible();
    
    // Test generating custom report
    await page.click('button:has-text("Generate Custom Report")');
    await page.selectOption('select[name="reportType"]', 'revenue');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.selectOption('select[name="groupBy"]', 'month');
    await page.click('button:has-text("Generate Report")');
    
    // Should show report results
    await expect(page.getByText('Report Generated')).toBeVisible();
    await expect(page.locator('[data-testid="report-chart"]')).toBeVisible();
    await expect(page.getByText('Export CSV')).toBeVisible();
    await expect(page.getByText('Export PDF')).toBeVisible();
    
    // Test export functionality
    await page.click('button:has-text("Export CSV")');
    // In real test, would verify download
    
    // View user growth report
    await page.click('button:has-text("User Growth Report")');
    await expect(page.locator('[data-testid="user-growth-report"]')).toBeVisible();
    await expect(page.getByText('New Users')).toBeVisible();
    await expect(page.getByText('User Retention')).toBeVisible();
    await expect(page.getByText('Active Users')).toBeVisible();
  });

  test('should handle system monitoring and health checks', async ({ page }) => {
    await page.getByRole('link', { name: 'System' }).click();
    await expect(page).toHaveURL('/admin/system');
    
    // Should show system health dashboard
    await expect(page.getByText('System Health')).toBeVisible();
    await expect(page.getByText('Server Status')).toBeVisible();
    await expect(page.getByText('Database')).toBeVisible();
    await expect(page.getByText('Redis Cache')).toBeVisible();
    await expect(page.getByText('External Services')).toBeVisible();
    
    // Check status indicators
    await expect(page.getByText('🟢 Healthy')).toBeVisible();
    await expect(page.locator('[data-testid="response-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="uptime"]')).toBeVisible();
    
    // View error logs
    await page.click('button:has-text("View Error Logs")');
    await expect(page.getByText('System Logs')).toBeVisible();
    await expect(page.locator('select[name="logLevel"]')).toBeVisible();
    await expect(page.locator('input[name="searchLogs"]')).toBeVisible();
    
    // Filter logs by error level
    await page.selectOption('select[name="logLevel"]', 'error');
    await page.click('button:has-text("Filter Logs")');
    
    // Should show filtered error logs
    await expect(page.getByText('ERROR')).toBeVisible();
    
    // Test manual health check
    await page.click('button:has-text("Run Health Check")');
    await expect(page.getByText('Running system health check...')).toBeVisible();
    await expect(page.getByText('Health check completed')).toBeVisible();
  });

  test('should manage automated moderation and security', async ({ page }) => {
    await page.goto('/admin/moderation');
    await expect(page).toHaveURL('/admin/moderation');
    
    // Should show moderation dashboard
    await expect(page.getByText('Content Moderation')).toBeVisible();
    await expect(page.getByText('Auto-flagged Content')).toBeVisible();
    await expect(page.getByText('User Reports')).toBeVisible();
    await expect(page.getByText('Security Alerts')).toBeVisible();
    
    // View auto-flagged content
    await page.click('[data-testid="flagged-content-tab"]');
    await expect(page.getByText('Flagged by AI')).toBeVisible();
    await expect(page.getByText('Confidence Score')).toBeVisible();
    
    // Review flagged item
    await page.click('[data-testid="flagged-item"]:first-child');
    await expect(page.getByText('Review Required')).toBeVisible();
    await expect(page.getByText('AI Detection')).toBeVisible();
    await expect(page.getByText('Approve')).toBeVisible();
    await expect(page.getByText('Remove')).toBeVisible();
    
    // Approve content
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="notes"]', 'Content is appropriate, AI false positive');
    await page.click('button:has-text("Confirm Approval")');
    
    await expect(page.getByText('Content approved')).toBeVisible();
    
    // View security alerts
    await page.click('[data-testid="security-alerts-tab"]');
    await expect(page.getByText('Suspicious Activity')).toBeVisible();
    await expect(page.getByText('Failed Login Attempts')).toBeVisible();
    await expect(page.getByText('Rate Limit Violations')).toBeVisible();
    
    // Investigate security alert
    await page.click('[data-testid="security-alert"]:first-child');
    await expect(page.getByText('Alert Details')).toBeVisible();
    await expect(page.getByText('IP Address')).toBeVisible();
    await expect(page.getByText('User Agent')).toBeVisible();
    await expect(page.getByText('Actions')).toBeVisible();
    
    // Block suspicious IP
    await page.click('button:has-text("Block IP")');
    await page.fill('input[name="blockDuration"]', '24');
    await page.fill('textarea[name="reason"]', 'Multiple failed login attempts from suspicious IP');
    await page.click('button:has-text("Confirm Block")');
    
    await expect(page.getByText('IP address blocked successfully')).toBeVisible();
  });

  test('should handle admin permissions and access control', async ({ page }) => {
    await page.goto('/admin/permissions');
    await expect(page).toHaveURL('/admin/permissions');
    
    // Should show admin management
    await expect(page.getByText('Admin Access Control')).toBeVisible();
    await expect(page.getByText('Admin Users')).toBeVisible();
    await expect(page.getByText('Roles & Permissions')).toBeVisible();
    await expect(page.getByText('Access Logs')).toBeVisible();
    
    // View admin users
    await expect(page.getByText('Super Admin')).toBeVisible();
    await expect(page.getByText('Content Moderator')).toBeVisible();
    await expect(page.getByText('Support Staff')).toBeVisible();
    
    // Create new admin user
    await page.click('button:has-text("Add Admin User")');
    await page.fill('input[name="email"]', 'moderator@gearshare.com');
    await page.fill('input[name="name"]', 'Content Moderator');
    await page.selectOption('select[name="role"]', 'content_moderator');
    await page.click('button:has-text("Create Admin")');
    
    await expect(page.getByText('Admin user created successfully')).toBeVisible();
    
    // View access logs
    await page.click('[data-testid="access-logs-tab"]');
    await expect(page.getByText('Admin Activity Log')).toBeVisible();
    await expect(page.getByText('Action')).toBeVisible();
    await expect(page.getByText('Timestamp')).toBeVisible();
    await expect(page.getByText('IP Address')).toBeVisible();
    
    // Filter access logs
    await page.selectOption('select[name="adminUser"]', adminEmail);
    await page.selectOption('select[name="action"]', 'user_suspension');
    await page.click('button:has-text("Filter Logs")');
    
    // Should show filtered results
    await expect(page.getByText('user_suspension')).toBeVisible();
  });
});

test.describe('Admin Security and Edge Cases', () => {
  test('should prevent unauthorized admin access', async ({ page }) => {
    // Try to access admin panel without login
    await page.goto('/admin');
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByText('Admin access required')).toBeVisible();
    
    // Try to access with regular user account
    await page.fill('input[name="email"]', 'regular@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Access denied')).toBeVisible();
  });

  test('should handle bulk operations safely', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@gearshare.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/admin/users');
    
    // Select multiple users
    await page.check('[data-testid="select-user"]:nth-child(1)');
    await page.check('[data-testid="select-user"]:nth-child(2)');
    await page.check('[data-testid="select-user"]:nth-child(3)');
    
    // Test bulk actions
    await page.selectOption('select[name="bulkAction"]', 'suspend');
    await page.click('button:has-text("Apply to Selected")');
    
    // Should show confirmation dialog
    await expect(page.getByText('Confirm Bulk Action')).toBeVisible();
    await expect(page.getByText('3 users selected')).toBeVisible();
    
    await page.fill('textarea[name="reason"]', 'Bulk suspension for policy violations');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.getByText('3 users suspended successfully')).toBeVisible();
  });

  test('should validate admin actions with confirmation', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@gearshare.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/admin/users');
    
    // Try to delete user
    await page.click('[data-testid="user-actions-dropdown"]:first-child');
    await page.getByText('Delete User').click();
    
    // Should require confirmation
    await expect(page.getByText('Are you sure?')).toBeVisible();
    await expect(page.getByText('This action cannot be undone')).toBeVisible();
    
    // Type confirmation
    await page.fill('input[name="confirmation"]', 'DELETE');
    await page.click('button:has-text("Confirm Deletion")');
    
    await expect(page.getByText('User deleted successfully')).toBeVisible();
  });

  test('should handle system maintenance mode', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@gearshare.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/admin/system');
    
    // Enable maintenance mode
    await page.click('button:has-text("Enable Maintenance Mode")');
    await page.fill('textarea[name="maintenanceMessage"]', 'System maintenance in progress. Please check back in 30 minutes.');
    await page.fill('input[name="estimatedDuration"]', '30');
    await page.click('button:has-text("Enable")');
    
    await expect(page.getByText('Maintenance mode enabled')).toBeVisible();
    
    // Test that regular users see maintenance page
    await page.context().clearCookies();
    await page.goto('/');
    
    await expect(page.getByText('System Maintenance')).toBeVisible();
    await expect(page.getByText('Please check back in 30 minutes')).toBeVisible();
  });
});
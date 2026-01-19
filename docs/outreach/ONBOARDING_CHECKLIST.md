# Store Chain Onboarding Checklist

## Complete Setup Guide for Rental Business Partners

This checklist guides rental store chains through the complete onboarding process, from account creation to receiving your first rental payment.

---

## Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1: Account Setup | 15 minutes | Create account and verify email |
| Phase 2: Profile Setup | 20 minutes | Complete business profile |
| Phase 3: Payment Setup | 10 minutes | Connect Stripe for payments |
| Phase 4: Inventory Upload | 30-60 minutes | Upload equipment via CSV |
| Phase 5: Go Live | 5 minutes | Review and activate listings |

**Total Time: ~1.5 hours for complete setup**

---

## Phase 1: Account Setup

### Step 1.1: Create Your Account

- [ ] Navigate to: `https://[yourdomain]/auth/signup/lister`
- [ ] Enter your business email address
- [ ] Create a strong password (minimum 8 characters)
- [ ] Click **"Sign Up"**

**Password Requirements:**
- Minimum 8 characters
- Recommended: Mix of letters, numbers, and symbols

### Step 1.2: Verify Your Email

- [ ] Check your email inbox for verification email
- [ ] Check spam/junk folder if not in inbox
- [ ] Click the verification link in the email
- [ ] Confirmation page should appear

**Troubleshooting:**
- No email received? Wait 5 minutes and check spam
- Link expired? Request a new verification email from login page

### Step 1.3: First Login

- [ ] Go to: `https://[yourdomain]/auth/login`
- [ ] Enter your email and password
- [ ] Click **"Sign In"**
- [ ] You should see the main dashboard

---

## Phase 2: Profile Setup

### Step 2.1: Access Profile Settings

- [ ] Click on your profile icon (top right)
- [ ] Select **"Profile"** from dropdown
- [ ] Or navigate directly to: `https://[yourdomain]/profile`

### Step 2.2: Complete Business Information

Fill in ALL of the following:

- [ ] **Full Name / Business Name**
  - Enter your business name as you want it displayed
  - Example: "LA Camera Rentals" or "John's Film Equipment"

- [ ] **Bio / Business Description**
  - Write a compelling description (150-500 characters)
  - Include: Years in business, specialties, service area
  - Example: "Professional camera rental house serving the Los Angeles area since 2015. Specializing in cinema cameras, prime lenses, and lighting packages for film productions."

- [ ] **City**
  - Enter your primary business location
  - Example: "Los Angeles"

- [ ] **State**
  - Select or enter your state
  - Example: "CA"

### Step 2.3: Save Profile

- [ ] Review all information for accuracy
- [ ] Click **"Save Changes"** or **"Update Profile"**
- [ ] Confirmation message should appear

---

## Phase 3: Payment Setup (Stripe Connect)

### Step 3.1: Understand the Payment Flow

```
Customer Payment → Platform → Stripe → Your Bank Account
                     ↓
              Platform Fee (10%)
              Stripe Fee (2.9% + $0.30)
```

### Step 3.2: Access Payment Settings

- [ ] From dashboard, click **"Payment Settings"** or **"Connect Stripe"**
- [ ] Or navigate to: `https://[yourdomain]/profile/payments`

### Step 3.3: Connect Stripe Account

**Option A: Create New Stripe Account**

- [ ] Click **"Connect with Stripe"**
- [ ] You'll be redirected to Stripe
- [ ] Select **"Create a new account"**
- [ ] Enter your business information:
  - [ ] Legal business name
  - [ ] Business type (Individual/Company)
  - [ ] Business address
  - [ ] Tax ID / EIN (for businesses) or SSN (for individuals)
  - [ ] Bank account for deposits
- [ ] Complete identity verification
- [ ] Click **"Submit"**
- [ ] You'll be redirected back to the platform

**Option B: Use Existing Stripe Account**

- [ ] Click **"Connect with Stripe"**
- [ ] Log into your existing Stripe account
- [ ] Authorize the connection
- [ ] You'll be redirected back to the platform

### Step 3.4: Verify Stripe Connection

- [ ] Check payment settings page
- [ ] Status should show **"Connected"** or **"Active"**
- [ ] Your payout schedule should be displayed

**Stripe Verification May Require:**
- Government-issued ID
- Business documentation
- Bank account verification (micro-deposits)

*Note: Verification can take 1-3 business days. You can still list equipment while pending.*

---

## Phase 4: Inventory Upload

### Step 4.1: Prepare Your Data

Before uploading, gather the following for EACH item:

- [ ] **Equipment Titles** - Clear, descriptive names
- [ ] **Descriptions** - Detailed item descriptions
- [ ] **Daily Rates** - Price per day
- [ ] **Weekly Rates** (optional) - Price per week
- [ ] **Monthly Rates** (optional) - Price per month
- [ ] **Categories** - cameras, lenses, lighting, audio, support, drones, accessories, studio
- [ ] **Brand and Model** - Manufacturer and model info
- [ ] **Condition** - new, excellent, good, or fair
- [ ] **Replacement Values** - For insurance calculations
- [ ] **Security Deposits** - Deposit amounts
- [ ] **Image URLs** - Links to equipment photos

### Step 4.2: Download CSV Template

- [ ] Navigate to: `https://[yourdomain]/add-gear/bulk`
- [ ] Click **"Download Template"** button
- [ ] Open `gear_template.csv` in Excel or Google Sheets

### Step 4.3: Fill In Your Data

- [ ] Open the downloaded template
- [ ] Enter each equipment item on a new row
- [ ] Follow formatting rules:
  - Numbers: No $ signs or commas (use `150` not `$150`)
  - Booleans: Use `true` or `false` (lowercase)
  - Categories: Use exact values from the list
  - State: Use 2-letter abbreviation

**See BULK_UPLOAD_GUIDE.md for detailed field instructions**

### Step 4.4: Prepare Equipment Images

**Option A: Use Existing URLs**
- [ ] If images are already online, copy the direct URLs
- [ ] Paste URLs into the `imageUrl` column

**Option B: Upload Images First**
- [ ] Upload images to your website or image hosting service
- [ ] Copy the direct image URLs
- [ ] Add URLs to your CSV

**Option C: Add Images Later**
- [ ] Leave `imageUrl` column empty
- [ ] Upload CSV
- [ ] Edit each listing individually to add images

### Step 4.5: Save as CSV

- [ ] File → Save As
- [ ] Select format: **CSV (Comma delimited)**
- [ ] Save the file

### Step 4.6: Upload Your CSV

- [ ] Go to: `https://[yourdomain]/add-gear/bulk`
- [ ] Click **"Choose File"**
- [ ] Select your CSV file
- [ ] Click **"Upload File"**
- [ ] Wait for processing to complete

### Step 4.7: Review Upload Results

**If Successful:**
- [ ] Note the number of items uploaded
- [ ] You'll be redirected to dashboard

**If Errors Occurred:**
- [ ] Review the error details shown
- [ ] Note which rows failed and why
- [ ] Fix errors in your CSV
- [ ] Create new CSV with corrected rows only
- [ ] Re-upload the corrected items

---

## Phase 5: Go Live

### Step 5.1: Review Your Listings

- [ ] Navigate to: `https://[yourdomain]/dashboard`
- [ ] Click on **"My Listings"** or **"My Gear"**
- [ ] Verify all items appear correctly
- [ ] Check at least 3-5 listings for:
  - [ ] Correct title
  - [ ] Accurate description
  - [ ] Correct pricing
  - [ ] Proper category
  - [ ] Image displays correctly (if added)

### Step 5.2: Edit Any Issues

- [ ] Click on any listing to view details
- [ ] Click **"Edit"** to make changes
- [ ] Update any incorrect information
- [ ] Click **"Save"**

### Step 5.3: Set Availability

- [ ] Ensure items are marked as **"Available"**
- [ ] Items not available should be marked **"Unavailable"**
- [ ] You can toggle availability from the dashboard

### Step 5.4: Test the Customer View

- [ ] Open an incognito/private browser window
- [ ] Go to: `https://[yourdomain]`
- [ ] Search for one of your items
- [ ] Verify it appears in search results
- [ ] Click on the listing
- [ ] Verify all details display correctly

---

## Phase 6: Ongoing Operations

### Daily Tasks

- [ ] Check dashboard for new rental requests
- [ ] Respond to requests within 24 hours (approve/decline)
- [ ] Check messages from renters

### Weekly Tasks

- [ ] Review rental calendar
- [ ] Update availability for booked items
- [ ] Process any returns and mark rentals as completed

### Monthly Tasks

- [ ] Review earnings and payout history
- [ ] Update pricing based on demand
- [ ] Add new equipment to inventory
- [ ] Review and respond to customer reviews

---

## Quick Reference URLs

| Page | URL |
|------|-----|
| Login | `/auth/login` |
| Dashboard | `/dashboard` |
| Profile | `/profile` |
| My Rentals | `/my-rentals` |
| Add Single Item | `/add-gear` |
| Bulk Upload | `/add-gear/bulk` |
| Search Listings | `/search` |

---

## Rental Request Workflow

### When You Receive a Request:

```
1. NOTIFICATION
   ↓
   You receive email/notification of new request

2. REVIEW
   ↓
   Log in → Dashboard → Pending Requests
   Review: Customer profile, dates, equipment

3. DECIDE
   ↓
   APPROVE: Customer is charged, rental confirmed
   DECLINE: Customer notified, no charge

4. FULFILL
   ↓
   Coordinate pickup/delivery with customer

5. COMPLETE
   ↓
   Mark rental as returned
   Leave review for customer
```

### Response Time Guidelines

| Response Time | Impact |
|---------------|--------|
| < 1 hour | Excellent - Higher booking rate |
| 1-4 hours | Good - Competitive response |
| 4-24 hours | Acceptable - May lose some bookings |
| > 24 hours | Poor - Customers may cancel |

---

## Troubleshooting

### Can't Log In

1. Verify email address is correct
2. Click "Forgot Password" to reset
3. Check if account is verified
4. Clear browser cache and cookies

### Stripe Not Connected

1. Check payment settings page
2. Look for pending verification requirements
3. Complete any missing Stripe onboarding steps
4. Contact support if stuck

### Listings Not Appearing

1. Verify items are marked as "Available"
2. Check that all required fields are complete
3. Wait 5-10 minutes for search index to update
4. Try clearing browser cache

### Bulk Upload Failing

1. Verify CSV format (not XLSX)
2. Check header row matches template exactly
3. Verify all required fields are filled
4. Check number formatting (no $ or commas)
5. See BULK_UPLOAD_GUIDE.md for details

---

## Support Contact

- **Email:** support@[yourdomain].com
- **Documentation:** `/docs/outreach/`
- **Bulk Upload Guide:** `BULK_UPLOAD_GUIDE.md`
- **Features Overview:** `BUSINESS_FEATURES.md`

---

## Onboarding Completion Checklist

Before considering onboarding complete, verify:

- [ ] Account created and email verified
- [ ] Profile complete with business information
- [ ] Stripe connected and verified
- [ ] At least one listing active
- [ ] Listing appears in search results
- [ ] Understand how to approve/decline requests
- [ ] Know where to check earnings

---

## Congratulations!

Once all items above are checked, you're ready to start receiving rental requests. Your equipment is now visible to customers searching for gear in your area.

**Next Steps:**
1. Share your listing URLs on social media
2. Add more equipment over time
3. Maintain quick response times
4. Build your reputation through great service

---

*Welcome to the platform! We're excited to help grow your rental business.*

*Last Updated: January 2026*

import { test, expect, type Page } from '@playwright/test';

const BASE_PATH = '/gear-staging';

// ─── Stripe helpers ──────────────────────────────────────────────────────────
// Stripe renders each payment / address field inside its own cross-origin
// iframe.  We iterate every iframe on the page and probe for the target
// autocomplete attribute.  Retries handle the fact that iframes load
// asynchronously after the Stripe.js SDK initialises.

async function fillStripeInput(page: Page, autocomplete: string, value: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const total = await page.locator('iframe').count();

    for (let i = 0; i < total; i++) {
      const frame = page.frameLocator('iframe').nth(i);
      try {
        const input = frame.locator(`input[autocomplete="${autocomplete}"]`);
        if (await input.count() > 0) {
          await input.click();
          // pressSequentially fires per-keystroke events that Stripe requires
          await input.pressSequentially(value, { delay: 30 });
          return;
        }
      } catch {
        // iframe not yet loaded or not accessible — continue scanning
      }
    }

    // Give Stripe another tick to finish rendering before the next pass
    await page.waitForTimeout(1_500);
  }

  throw new Error(
    `Stripe input [autocomplete="${autocomplete}"] not found after retries`
  );
}

// ─── Calendar helper ─────────────────────────────────────────────────────────
// AvailabilityCalendar renders each day as a <button> whose text content is
// just the day number.  We scope the search to the modal overlay so we don't
// accidentally match other page elements.

async function clickCalendarDay(page: Page, day: number) {
  const modal = page.locator('.fixed.inset-0');
  const dayBtn = modal
    .locator('button:not([disabled])')
    .filter({ hasText: new RegExp(`^${day}$`) });
  await dayBtn.click();
}

// ─── Main test ────────────────────────────────────────────────────────────────
test.setTimeout(120_000); // payment flows need generous time

test('sign up, request a rental, and complete payment', async ({ page }) => {
  const email = `e2e-pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  // ── 1. Sign up as a renter ──────────────────────────────────────────────
  await page.goto(`${BASE_PATH}/auth/signup`);
  await page.waitForSelector('h2'); // page has rendered

  // Two cards with links: "Sign up as a Renter" / "Sign up as a Lister"
  await page.getByText('Sign up as a Renter').click();
  await expect(page).toHaveURL(/signup\/renter/);

  await page.fill('input[name="name"]', 'E2E Renter');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.getByRole('button', { name: /Create account/ }).click();

  // Supabase signup may take a few seconds; wait for navigation away
  // NOTE: if Supabase email verification is enabled this will hang —
  // disable "Email Confirmations" in the Supabase Auth dashboard for staging.
  await page.waitForURL((url) => !url.includes('signup'), { timeout: 20_000 });

  // ── 2. Browse gear and open a detail page ─────────────────────────────
  await page.goto(`${BASE_PATH}/browse`);
  await page.waitForSelector(`a[href*="/gear/"]`, { timeout: 15_000 });

  await page.locator(`a[href*="/gear/"]`).first().click();
  await expect(page).toHaveURL(/\/gear\/.+/);
  await page.waitForSelector('h1'); // gear title rendered

  // ── 3. Open the rental-request modal ───────────────────────────────────
  // "Request Rental" only shows for gear the current user does NOT own.
  // Seed gear is owned by seed listers, so the button should be visible.
  await page.getByRole('button', { name: 'Request Rental' }).click();
  await expect(page.getByText('Request Rental')).toBeVisible();

  // AvailabilityCalendar fetches /api/gear/{id}/availability, then renders
  // day buttons.  Wait until a full month's worth of day buttons exist.
  await page.waitForFunction(
    () => {
      const btns = document.querySelectorAll('button');
      let count = 0;
      btns.forEach((b) => {
        if (/^\d{1,2}$/.test((b.textContent || '').trim())) count++;
      });
      return count >= 28;
    },
    { timeout: 15_000 }
  );

  // ── 4. Pick start & end dates ───────────────────────────────────────────
  // If today >= 25th we risk wrapping past month-end when adding +2 / +4.
  // Advance the calendar one month and use day 5 & 7 instead.
  const today = new Date();
  let startDay: number;

  if (today.getDate() >= 25) {
    // Next-month chevron is the last <button> inside the calendar header row
    // (.flex.items-center.justify-between.mb-4)
    await page
      .locator('.flex.items-center.justify-between.mb-4')
      .locator('button')
      .last()
      .click();
    await page.waitForTimeout(300);
    startDay = 5;
  } else {
    startDay = today.getDate() + 2;
  }

  const endDay = startDay + 2;

  // First click → start date; second click → end date
  await clickCalendarDay(page, startDay);
  await page.waitForTimeout(400); // React state update
  await clickCalendarDay(page, endDay);
  await page.waitForTimeout(400);

  // Price summary appears once both dates are selected
  await expect(page.getByText(/\d+ days?/)).toBeVisible();
  await expect(page.getByText('Total')).toBeVisible();

  // ── 5. Submit the rental request ────────────────────────────────────────
  // Intercept the POST response so we can extract the rental ID reliably,
  // independent of any client-side navigation quirks.
  const rentalResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/rentals') && r.request().method() === 'POST'
  );

  await page.getByRole('button', { name: /Submit Request/ }).click();

  const rentalResp = await rentalResponsePromise;
  expect(rentalResp.status()).toBe(201);

  const rentalBody = await rentalResp.json();
  const rentalId = rentalBody.rental.id;
  expect(rentalId).toBeTruthy();

  // ── 6. Land on the payment page ─────────────────────────────────────────
  // GearDetailsClient navigates to /rentals/{id} after creation.
  // If that page doesn't contain the payment form, go to confirm-payment.
  await page.waitForURL(/\/rentals\//, { timeout: 10_000 });

  if (!page.url().includes('confirm-payment')) {
    await page.goto(`${BASE_PATH}/rentals/${rentalId}/confirm-payment`);
  }

  // The PaymentForm heading confirms the page is ready
  await page.waitForSelector('text=Complete Payment', { timeout: 15_000 });

  // ── 7. Fill Stripe PaymentElement (Card tab) ──────────────────────────
  // PaymentElement with layout:'tabs' defaults to the Card tab.
  // Wait for at least one Stripe iframe to appear, then give the SDK a
  // moment to finish mounting all field iframes.
  await page.waitForSelector('iframe[src*="stripe.com"]', { timeout: 20_000 });
  await page.waitForTimeout(2_000);

  await fillStripeInput(page, 'cc-number', '4242424242424242');
  await page.waitForTimeout(300);

  // Stripe expiry field expects MMYY with no separator
  await fillStripeInput(page, 'cc-exp', '1225');
  await page.waitForTimeout(300);

  await fillStripeInput(page, 'cc-csc', '123');

  // ── 8. Fill AddressElement (billing address) ──────────────────────────
  // Country defaults to US when allowedCountries: ['US', 'CA'].
  // Fill the remaining required fields.
  await fillStripeInput(page, 'name', 'E2E Renter');
  await page.waitForTimeout(200);

  await fillStripeInput(page, 'address-line1', '100 Market St');
  await page.waitForTimeout(200);

  await fillStripeInput(page, 'address-city', 'San Francisco');
  await page.waitForTimeout(200);

  await fillStripeInput(page, 'postal-code', '94105');
  await page.waitForTimeout(200);

  // US state — Stripe renders it as a searchable input inside an iframe.
  // The autocomplete attribute may be 'address-state' or 'address-level1'
  // depending on the Stripe SDK version; try both.
  try {
    await fillStripeInput(page, 'address-state', 'CA');
  } catch {
    try {
      await fillStripeInput(page, 'address-level1', 'CA');
    } catch {
      // State may be optional or already inferred from postal code
    }
  }

  // ── 9. Submit payment ──────────────────────────────────────────────────
  // Button text is "Pay $X.XX" (amount formatted by Intl.NumberFormat)
  const payButton = page.getByRole('button', { name: /Pay \$/ });
  await expect(payButton).toBeVisible();
  await expect(payButton).toBeEnabled();

  await payButton.click();

  // ── 10. Verify confirmation page ───────────────────────────────────────
  // stripe.confirmPayment() redirects to /rentals/{id}/confirmation on
  // success.  Card 4242… succeeds immediately in Stripe test mode.
  await page.waitForURL(/\/confirmation/, { timeout: 30_000 });

  // Page shows either "Payment Successful" (instant) or "Payment Processing"
  // (rare for test cards, but valid).
  await expect(
    page
      .getByText('Payment Successful')
      .or(page.getByText('Payment Processing'))
  ).toBeVisible({ timeout: 10_000 });
});

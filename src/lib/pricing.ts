/**
 * Pricing utilities for the P2P Gear Rental platform
 *
 * Fee Structure:
 * - Service Fee: 12% of base rental price (platform commission)
 * - Hosting/Tech Fee: $1.50 flat per transaction
 * - Insurance: 5-10% of daily rate (configurable per listing)
 *
 * Formula: Total = Base Price + Insurance + Service Fee + Tech Fee
 */

// Platform fee constants
export const PLATFORM_FEES = {
  SERVICE_FEE_RATE: 0.12,      // 12% service fee
  HOSTING_FEE: 1.50,           // $1.50 flat tech fee per transaction
  DEFAULT_INSURANCE_RATE: 0.10, // 10% default insurance rate
  MIN_INSURANCE_RATE: 0.05,    // 5% minimum insurance rate
  MAX_INSURANCE_RATE: 0.15,    // 15% maximum insurance rate
} as const;

export interface PriceBreakdown {
  basePrice: number;          // Daily rate * number of days
  insuranceAmount: number;    // Insurance premium if applicable
  serviceFee: number;         // Platform service fee
  hostingFee: number;         // Flat technology fee
  totalPrice: number;         // Grand total
  ownerPayout: number;        // Amount owner receives
  platformRevenue: number;    // Amount platform receives
  numberOfDays: number;       // Rental duration
  dailyRate: number;          // Per-day rental rate
}

export interface PricingInput {
  dailyRate: number;
  numberOfDays: number;
  insuranceRequired: boolean;
  insuranceRate?: number;     // Custom insurance rate (defaults to 10%)
}

/**
 * Calculate the complete price breakdown for a rental
 */
export function calculatePriceBreakdown(input: PricingInput): PriceBreakdown {
  const {
    dailyRate,
    numberOfDays,
    insuranceRequired,
    insuranceRate = PLATFORM_FEES.DEFAULT_INSURANCE_RATE,
  } = input;

  // Validate inputs
  if (dailyRate < 0 || numberOfDays < 1) {
    throw new Error('Invalid pricing inputs');
  }

  // Clamp insurance rate to valid range
  const effectiveInsuranceRate = Math.max(
    PLATFORM_FEES.MIN_INSURANCE_RATE,
    Math.min(PLATFORM_FEES.MAX_INSURANCE_RATE, insuranceRate)
  );

  // Calculate base price
  const basePrice = roundToTwoDecimals(dailyRate * numberOfDays);

  // Calculate insurance (only if required by owner)
  const insuranceAmount = insuranceRequired
    ? roundToTwoDecimals(basePrice * effectiveInsuranceRate)
    : 0;

  // Calculate service fee (percentage of base price)
  const serviceFee = roundToTwoDecimals(basePrice * PLATFORM_FEES.SERVICE_FEE_RATE);

  // Flat hosting fee
  const hostingFee = PLATFORM_FEES.HOSTING_FEE;

  // Calculate total
  const totalPrice = roundToTwoDecimals(
    basePrice + insuranceAmount + serviceFee + hostingFee
  );

  // Owner receives base price + insurance (minus any external insurance costs)
  // For now, owner gets base price + insurance amount
  const ownerPayout = roundToTwoDecimals(basePrice + insuranceAmount);

  // Platform receives service fee + hosting fee
  const platformRevenue = roundToTwoDecimals(serviceFee + hostingFee);

  return {
    basePrice,
    insuranceAmount,
    serviceFee,
    hostingFee,
    totalPrice,
    ownerPayout,
    platformRevenue,
    numberOfDays,
    dailyRate,
  };
}

/**
 * Calculate the number of days between two dates
 */
export function calculateNumberOfDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Minimum 1 day rental
  return Math.max(1, diffDays);
}

/**
 * Get the best rate based on rental duration
 * Uses weekly/monthly rates if available and duration qualifies
 */
export function getBestDailyRate(
  dailyRate: number,
  weeklyRate: number | null | undefined,
  monthlyRate: number | null | undefined,
  numberOfDays: number
): number {
  let bestRate = dailyRate;

  // Check if monthly rate applies (30+ days)
  if (monthlyRate && numberOfDays >= 30) {
    const monthlyDailyEquivalent = monthlyRate / 30;
    if (monthlyDailyEquivalent < bestRate) {
      bestRate = monthlyDailyEquivalent;
    }
  }

  // Check if weekly rate applies (7+ days)
  if (weeklyRate && numberOfDays >= 7) {
    const weeklyDailyEquivalent = weeklyRate / 7;
    if (weeklyDailyEquivalent < bestRate) {
      bestRate = weeklyDailyEquivalent;
    }
  }

  return roundToTwoDecimals(bestRate);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Round to two decimal places (for currency)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return roundToTwoDecimals(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is within a given radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  targetLat: number,
  targetLon: number,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, targetLat, targetLon);
  return distance <= radiusMiles;
}

/**
 * Validate insurance rate is within acceptable range
 */
export function validateInsuranceRate(rate: number): boolean {
  return rate >= PLATFORM_FEES.MIN_INSURANCE_RATE && rate <= PLATFORM_FEES.MAX_INSURANCE_RATE;
}

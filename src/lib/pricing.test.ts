import { describe, test, expect } from '@jest/globals';
import {
  calculatePriceBreakdown,
  calculateNumberOfDays,
  getBestDailyRate,
  calculateDistance,
  isWithinRadius,
  validateInsuranceRate,
  formatPrice,
  PLATFORM_FEES,
} from './pricing';

describe('Pricing Utilities', () => {
  describe('PLATFORM_FEES constants', () => {
    test('has correct service fee rate', () => {
      expect(PLATFORM_FEES.SERVICE_FEE_RATE).toBe(0.12);
    });

    test('has correct hosting fee', () => {
      expect(PLATFORM_FEES.HOSTING_FEE).toBe(1.50);
    });

    test('has correct default insurance rate', () => {
      expect(PLATFORM_FEES.DEFAULT_INSURANCE_RATE).toBe(0.10);
    });

    test('has correct insurance rate range', () => {
      expect(PLATFORM_FEES.MIN_INSURANCE_RATE).toBe(0.05);
      expect(PLATFORM_FEES.MAX_INSURANCE_RATE).toBe(0.15);
    });
  });

  describe('calculatePriceBreakdown', () => {
    test('calculates correct breakdown for basic rental without insurance', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 100,
        numberOfDays: 3,
        insuranceRequired: false,
      });

      expect(result.basePrice).toBe(300); // 100 * 3
      expect(result.insuranceAmount).toBe(0);
      expect(result.serviceFee).toBe(36); // 300 * 0.12
      expect(result.hostingFee).toBe(1.50);
      expect(result.totalPrice).toBe(337.50); // 300 + 0 + 36 + 1.50
      expect(result.ownerPayout).toBe(300); // base price only
      expect(result.platformRevenue).toBe(37.50); // 36 + 1.50
      expect(result.numberOfDays).toBe(3);
      expect(result.dailyRate).toBe(100);
    });

    test('calculates correct breakdown with insurance', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 100,
        numberOfDays: 3,
        insuranceRequired: true,
        insuranceRate: 0.10,
      });

      expect(result.basePrice).toBe(300);
      expect(result.insuranceAmount).toBe(30); // 300 * 0.10
      expect(result.serviceFee).toBe(36);
      expect(result.hostingFee).toBe(1.50);
      expect(result.totalPrice).toBe(367.50); // 300 + 30 + 36 + 1.50
      expect(result.ownerPayout).toBe(330); // 300 + 30
      expect(result.platformRevenue).toBe(37.50);
    });

    test('uses default insurance rate when not specified', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 100,
        numberOfDays: 1,
        insuranceRequired: true,
      });

      expect(result.insuranceAmount).toBe(10); // 100 * 0.10 (default)
    });

    test('clamps insurance rate to minimum', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 100,
        numberOfDays: 1,
        insuranceRequired: true,
        insuranceRate: 0.01, // Below minimum
      });

      expect(result.insuranceAmount).toBe(5); // 100 * 0.05 (minimum)
    });

    test('clamps insurance rate to maximum', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 100,
        numberOfDays: 1,
        insuranceRequired: true,
        insuranceRate: 0.25, // Above maximum
      });

      expect(result.insuranceAmount).toBe(15); // 100 * 0.15 (maximum)
    });

    test('handles single day rental', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 50,
        numberOfDays: 1,
        insuranceRequired: false,
      });

      expect(result.basePrice).toBe(50);
      expect(result.serviceFee).toBe(6); // 50 * 0.12
      expect(result.totalPrice).toBe(57.50); // 50 + 6 + 1.50
    });

    test('handles long duration rental', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 75,
        numberOfDays: 30,
        insuranceRequired: true,
        insuranceRate: 0.08,
      });

      expect(result.basePrice).toBe(2250); // 75 * 30
      expect(result.insuranceAmount).toBe(180); // 2250 * 0.08
      expect(result.serviceFee).toBe(270); // 2250 * 0.12
      expect(result.totalPrice).toBe(2701.50); // 2250 + 180 + 270 + 1.50
    });

    test('rounds all amounts to two decimal places', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 33.33,
        numberOfDays: 3,
        insuranceRequired: true,
        insuranceRate: 0.07,
      });

      // Check all values are rounded to 2 decimal places
      expect(Number(result.basePrice.toFixed(2))).toBe(result.basePrice);
      expect(Number(result.insuranceAmount.toFixed(2))).toBe(result.insuranceAmount);
      expect(Number(result.serviceFee.toFixed(2))).toBe(result.serviceFee);
      expect(Number(result.totalPrice.toFixed(2))).toBe(result.totalPrice);
    });

    test('throws error for negative daily rate', () => {
      expect(() =>
        calculatePriceBreakdown({
          dailyRate: -100,
          numberOfDays: 3,
          insuranceRequired: false,
        })
      ).toThrow('Invalid pricing inputs');
    });

    test('throws error for zero days', () => {
      expect(() =>
        calculatePriceBreakdown({
          dailyRate: 100,
          numberOfDays: 0,
          insuranceRequired: false,
        })
      ).toThrow('Invalid pricing inputs');
    });

    test('handles zero daily rate', () => {
      const result = calculatePriceBreakdown({
        dailyRate: 0,
        numberOfDays: 3,
        insuranceRequired: false,
      });

      expect(result.basePrice).toBe(0);
      expect(result.serviceFee).toBe(0);
      expect(result.totalPrice).toBe(1.50); // Only hosting fee
    });
  });

  describe('calculateNumberOfDays', () => {
    test('calculates days correctly for multi-day rentals', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      expect(calculateNumberOfDays(start, end)).toBe(4);
    });

    test('returns 1 for same-day rental', () => {
      const date = new Date('2024-01-01');
      expect(calculateNumberOfDays(date, date)).toBe(1);
    });

    test('handles dates across months', () => {
      const start = new Date('2024-01-30');
      const end = new Date('2024-02-02');
      expect(calculateNumberOfDays(start, end)).toBe(3);
    });

    test('handles dates across years', () => {
      const start = new Date('2023-12-30');
      const end = new Date('2024-01-02');
      expect(calculateNumberOfDays(start, end)).toBe(3);
    });

    test('ignores time component', () => {
      const start = new Date('2024-01-01T23:59:59');
      const end = new Date('2024-01-03T00:00:01');
      expect(calculateNumberOfDays(start, end)).toBe(2);
    });

    test('returns 1 for end date before start date', () => {
      const start = new Date('2024-01-05');
      const end = new Date('2024-01-01');
      expect(calculateNumberOfDays(start, end)).toBe(1); // Minimum 1 day
    });
  });

  describe('getBestDailyRate', () => {
    test('returns daily rate for short rentals', () => {
      expect(getBestDailyRate(100, 600, 2000, 3)).toBe(100);
    });

    test('returns weekly rate equivalent for 7+ day rentals', () => {
      // Weekly: 600/7 = 85.71, which is better than 100
      expect(getBestDailyRate(100, 600, 2000, 7)).toBe(85.71);
    });

    test('returns monthly rate equivalent for 30+ day rentals', () => {
      // Monthly: 2000/30 = 66.67, which is better than weekly 600/7 = 85.71
      expect(getBestDailyRate(100, 600, 2000, 30)).toBe(66.67);
    });

    test('returns daily rate when weekly rate is not better', () => {
      // Weekly: 700/7 = 100, same as daily
      expect(getBestDailyRate(100, 700, 3000, 7)).toBe(100);
    });

    test('returns weekly rate when monthly rate is not better', () => {
      // Monthly: 3000/30 = 100, Weekly: 600/7 = 85.71
      expect(getBestDailyRate(100, 600, 3000, 30)).toBe(85.71);
    });

    test('handles null weekly rate', () => {
      expect(getBestDailyRate(100, null, 2000, 7)).toBe(100);
      expect(getBestDailyRate(100, null, 2000, 30)).toBe(66.67);
    });

    test('handles null monthly rate', () => {
      expect(getBestDailyRate(100, 600, null, 30)).toBe(85.71);
    });

    test('handles both null rates', () => {
      expect(getBestDailyRate(100, null, null, 30)).toBe(100);
    });

    test('handles undefined rates', () => {
      expect(getBestDailyRate(100, undefined, undefined, 30)).toBe(100);
    });
  });

  describe('calculateDistance (Haversine)', () => {
    test('calculates distance between two points', () => {
      // San Francisco to Los Angeles (~350 miles)
      const sf = { lat: 37.7749, lon: -122.4194 };
      const la = { lat: 34.0522, lon: -118.2437 };
      const distance = calculateDistance(sf.lat, sf.lon, la.lat, la.lon);

      expect(distance).toBeGreaterThan(340);
      expect(distance).toBeLessThan(360);
    });

    test('returns 0 for same coordinates', () => {
      expect(calculateDistance(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);
    });

    test('calculates short distances accurately', () => {
      // Two points about 1 mile apart in San Francisco
      const point1 = { lat: 37.7749, lon: -122.4194 };
      const point2 = { lat: 37.7895, lon: -122.4194 };
      const distance = calculateDistance(point1.lat, point1.lon, point2.lat, point2.lon);

      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });

    test('is symmetric', () => {
      const point1 = { lat: 40.7128, lon: -74.0060 }; // NYC
      const point2 = { lat: 51.5074, lon: -0.1278 }; // London

      const distance1 = calculateDistance(point1.lat, point1.lon, point2.lat, point2.lon);
      const distance2 = calculateDistance(point2.lat, point2.lon, point1.lat, point1.lon);

      expect(distance1).toBe(distance2);
    });

    test('handles extreme coordinates', () => {
      // North Pole to South Pole (~12,430 miles)
      const distance = calculateDistance(90, 0, -90, 0);
      expect(distance).toBeGreaterThan(12400);
      expect(distance).toBeLessThan(12500);
    });
  });

  describe('isWithinRadius', () => {
    const sf = { lat: 37.7749, lon: -122.4194 };
    const oakland = { lat: 37.8044, lon: -122.2712 }; // ~10 miles from SF
    const la = { lat: 34.0522, lon: -118.2437 }; // ~350 miles from SF

    test('returns true when point is within radius', () => {
      expect(isWithinRadius(sf.lat, sf.lon, oakland.lat, oakland.lon, 20)).toBe(true);
    });

    test('returns false when point is outside radius', () => {
      expect(isWithinRadius(sf.lat, sf.lon, la.lat, la.lon, 100)).toBe(false);
    });

    test('returns true when point is at center', () => {
      expect(isWithinRadius(sf.lat, sf.lon, sf.lat, sf.lon, 1)).toBe(true);
    });

    test('handles edge case at exact radius', () => {
      // Oakland is about 10 miles from SF
      expect(isWithinRadius(sf.lat, sf.lon, oakland.lat, oakland.lon, 10)).toBe(true);
    });
  });

  describe('validateInsuranceRate', () => {
    test('accepts valid rates', () => {
      expect(validateInsuranceRate(0.05)).toBe(true);
      expect(validateInsuranceRate(0.10)).toBe(true);
      expect(validateInsuranceRate(0.15)).toBe(true);
      expect(validateInsuranceRate(0.08)).toBe(true);
    });

    test('rejects rates below minimum', () => {
      expect(validateInsuranceRate(0.04)).toBe(false);
      expect(validateInsuranceRate(0.01)).toBe(false);
      expect(validateInsuranceRate(0)).toBe(false);
    });

    test('rejects rates above maximum', () => {
      expect(validateInsuranceRate(0.16)).toBe(false);
      expect(validateInsuranceRate(0.20)).toBe(false);
      expect(validateInsuranceRate(1)).toBe(false);
    });

    test('rejects negative rates', () => {
      expect(validateInsuranceRate(-0.10)).toBe(false);
    });
  });

  describe('formatPrice', () => {
    test('formats whole numbers', () => {
      expect(formatPrice(100)).toBe('$100.00');
      expect(formatPrice(1000)).toBe('$1,000.00');
    });

    test('formats decimal amounts', () => {
      expect(formatPrice(99.99)).toBe('$99.99');
      expect(formatPrice(123.45)).toBe('$123.45');
    });

    test('formats zero', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    test('rounds to two decimal places', () => {
      expect(formatPrice(99.999)).toBe('$100.00');
      expect(formatPrice(99.994)).toBe('$99.99');
    });

    test('handles large numbers', () => {
      expect(formatPrice(10000)).toBe('$10,000.00');
      expect(formatPrice(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('Integration: Full pricing scenario', () => {
    test('calculates realistic rental scenario', () => {
      // Scenario: Renting a $150/day camera for a week with insurance
      const dailyRate = 150;
      const weeklyRate = 900; // Discount for week
      const monthlyRate = 3000;
      const numberOfDays = 7;

      // Get best rate
      const bestRate = getBestDailyRate(dailyRate, weeklyRate, monthlyRate, numberOfDays);
      expect(bestRate).toBe(128.57); // 900/7

      // Calculate full breakdown
      const breakdown = calculatePriceBreakdown({
        dailyRate: bestRate,
        numberOfDays,
        insuranceRequired: true,
        insuranceRate: 0.10,
      });

      // Verify breakdown
      expect(breakdown.basePrice).toBe(899.99); // 128.57 * 7
      expect(breakdown.insuranceAmount).toBe(90); // 899.99 * 0.10
      expect(breakdown.serviceFee).toBe(108); // 899.99 * 0.12
      expect(breakdown.hostingFee).toBe(1.50);
      expect(breakdown.totalPrice).toBe(1099.49);
      expect(breakdown.platformRevenue).toBe(109.50); // 108 + 1.50
    });
  });
});

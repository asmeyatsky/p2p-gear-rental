/**
 * Tests for AI-Powered Smart Pricing Engine
 */

import { smartPricingEngine, getQuickPricingSuggestion, analyzePricingTrends } from './pricing-engine';
import type { PricingFactors } from './pricing-engine';

describe('Smart Pricing Engine', () => {
  const mockPricingFactors: PricingFactors = {
    basePrice: 100,
    category: 'cameras',
    condition: 'good',
    brand: 'canon',
    model: 'eos-r5',
    location: {
      city: 'San Francisco',
      state: 'CA',
      latitude: 37.7749,
      longitude: -122.4194
    },
    seasonality: {
      month: 6,
      isWeekend: true,
      isHoliday: false
    },
    demand: {
      localDemand: 0.7,
      categoryDemand: 0.8,
      historicalBookings: 15
    },
    competition: {
      similarItems: 5,
      avgCompetitorPrice: 95,
      pricePercentile: 0.6
    },
    owner: {
      rating: 4.8,
      totalRentals: 25,
      responseTime: 2
    }
  };

  describe('calculateOptimalPricing', () => {
    test('should calculate pricing recommendation with valid factors', async () => {
      const recommendation = await smartPricingEngine.calculateOptimalPricing(mockPricingFactors);

      expect(recommendation).toHaveProperty('suggestedPrice');
      expect(recommendation).toHaveProperty('confidence');
      expect(recommendation).toHaveProperty('priceRange');
      expect(recommendation).toHaveProperty('factors');
      expect(recommendation).toHaveProperty('reasoning');
      expect(recommendation).toHaveProperty('expectedBookingRate');
      expect(recommendation).toHaveProperty('revenueProjection');

      expect(recommendation.suggestedPrice).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
      expect(recommendation.expectedBookingRate).toBeGreaterThanOrEqual(0);
      expect(recommendation.expectedBookingRate).toBeLessThanOrEqual(1);
    });

    test('should apply premium market pricing for SF', async () => {
      const recommendation = await smartPricingEngine.calculateOptimalPricing(mockPricingFactors);
      
      // SF is a premium market, should get location boost
      expect(recommendation.factors.location).toBeGreaterThan(1);
      expect(recommendation.reasoning.some((reason: string) => reason.includes('Premium market location'))).toBe(true);
    });

    test('should apply weekend premium', async () => {
      const recommendation = await smartPricingEngine.calculateOptimalPricing(mockPricingFactors);
      
      // Weekend should boost seasonality factor
      expect(recommendation.factors.seasonality).toBeGreaterThan(1);
    });

    test('should apply brand premium for Canon', async () => {
      const recommendation = await smartPricingEngine.calculateOptimalPricing(mockPricingFactors);
      
      // Canon is a premium brand
      expect(recommendation.factors.quality).toBeGreaterThan(1);
      expect(recommendation.reasoning.some((reason: string) => reason.includes('canon brand'))).toBe(true);
    });

    test('should handle high demand correctly', async () => {
      const highDemandFactors = {
        ...mockPricingFactors,
        demand: {
          localDemand: 0.9,
          categoryDemand: 0.95,
          historicalBookings: 30
        }
      };

      const recommendation = await smartPricingEngine.calculateOptimalPricing(highDemandFactors);
      
      expect(recommendation.factors.demand).toBeGreaterThan(1);
      expect(recommendation.reasoning.some((reason: string) => reason.includes('High demand'))).toBe(true);
    });

    test('should handle low competition correctly', async () => {
      const lowCompetitionFactors = {
        ...mockPricingFactors,
        competition: {
          similarItems: 1,
          avgCompetitorPrice: 120,
          pricePercentile: 0.3
        }
      };

      const recommendation = await smartPricingEngine.calculateOptimalPricing(lowCompetitionFactors);
      
      // Low competition should allow higher pricing
      expect(recommendation.factors.competition).toBeGreaterThanOrEqual(0.9);
    });

    test('should provide detailed reasoning', async () => {
      const recommendation = await smartPricingEngine.calculateOptimalPricing(mockPricingFactors);
      
      expect(recommendation.reasoning).toBeInstanceOf(Array);
      expect(recommendation.reasoning.length).toBeGreaterThan(0);
      expect(recommendation.reasoning[0]).toEqual(expect.any(String));
    });

    test('should calculate revenue projections', async () => {
      const recommendation = await smartPricingEngine.calculateOptimalPricing(mockPricingFactors);
      
      expect(recommendation.revenueProjection.daily).toBeGreaterThan(0);
      expect(recommendation.revenueProjection.weekly).toBeGreaterThan(0);
      expect(recommendation.revenueProjection.monthly).toBeGreaterThan(0);
      
      // Weekly should be less than daily * 7 due to discount
      expect(recommendation.revenueProjection.weekly).toBeLessThan(recommendation.revenueProjection.daily * 7);
    });
  });

  describe('getQuickPricingSuggestion', () => {
    test('should provide quick pricing for cameras', async () => {
      const suggestion = await getQuickPricingSuggestion(
        'cameras',
        'canon',
        'good',
        { city: 'Los Angeles', state: 'CA' }
      );

      expect(suggestion).toHaveProperty('suggestedPrice');
      expect(suggestion).toHaveProperty('confidence');
      expect(suggestion.suggestedPrice).toBeGreaterThan(0);
      expect(suggestion.confidence).toBe(0.7);
    });

    test('should apply condition multipliers', async () => {
      const newCondition = await getQuickPricingSuggestion('cameras', 'canon', 'new', { city: 'LA', state: 'CA' });
      const poorCondition = await getQuickPricingSuggestion('cameras', 'canon', 'poor', { city: 'LA', state: 'CA' });

      expect(newCondition.suggestedPrice).toBeGreaterThan(poorCondition.suggestedPrice);
    });

    test('should handle unknown categories', async () => {
      const suggestion = await getQuickPricingSuggestion(
        'unknown-category',
        'some-brand',
        'good',
        { city: 'NYC', state: 'NY' }
      );

      expect(suggestion.suggestedPrice).toBe(50); // Default 'other' category price
    });
  });

  describe('analyzePricingTrends', () => {
    test('should analyze pricing trends for a category', async () => {
      const trends = await analyzePricingTrends(
        'cameras',
        { city: 'San Francisco', state: 'CA' },
        'month'
      );

      expect(trends).toHaveProperty('averagePrice');
      expect(trends).toHaveProperty('priceRange');
      expect(trends).toHaveProperty('trend');
      expect(trends).toHaveProperty('trendPercentage');
      expect(trends).toHaveProperty('insights');

      expect(trends.averagePrice).toBeGreaterThan(0);
      expect(trends.priceRange.min).toBeLessThan(trends.priceRange.max);
      expect(['increasing', 'decreasing', 'stable']).toContain(trends.trend);
      expect(trends.insights).toBeInstanceOf(Array);
      expect(trends.insights.length).toBeGreaterThan(0);
    });

    test('should include market insights', async () => {
      const trends = await analyzePricingTrends('cameras', { city: 'SF', state: 'CA' });

      expect(trends.insights).toContain('Weekend rentals command 15-20% premium');
      expect(trends.insights).toContain('Items in "like-new" condition rent 25% faster');
      expect(trends.insights).toContain('Professional brands (Canon, Sony, Nikon) have 30% higher booking rates');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero base price', async () => {
      const zeroFactors = { ...mockPricingFactors, basePrice: 0 };
      const recommendation = await smartPricingEngine.calculateOptimalPricing(zeroFactors);

      expect(recommendation.suggestedPrice).toBe(0);
    });

    test('should handle extreme competition', async () => {
      const extremeCompetition = {
        ...mockPricingFactors,
        competition: {
          similarItems: 50,
          avgCompetitorPrice: 50,
          pricePercentile: 0.95
        }
      };

      const recommendation = await smartPricingEngine.calculateOptimalPricing(extremeCompetition);
      
      // Should reduce price due to high competition
      expect(recommendation.factors.competition).toBeLessThan(1);
    });

    test('should handle new owner with no history', async () => {
      const newOwnerFactors = {
        ...mockPricingFactors,
        owner: {
          rating: 0,
          totalRentals: 0,
          responseTime: 24
        }
      };

      const recommendation = await smartPricingEngine.calculateOptimalPricing(newOwnerFactors);
      
      expect(recommendation.confidence).toBeLessThan(0.8); // Lower confidence for new owners
    });
  });
});
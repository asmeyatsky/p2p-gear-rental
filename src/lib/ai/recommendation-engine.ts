/**
 * AI-Powered Intelligent Recommendation Engine
 * Provides personalized gear recommendations using machine learning algorithms
 */

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

export interface UserPreferences {
  userId: string;
  categories: string[];
  priceRange: { min: number; max: number };
  brands: string[];
  location: { city: string; state: string; radius: number };
  rentalHistory: RentalHistoryItem[];
  searchHistory: SearchHistoryItem[];
  favoriteFeatures: string[];
  behaviorScore: number; // 0-1, higher = more engaged user
}

export interface RentalHistoryItem {
  gearId: string;
  category: string;
  brand: string;
  model: string;
  dailyRate: number;
  duration: number;
  rating: number;
  rentalDate: Date;
}

export interface SearchHistoryItem {
  query: string;
  category: string;
  priceRange: { min: number; max: number };
  location: string;
  timestamp: Date;
  clickedItems: string[];
}

export interface RecommendationItem {
  gearId: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  dailyRate: number;
  images: string[];
  owner: {
    id: string;
    name: string;
    rating: number;
    totalRentals: number;
  };
  location: { city: string; state: string };
  condition: string;
  score: number; // 0-1 relevance score
  reasons: string[];
  distance?: number;
  availability: {
    nextAvailable: Date;
    bookingRate: number;
  };
}

export interface RecommendationResult {
  recommendations: RecommendationItem[];
  strategy: string;
  confidence: number;
  metadata: {
    totalCandidates: number;
    filteringCriteria: string[];
    algorithmUsed: string;
    personalizedFactors: string[];
  };
}

class IntelligentRecommendationEngine {
  private readonly CACHE_TTL = 30 * 60; // 30 minutes
  private readonly MAX_RECOMMENDATIONS = 20;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.3;

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    options: {
      category?: string;
      maxResults?: number;
      includeReasons?: boolean;
      strategy?: 'collaborative' | 'content' | 'hybrid' | 'trending';
    } = {}
  ): Promise<RecommendationResult> {
    const cacheKey = CacheManager.keys.custom(`recommendations:${userId}:${JSON.stringify(options)}`);
    const cached = await CacheManager.get<RecommendationResult>(cacheKey);
    
    if (cached) {
      logger.info('Returning cached recommendations', { userId, strategy: cached.strategy }, 'RECOMMENDATIONS');
      return cached;
    }

    logger.info('Generating personalized recommendations', { 
      userId, 
      options 
    }, 'RECOMMENDATIONS');

    // Get user preferences and history
    const userPreferences = await this.buildUserPreferences(userId);
    
    // Select recommendation strategy
    const strategy = options.strategy || this.selectOptimalStrategy(userPreferences);
    
    let recommendations: RecommendationItem[] = [];
    let confidence = 0;
    let metadata = {
      totalCandidates: 0,
      filteringCriteria: [] as string[],
      algorithmUsed: strategy,
      personalizedFactors: [] as string[]
    };

    switch (strategy) {
      case 'collaborative':
        ({ recommendations, confidence, metadata } = await this.collaborativeFiltering(userPreferences, options));
        break;
      case 'content':
        ({ recommendations, confidence, metadata } = await this.contentBasedFiltering(userPreferences, options));
        break;
      case 'trending':
        ({ recommendations, confidence, metadata } = await this.trendingRecommendations(userPreferences, options));
        break;
      default:
        ({ recommendations, confidence, metadata } = await this.hybridRecommendations(userPreferences, options));
    }

    // Filter and rank final results
    recommendations = this.postProcessRecommendations(
      recommendations, 
      userPreferences, 
      options.maxResults || this.MAX_RECOMMENDATIONS
    );

    const result: RecommendationResult = {
      recommendations,
      strategy,
      confidence,
      metadata
    };

    // Cache results
    await CacheManager.set(cacheKey, result, this.CACHE_TTL);

    logger.info('Recommendations generated', {
      userId,
      strategy,
      count: recommendations.length,
      confidence,
      avgScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length
    }, 'RECOMMENDATIONS');

    return result;
  }

  /**
   * Get similar items based on a specific gear item
   */
  async getSimilarItems(
    gearId: string, 
    userId?: string,
    maxResults: number = 10
  ): Promise<RecommendationItem[]> {
    const cacheKey = CacheManager.keys.custom(`similar:${gearId}:${userId || 'anonymous'}`);
    const cached = await CacheManager.get<RecommendationItem[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Get the source item
    const sourceItem = await prisma.gear.findUnique({
      where: { id: gearId },
      include: {
        user: { select: { id: true, full_name: true, averageRating: true, totalReviews: true } }
      }
    });

    if (!sourceItem) {
      return [];
    }

    // Find similar items using content-based similarity
    const similarItems = await this.findContentSimilarItems(sourceItem, maxResults * 2);
    
    // Apply user preferences if available
    let recommendations = similarItems;
    if (userId) {
      const userPreferences = await this.buildUserPreferences(userId);
      recommendations = this.rankByUserPreferences(similarItems, userPreferences);
    }

    const result = recommendations.slice(0, maxResults);
    await CacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get trending gear recommendations
   */
  async getTrendingRecommendations(
    location?: { city: string; state: string },
    category?: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<RecommendationItem[]> {
    const cacheKey = CacheManager.keys.custom(`trending:${timeframe}:${category || 'all'}:${location?.city || 'global'}`);
    const cached = await CacheManager.get<RecommendationItem[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const dateFilter = this.getDateFilter(timeframe);
    
    // Get trending gear based on rental activity, reviews, and views
    const trendingGear = await prisma.gear.findMany({
      where: {
        ...(category && { category }),
        ...(location && { city: location.city, state: location.state }),
        createdAt: { gte: dateFilter }
      },
      include: {
        user: { select: { id: true, full_name: true, averageRating: true, totalReviews: true } },
        rentals: {
          where: { createdAt: { gte: dateFilter } },
          select: { rating: true, createdAt: true }
        }
      },
      take: 50
    });

    // Calculate trending scores
    const recommendations = trendingGear
      .map(gear => this.calculateTrendingScore(gear))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    await CacheManager.set(cacheKey, recommendations, this.CACHE_TTL);
    return recommendations;
  }

  private async buildUserPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = CacheManager.keys.custom(`user_preferences:${userId}`);
    const cached = await CacheManager.get<UserPreferences>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Get user's rental history
    const rentals = await prisma.rental.findMany({
      where: { renterId: userId },
      include: {
        gear: true,
        review: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Analyze preferences from history
    const categories = [...new Set(rentals.map(r => r.gear.category).filter(Boolean))];
    const brands = [...new Set(rentals.map(r => r.gear.brand).filter(Boolean))];
    const priceRange = this.calculatePriceRange(rentals.map(r => r.gear.dailyRate));
    
    const preferences: UserPreferences = {
      userId,
      categories,
      priceRange,
      brands,
      location: this.inferUserLocation(rentals),
      rentalHistory: rentals.map(r => ({
        gearId: r.gearId,
        category: r.gear.category || 'other',
        brand: r.gear.brand || 'unknown',
        model: r.gear.model || 'unknown',
        dailyRate: r.gear.dailyRate,
        duration: Math.ceil((r.endDate.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        rating: r.review?.rating || 3,
        rentalDate: r.createdAt
      })),
      searchHistory: [], // Would be populated from analytics
      favoriteFeatures: this.inferFavoriteFeatures(rentals),
      behaviorScore: this.calculateBehaviorScore(rentals)
    };

    await CacheManager.set(cacheKey, preferences, 15 * 60); // 15 minutes
    return preferences;
  }

  private async collaborativeFiltering(
    userPreferences: UserPreferences,
    options: any
  ): Promise<{ recommendations: RecommendationItem[]; confidence: number; metadata: any }> {
    // Find users with similar preferences
    const similarUsers = await this.findSimilarUsers(userPreferences);
    
    // Get their highly-rated rentals
    const similarUserRentals = await prisma.rental.findMany({
      where: {
        renterId: { in: similarUsers.map(u => u.userId) },
        review: { rating: { gte: 4 } }
      },
      include: {
        gear: {
          include: {
            user: { select: { id: true, full_name: true, averageRating: true, totalReviews: true } }
          }
        },
        review: true
      },
      take: 100
    });

    // Filter out items user has already rented
    const userRentedIds = new Set(userPreferences.rentalHistory.map(r => r.gearId));
    const candidateGear = similarUserRentals
      .filter(r => !userRentedIds.has(r.gearId))
      .map(r => r.gear);

    const recommendations = candidateGear.map(gear => 
      this.convertToRecommendationItem(gear, userPreferences, 'collaborative')
    );

    return {
      recommendations,
      confidence: similarUsers.length > 3 ? 0.8 : 0.5,
      metadata: {
        totalCandidates: candidateGear.length,
        filteringCriteria: ['similar_users', 'high_ratings'],
        algorithmUsed: 'collaborative',
        personalizedFactors: ['user_similarity', 'rating_patterns']
      }
    };
  }

  private async contentBasedFiltering(
    userPreferences: UserPreferences,
    options: any
  ): Promise<{ recommendations: RecommendationItem[]; confidence: number; metadata: any }> {
    // Find gear similar to user's preferred categories and brands
    const candidateGear = await prisma.gear.findMany({
      where: {
        AND: [
          { category: { in: userPreferences.categories } },
          { dailyRate: { gte: userPreferences.priceRange.min, lte: userPreferences.priceRange.max } },
          ...(options.category ? [{ category: options.category }] : [])
        ]
      },
      include: {
        user: { select: { id: true, full_name: true, averageRating: true, totalReviews: true } }
      },
      take: 100
    });

    // Filter out user's own gear and previously rented items
    const userRentedIds = new Set(userPreferences.rentalHistory.map(r => r.gearId));
    const filteredGear = candidateGear.filter(gear => 
      gear.userId !== userPreferences.userId && !userRentedIds.has(gear.id)
    );

    const recommendations = filteredGear.map(gear => 
      this.convertToRecommendationItem(gear, userPreferences, 'content')
    );

    return {
      recommendations,
      confidence: 0.7,
      metadata: {
        totalCandidates: filteredGear.length,
        filteringCriteria: ['category_match', 'price_range', 'not_previously_rented'],
        algorithmUsed: 'content',
        personalizedFactors: ['category_preferences', 'price_preferences', 'brand_affinity']
      }
    };
  }

  private async hybridRecommendations(
    userPreferences: UserPreferences,
    options: any
  ): Promise<{ recommendations: RecommendationItem[]; confidence: number; metadata: any }> {
    // Combine collaborative and content-based filtering
    const [collaborative, content] = await Promise.all([
      this.collaborativeFiltering(userPreferences, options),
      this.contentBasedFiltering(userPreferences, options)
    ]);

    // Merge and deduplicate recommendations
    const allRecommendations = [...collaborative.recommendations, ...content.recommendations];
    const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);

    // Re-score with hybrid approach
    const hybridRecommendations = uniqueRecommendations.map(rec => ({
      ...rec,
      score: (rec.score * 0.6) + (this.calculateHybridBoost(rec, userPreferences) * 0.4)
    }));

    return {
      recommendations: hybridRecommendations,
      confidence: Math.max(collaborative.confidence, content.confidence),
      metadata: {
        totalCandidates: uniqueRecommendations.length,
        filteringCriteria: [...collaborative.metadata.filteringCriteria, ...content.metadata.filteringCriteria],
        algorithmUsed: 'hybrid',
        personalizedFactors: ['collaborative_signals', 'content_similarity', 'popularity']
      }
    };
  }

  private async trendingRecommendations(
    userPreferences: UserPreferences,
    options: any
  ): Promise<{ recommendations: RecommendationItem[]; confidence: number; metadata: any }> {
    const trending = await this.getTrendingRecommendations(
      userPreferences.location,
      options.category
    );

    return {
      recommendations: trending,
      confidence: 0.6,
      metadata: {
        totalCandidates: trending.length,
        filteringCriteria: ['trending_score', 'recent_activity'],
        algorithmUsed: 'trending',
        personalizedFactors: ['location_relevance']
      }
    };
  }

  private selectOptimalStrategy(userPreferences: UserPreferences): string {
    // Choose strategy based on user data availability
    if (userPreferences.rentalHistory.length > 5) {
      return 'hybrid'; // Enough data for personalization
    } else if (userPreferences.rentalHistory.length > 0) {
      return 'content'; // Some data, use content-based
    } else {
      return 'trending'; // New user, show trending items
    }
  }

  private postProcessRecommendations(
    recommendations: RecommendationItem[],
    userPreferences: UserPreferences,
    maxResults: number
  ): RecommendationItem[] {
    return recommendations
      .filter(rec => rec.score >= this.MIN_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  // Helper methods
  private calculatePriceRange(prices: number[]): { min: number; max: number } {
    if (prices.length === 0) return { min: 0, max: 1000 };
    
    const sorted = prices.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    
    return {
      min: Math.max(0, q1 * 0.5),
      max: q3 * 1.5
    };
  }

  private inferUserLocation(rentals: any[]): { city: string; state: string; radius: number } {
    if (rentals.length === 0) return { city: '', state: '', radius: 50 };
    
    // Find most common location
    const locations = rentals.map(r => `${r.gear.city}, ${r.gear.state}`);
    const locationCounts = locations.reduce((acc, loc) => {
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const [city, state] = mostCommon.split(', ');
    return { city, state, radius: 50 };
  }

  private inferFavoriteFeatures(rentals: any[]): string[] {
    // Analyze rental patterns to infer favorite features
    const features: string[] = [];
    
    const categories = rentals.map(r => r.gear.category);
    const brands = rentals.map(r => r.gear.brand);
    
    // Add frequent categories as features
    const categoryCount = categories.reduce((acc, cat) => {
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(categoryCount)
      .filter(([, count]) => count >= 2)
      .forEach(([category]) => features.push(`prefers_${category}`));
    
    return features;
  }

  private calculateBehaviorScore(rentals: any[]): number {
    if (rentals.length === 0) return 0.3;
    
    let score = 0;
    
    // Activity level
    score += Math.min(rentals.length / 20, 0.4);
    
    // Review engagement
    const reviewRate = rentals.filter(r => r.review).length / rentals.length;
    score += reviewRate * 0.3;
    
    // Average rating given
    const avgRating = rentals
      .filter(r => r.review)
      .reduce((sum, r) => sum + r.review.rating, 0) / rentals.filter(r => r.review).length;
    
    if (avgRating) {
      score += (avgRating / 5) * 0.3;
    }
    
    return Math.min(score, 1);
  }

  private async findSimilarUsers(userPreferences: UserPreferences): Promise<Array<{ userId: string; similarity: number }>> {
    // Simplified similar user finding - in production would use more sophisticated algorithms
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: userPreferences.userId } },
      include: {
        rentedItems: {
          include: { gear: true },
          take: 20
        }
      },
      take: 100
    });

    return otherUsers
      .map(user => ({
        userId: user.id,
        similarity: this.calculateUserSimilarity(userPreferences, user)
      }))
      .filter(u => u.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  private calculateUserSimilarity(user1: UserPreferences, user2: any): number {
    // Simplified similarity calculation
    const user2Categories = [...new Set(user2.rentedItems.map((r: any) => r.gear.category))];
    const commonCategories = user1.categories.filter(cat => user2Categories.includes(cat));
    
    const categorySimilarity = commonCategories.length / Math.max(user1.categories.length, user2Categories.length);
    
    return categorySimilarity;
  }

  private async findContentSimilarItems(sourceItem: any, limit: number): Promise<RecommendationItem[]> {
    const similarItems = await prisma.gear.findMany({
      where: {
        AND: [
          { id: { not: sourceItem.id } },
          {
            OR: [
              { category: sourceItem.category },
              { brand: sourceItem.brand },
              {
                AND: [
                  { dailyRate: { gte: sourceItem.dailyRate * 0.7 } },
                  { dailyRate: { lte: sourceItem.dailyRate * 1.3 } }
                ]
              }
            ]
          }
        ]
      },
      include: {
        user: { select: { id: true, full_name: true, averageRating: true, totalReviews: true } }
      },
      take: limit
    });

    return similarItems.map(item => ({
      gearId: item.id,
      title: item.title,
      description: item.description,
      category: item.category || 'other',
      brand: item.brand || 'unknown',
      model: item.model || 'unknown',
      dailyRate: item.dailyRate,
      images: item.images,
      owner: {
        id: item.user?.id || '',
        name: item.user?.full_name || 'Unknown',
        rating: item.user?.averageRating || 0,
        totalRentals: item.user?.totalReviews || 0
      },
      location: { city: item.city, state: item.state },
      condition: item.condition || 'good',
      score: this.calculateContentSimilarity(sourceItem, item),
      reasons: [`Similar to ${sourceItem.title}`, `Same category: ${item.category}`],
      availability: {
        nextAvailable: new Date(),
        bookingRate: 0.3
      }
    }));
  }

  private calculateContentSimilarity(item1: any, item2: any): number {
    let score = 0;
    
    if (item1.category === item2.category) score += 0.4;
    if (item1.brand === item2.brand) score += 0.3;
    
    const priceRatio = Math.min(item1.dailyRate, item2.dailyRate) / Math.max(item1.dailyRate, item2.dailyRate);
    score += priceRatio * 0.3;
    
    return score;
  }

  private rankByUserPreferences(items: RecommendationItem[], preferences: UserPreferences): RecommendationItem[] {
    return items.map(item => ({
      ...item,
      score: item.score * this.calculatePreferenceMultiplier(item, preferences)
    })).sort((a, b) => b.score - a.score);
  }

  private calculatePreferenceMultiplier(item: RecommendationItem, preferences: UserPreferences): number {
    let multiplier = 1;
    
    if (preferences.categories.includes(item.category)) multiplier += 0.2;
    if (preferences.brands.includes(item.brand)) multiplier += 0.15;
    
    if (item.dailyRate >= preferences.priceRange.min && item.dailyRate <= preferences.priceRange.max) {
      multiplier += 0.1;
    }
    
    return multiplier;
  }

  private convertToRecommendationItem(gear: any, preferences: UserPreferences, source: string): RecommendationItem {
    return {
      gearId: gear.id,
      title: gear.title,
      description: gear.description,
      category: gear.category || 'other',
      brand: gear.brand || 'unknown',
      model: gear.model || 'unknown',
      dailyRate: gear.dailyRate,
      images: gear.images,
      owner: {
        id: gear.user?.id || '',
        name: gear.user?.full_name || 'Unknown',
        rating: gear.user?.averageRating || 0,
        totalRentals: gear.user?.totalReviews || 0
      },
      location: { city: gear.city, state: gear.state },
      condition: gear.condition || 'good',
      score: this.calculateBaseScore(gear, preferences, source),
      reasons: this.generateReasons(gear, preferences, source),
      availability: {
        nextAvailable: new Date(),
        bookingRate: 0.3 // Would be calculated from actual data
      }
    };
  }

  private calculateBaseScore(gear: any, preferences: UserPreferences, source: string): number {
    let score = 0.5; // Base score
    
    // Category preference
    if (preferences.categories.includes(gear.category)) score += 0.2;
    
    // Brand preference
    if (preferences.brands.includes(gear.brand)) score += 0.15;
    
    // Price preference
    if (gear.dailyRate >= preferences.priceRange.min && gear.dailyRate <= preferences.priceRange.max) {
      score += 0.1;
    }
    
    // Owner rating
    if (gear.user?.averageRating) {
      score += (gear.user.averageRating / 5) * 0.1;
    }
    
    // Source-specific adjustments
    if (source === 'collaborative') score += 0.05;
    
    return Math.min(score, 1);
  }

  private generateReasons(gear: any, preferences: UserPreferences, source: string): string[] {
    const reasons: string[] = [];
    
    if (preferences.categories.includes(gear.category)) {
      reasons.push(`Matches your interest in ${gear.category}`);
    }
    
    if (preferences.brands.includes(gear.brand)) {
      reasons.push(`You've rented ${gear.brand} equipment before`);
    }
    
    if (gear.user?.averageRating && gear.user.averageRating > 4.5) {
      reasons.push(`Highly rated owner (${gear.user.averageRating}★)`);
    }
    
    if (source === 'collaborative') {
      reasons.push('Popular with similar users');
    }
    
    if (reasons.length === 0) {
      reasons.push('Recommended based on your activity');
    }
    
    return reasons;
  }

  private calculateTrendingScore(gear: any): RecommendationItem {
    const recentRentals = gear.rentals.length;
    const avgRating = gear.rentals.reduce((sum: number, r: any) => sum + (r.rating || 3), 0) / Math.max(gear.rentals.length, 1);
    
    let trendingScore = 0;
    trendingScore += Math.min(recentRentals / 10, 0.5); // Rental frequency
    trendingScore += (avgRating / 5) * 0.3; // Quality
    trendingScore += Math.random() * 0.2; // Some randomness for discovery
    
    return {
      gearId: gear.id,
      title: gear.title,
      description: gear.description,
      category: gear.category || 'other',
      brand: gear.brand || 'unknown',
      model: gear.model || 'unknown',
      dailyRate: gear.dailyRate,
      images: gear.images,
      owner: {
        id: gear.user?.id || '',
        name: gear.user?.full_name || 'Unknown',
        rating: gear.user?.averageRating || 0,
        totalRentals: gear.user?.totalReviews || 0
      },
      location: { city: gear.city, state: gear.state },
      condition: gear.condition || 'good',
      score: trendingScore,
      reasons: [`Trending in ${gear.category}`, 'Popular this week'],
      availability: {
        nextAvailable: new Date(),
        bookingRate: recentRentals / 30 // Estimate based on recent activity
      }
    };
  }

  private deduplicateRecommendations(recommendations: RecommendationItem[]): RecommendationItem[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.gearId)) return false;
      seen.add(rec.gearId);
      return true;
    });
  }

  private calculateHybridBoost(rec: RecommendationItem, preferences: UserPreferences): number {
    // Additional scoring for hybrid approach
    let boost = 0;
    
    // Diversity bonus
    if (!preferences.categories.includes(rec.category)) boost += 0.1;
    
    // Quality bonus
    if (rec.owner.rating > 4.5) boost += 0.15;
    
    // Availability bonus
    if (rec.availability.bookingRate < 0.5) boost += 0.05;
    
    return boost;
  }

  private getDateFilter(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}

export const intelligentRecommendationEngine = new IntelligentRecommendationEngine();

/**
 * Get quick recommendations for anonymous users
 */
export async function getAnonymousRecommendations(
  location?: { city: string; state: string },
  category?: string
): Promise<RecommendationItem[]> {
  return intelligentRecommendationEngine.getTrendingRecommendations(location, category);
}

/**
 * Search with intelligent query understanding
 */
export async function intelligentSearch(
  query: string,
  userId?: string,
  filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    location?: { city: string; state: string };
  }
): Promise<{
  results: RecommendationItem[];
  suggestions: string[];
  queryUnderstanding: {
    intent: string;
    extractedFilters: any;
    confidence: number;
  };
}> {
  // Parse query for intent and filters
  const queryUnderstanding = parseSearchQuery(query);
  
  // Merge parsed filters with explicit filters
  const combinedFilters = {
    ...queryUnderstanding.extractedFilters,
    ...filters
  };
  
  // Get search results
  let results: RecommendationItem[] = [];
  
  if (userId) {
    const recommendations = await intelligentRecommendationEngine.getPersonalizedRecommendations(
      userId,
      { category: combinedFilters.category, maxResults: 20 }
    );
    results = recommendations.recommendations;
  } else {
    results = await getAnonymousRecommendations(combinedFilters.location, combinedFilters.category);
  }
  
  // Filter results based on query
  const filteredResults = results.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.brand.toLowerCase().includes(query.toLowerCase())
  );
  
  // Generate search suggestions
  const suggestions = generateSearchSuggestions(query, queryUnderstanding);
  
  return {
    results: filteredResults,
    suggestions,
    queryUnderstanding
  };
}

function parseSearchQuery(query: string): {
  intent: string;
  extractedFilters: any;
  confidence: number;
} {
  const lowerQuery = query.toLowerCase();
  
  // Extract category
  const categories = ['camera', 'lens', 'lighting', 'audio', 'drone', 'tripod', 'monitor'];
  const detectedCategory = categories.find(cat => lowerQuery.includes(cat));
  
  // Extract brand
  const brands = ['canon', 'nikon', 'sony', 'panasonic', 'red', 'arri', 'sennheiser', 'rode'];
  const detectedBrand = brands.find(brand => lowerQuery.includes(brand));
  
  // Determine intent
  let intent = 'browse';
  if (lowerQuery.includes('cheap') || lowerQuery.includes('budget')) intent = 'budget';
  if (lowerQuery.includes('professional') || lowerQuery.includes('pro')) intent = 'professional';
  if (lowerQuery.includes('wedding') || lowerQuery.includes('event')) intent = 'event';
  
  return {
    intent,
    extractedFilters: {
      ...(detectedCategory && { category: detectedCategory }),
      ...(detectedBrand && { brand: detectedBrand })
    },
    confidence: 0.7
  };
}

function generateSearchSuggestions(query: string, understanding: any): string[] {
  const suggestions: string[] = [];
  
  // Add category-based suggestions
  if (understanding.extractedFilters.category) {
    suggestions.push(`${understanding.extractedFilters.category} near me`);
    suggestions.push(`professional ${understanding.extractedFilters.category}`);
    suggestions.push(`${understanding.extractedFilters.category} for wedding`);
  }
  
  // Add brand-based suggestions
  if (understanding.extractedFilters.brand) {
    suggestions.push(`${understanding.extractedFilters.brand} ${understanding.extractedFilters.category || 'equipment'}`);
  }
  
  // Add intent-based suggestions
  if (understanding.intent === 'budget') {
    suggestions.push(`budget ${query}`);
    suggestions.push(`affordable ${query}`);
  }
  
  return suggestions.slice(0, 5);
}
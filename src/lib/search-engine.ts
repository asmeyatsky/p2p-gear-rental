import Fuse from 'fuse.js';
import { GearItem } from '@/types';
import { prisma } from '@/lib/prisma';
import { CacheManager } from '@/lib/cache';
import { logger } from '@/lib/logger';

export interface SearchOptions {
  query?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  location?: string;
  radius?: number; // in miles
  availability?: {
    startDate: string;
    endDate: string;
  };
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'distance' | 'rating' | 'relevance';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  data: GearItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchMeta?: {
    fuzzyMatches: number;
    exactMatches: number;
    totalProcessed: number;
    searchTime: number;
  };
}

class SearchEngine {
  private fuseInstance: Fuse<GearItem> | null = null;
  private lastIndexUpdate = 0;
  private readonly REINDEX_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private getFuseOptions(): any {
    return {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.2 },
        { name: 'brand', weight: 0.2 },
        { name: 'model', weight: 0.1 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      findAllMatches: true,
    };
  }

  private async updateSearchIndex(): Promise<void> {
    const now = Date.now();
    if (this.fuseInstance && (now - this.lastIndexUpdate) < this.REINDEX_INTERVAL) {
      return;
    }

    logger.info('Updating search index', {}, 'SEARCH');

    const cacheKey = 'search:index';
    let allGear = await CacheManager.get<GearItem[]>(cacheKey);

    if (!allGear) {
      const dbGear = await prisma.gear.findMany({
        include: {
          user: {
            select: { id: true, email: true, full_name: true }
          },
          rentals: {
            where: {
              status: { in: ['pending', 'approved'] }
            },
            select: { startDate: true, endDate: true, status: true }
          }
        }
      });
      
      // Convert to GearItem format
      allGear = dbGear.map(gear => ({
        ...gear,
        createdAt: gear.createdAt.toISOString(),
        updatedAt: gear.updatedAt.toISOString(),
        averageRating: gear.averageRating || null,
        totalReviews: gear.totalReviews || 0
      })) as GearItem[];

      // Cache the gear data for 10 minutes
      await CacheManager.set(cacheKey, allGear, CacheManager.TTL.LONG);
    }

    this.fuseInstance = new Fuse(allGear, this.getFuseOptions());
    this.lastIndexUpdate = now;

    logger.info('Search index updated', { itemCount: allGear.length }, 'SEARCH');
  }

  private async performExactSearch(options: SearchOptions): Promise<GearItem[]> {
    const where: any = {};

    // Price range
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      where.dailyRate = {};
      if (options.minPrice !== undefined) where.dailyRate.gte = options.minPrice;
      if (options.maxPrice !== undefined) where.dailyRate.lte = options.maxPrice;
    }

    // Category filter
    if (options.category) {
      where.category = options.category;
    }

    // Condition filter
    if (options.condition) {
      where.condition = options.condition;
    }

    // Location filters
    if (options.city) {
      where.city = { contains: options.city, mode: 'insensitive' };
    }
    if (options.state) {
      where.state = { contains: options.state, mode: 'insensitive' };
    }

    // Availability filter
    if (options.availability?.startDate && options.availability?.endDate) {
      where.NOT = {
        rentals: {
          some: {
            AND: [
              {
                OR: [
                  { startDate: { lte: new Date(options.availability.endDate) } },
                  { endDate: { gte: new Date(options.availability.startDate) } }
                ]
              },
              {
                status: { in: ['pending', 'approved'] }
              }
            ]
          }
        }
      };
    }

    // Text search - exact match priority
    if (options.query) {
      where.OR = [
        { title: { contains: options.query, mode: 'insensitive' } },
        { description: { contains: options.query, mode: 'insensitive' } },
        { brand: { contains: options.query, mode: 'insensitive' } },
        { model: { contains: options.query, mode: 'insensitive' } },
      ];
    }

    const gear = await prisma.gear.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, full_name: true }
        },
        rentals: {
          where: {
            status: { in: ['pending', 'approved'] }
          },
          select: { startDate: true, endDate: true, status: true }
        }
      }
    });

    return gear.map(g => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      averageRating: g.averageRating || null,
      totalReviews: g.totalReviews || 0
    })) as GearItem[];
  }

  private async performFuzzySearch(query: string, options: SearchOptions): Promise<GearItem[]> {
    await this.updateSearchIndex();

    if (!this.fuseInstance) {
      throw new Error('Search index not available');
    }

    const results = this.fuseInstance.search(query);
    
    // Apply additional filters to fuzzy search results
    return results
      .map(result => result.item)
      .filter(item => {
        // Price range
        if (options.minPrice !== undefined && item.dailyRate < options.minPrice) return false;
        if (options.maxPrice !== undefined && item.dailyRate > options.maxPrice) return false;

        // Category
        if (options.category && item.category !== options.category) return false;

        // Condition
        if (options.condition && item.condition !== options.condition) return false;

        // Location
        if (options.city && !item.city.toLowerCase().includes(options.city.toLowerCase())) return false;
        if (options.state && !item.state.toLowerCase().includes(options.state.toLowerCase())) return false;

        // Availability - simplified check
        if (options.availability?.startDate && options.availability?.endDate) {
          const requestStart = new Date(options.availability.startDate);
          const requestEnd = new Date(options.availability.endDate);
          
          // TODO: Implement proper availability checking with rental conflicts
          // For now, assume all items are available since GearItem doesn't include rentals
          const hasConflict = false;
          
          if (hasConflict) return false;
        }

        return true;
      });
  }

  private sortResults(gear: GearItem[], sortBy: string): GearItem[] {
    const sorted = [...gear];

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.dailyRate - b.dailyRate);
      
      case 'price-high':
        return sorted.sort((a, b) => b.dailyRate - a.dailyRate);
      
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      case 'rating':
        return sorted.sort((a, b) => {
          const aRating = a.averageRating || 0;
          const bRating = b.averageRating || 0;
          return bRating - aRating;
        });
      
      case 'distance':
        // TODO: Implement geolocation-based sorting
        return sorted;
      
      case 'relevance':
      default:
        return sorted;
    }
  }

  private paginateResults(gear: GearItem[], page: number, limit: number): {
    data: GearItem[];
    pagination: SearchResult['pagination'];
  } {
    const total = gear.length;
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const data = gear.slice(skip, skip + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();
    const {
      query = '',
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = options;

    logger.info('Search request', { query, sortBy, page, limit, ...options }, 'SEARCH');

    let exactMatches: GearItem[] = [];
    let fuzzyMatches: GearItem[] = [];
    let allResults: GearItem[] = [];

    try {
      if (query.trim()) {
        // Perform both exact and fuzzy searches
        const [exact, fuzzy] = await Promise.all([
          this.performExactSearch(options),
          this.performFuzzySearch(query, options),
        ]);

        exactMatches = exact;
        fuzzyMatches = fuzzy;

        // Combine results with exact matches first, then fuzzy matches
        // Remove duplicates (prioritize exact matches)
        const exactIds = new Set(exactMatches.map(item => item.id));
        const uniqueFuzzyMatches = fuzzyMatches.filter(item => !exactIds.has(item.id));
        
        allResults = [...exactMatches, ...uniqueFuzzyMatches];
      } else {
        // No query provided, just filter and sort
        allResults = await this.performExactSearch(options);
      }

      // Sort results
      if (sortBy !== 'relevance') {
        allResults = this.sortResults(allResults, sortBy);
      }

      // Paginate results
      const paginatedResult = this.paginateResults(allResults, page, limit);

      const searchTime = Date.now() - startTime;
      
      const result: SearchResult = {
        ...paginatedResult,
        searchMeta: {
          fuzzyMatches: fuzzyMatches.length,
          exactMatches: exactMatches.length,
          totalProcessed: allResults.length,
          searchTime,
        },
      };

      logger.info('Search completed', {
        query,
        exactMatches: exactMatches.length,
        fuzzyMatches: fuzzyMatches.length,
        totalResults: allResults.length,
        returnedResults: paginatedResult.data.length,
        searchTime,
      }, 'SEARCH');

      return result;

    } catch (error) {
      logger.error('Search failed', { query, error: error instanceof Error ? error.message : 'Unknown error' }, 'SEARCH');
      throw error;
    }
  }

  async invalidateIndex(): Promise<void> {
    this.fuseInstance = null;
    this.lastIndexUpdate = 0;
    await CacheManager.del('search:index');
    logger.info('Search index invalidated', {}, 'SEARCH');
  }
}

export const searchEngine = new SearchEngine();
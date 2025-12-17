/**
 * Internal API Client for SSR
 *
 * This client is used by server-side rendering functions to fetch data.
 * Uses direct database calls to avoid self-request deadlocks in development.
 */

import { logger } from './logger';
import { prisma } from './prisma';

// Check if we're in build mode
const isBuildTime = process.env.SKIP_DB_DURING_BUILD === 'true';

// Helper to parse images from JSON string
function parseImages(images: string | string[]): string[] {
  if (Array.isArray(images)) return images;
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
}

// Types for API responses
export interface GearItem {
  id: string;
  title: string;
  description: string;
  category: string | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  dailyRate: number;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  images: string[];
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  userId: string;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    averageRating: number;
    totalReviews: number;
  } | null;
  rentals?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  _count?: {
    rentals: number;
  };
}

export interface GearListResponse {
  data: GearItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchMeta?: {
    exactMatches: number;
    fuzzyMatches: number;
    searchTime: number;
  };
}

export interface CategoryCount {
  name: string | null;
  count: number;
}

// API Functions - Direct database calls for SSR

/**
 * Fetch featured gear for homepage
 */
export async function fetchFeaturedGear(limit: number = 12): Promise<GearItem[]> {
  if (isBuildTime) return [];

  try {
    const gear = await prisma.gear.findMany({
      where: { isAvailable: true },
      orderBy: [
        { averageRating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    });

    return gear.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      condition: g.condition,
      brand: g.brand,
      model: g.model,
      dailyRate: g.dailyRate,
      weeklyRate: g.weeklyRate,
      monthlyRate: g.monthlyRate,
      images: parseImages(g.images),
      city: g.city,
      state: g.state,
      latitude: null,
      longitude: null,
      userId: g.userId || '',
      averageRating: g.averageRating || 0,
      totalReviews: g.totalReviews,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      user: null,
    }));
  } catch (error) {
    logger.error('Failed to fetch featured gear:', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Fetch gear details by ID
 */
export async function fetchGearById(gearId: string): Promise<GearItem | null> {
  if (isBuildTime) return null;

  try {
    const gear = await prisma.gear.findUnique({
      where: { id: gearId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            averageRating: true,
            totalReviews: true,
          }
        }
      }
    });

    if (!gear) return null;

    return {
      id: gear.id,
      title: gear.title,
      description: gear.description,
      category: gear.category,
      condition: gear.condition,
      brand: gear.brand,
      model: gear.model,
      dailyRate: gear.dailyRate,
      weeklyRate: gear.weeklyRate,
      monthlyRate: gear.monthlyRate,
      images: parseImages(gear.images),
      city: gear.city,
      state: gear.state,
      latitude: null,
      longitude: null,
      userId: gear.userId || '',
      averageRating: gear.averageRating || 0,
      totalReviews: gear.totalReviews,
      createdAt: gear.createdAt.toISOString(),
      updatedAt: gear.updatedAt.toISOString(),
      user: gear.user ? {
        id: gear.user.id,
        email: gear.user.email,
        full_name: gear.user.full_name,
        averageRating: gear.user.averageRating || 0,
        totalReviews: gear.user.totalReviews,
      } : null,
    };
  } catch (error) {
    logger.error('Failed to fetch gear by ID:', { gearId, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Fetch categories with counts
 */
export async function fetchCategories(): Promise<CategoryCount[]> {
  if (isBuildTime) return getDefaultCategories();

  try {
    const categories = await prisma.gear.groupBy({
      by: ['category'],
      _count: { category: true },
      where: {
        isAvailable: true,
        category: { not: null }
      },
      orderBy: { _count: { category: 'desc' } },
      take: 8,
    });

    const result = categories.map(c => ({
      name: c.category,
      count: c._count.category,
    }));

    return result.length > 0 ? result : getDefaultCategories();
  } catch (error) {
    logger.error('Failed to fetch categories:', { error: error instanceof Error ? error.message : String(error) });
    return getDefaultCategories();
  }
}

/**
 * Search gear with filters
 */
export async function searchGear(params: {
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}): Promise<GearListResponse> {
  if (isBuildTime) {
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  try {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isAvailable: true };

    if (params.category) where.category = params.category;
    if (params.condition) where.condition = params.condition;
    if (params.city) where.city = params.city;
    if (params.state) where.state = params.state;
    if (params.minPrice || params.maxPrice) {
      where.dailyRate = {};
      if (params.minPrice) (where.dailyRate as Record<string, number>).gte = params.minPrice;
      if (params.maxPrice) (where.dailyRate as Record<string, number>).lte = params.maxPrice;
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
        { model: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [gear, total] = await Promise.all([
      prisma.gear.findMany({
        where,
        skip,
        take: limit,
        orderBy: params.sortBy === 'price'
          ? { dailyRate: 'asc' }
          : params.sortBy === 'rating'
          ? { averageRating: 'desc' }
          : { createdAt: 'desc' },
      }),
      prisma.gear.count({ where }),
    ]);

    return {
      data: gear.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        condition: g.condition,
        brand: g.brand,
        model: g.model,
        dailyRate: g.dailyRate,
        weeklyRate: g.weeklyRate,
        monthlyRate: g.monthlyRate,
        images: parseImages(g.images),
        city: g.city,
        state: g.state,
        latitude: null,
        longitude: null,
        userId: g.userId || '',
        averageRating: g.averageRating || 0,
        totalReviews: g.totalReviews,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Failed to search gear:', { error: error instanceof Error ? error.message : String(error) });
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

// Default categories for fallback
function getDefaultCategories(): CategoryCount[] {
  return [
    { name: 'cameras', count: 0 },
    { name: 'lenses', count: 0 },
    { name: 'lighting', count: 0 },
    { name: 'audio', count: 0 },
    { name: 'drones', count: 0 },
    { name: 'accessories', count: 0 }
  ];
}

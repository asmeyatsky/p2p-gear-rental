/**
 * Internal API Client for SSR
 *
 * This client is used by server-side rendering functions to fetch data.
 * It abstracts the data source, allowing easy migration from direct DB calls
 * to API functions (Cloud Functions) without changing SSR code.
 */

import { logger } from './logger';

// API base URL - can be internal Next.js routes or external Cloud Functions
const getApiBase = () => {
  // In production, this would be the Cloud Functions URL
  if (process.env.API_FUNCTIONS_URL) {
    return process.env.API_FUNCTIONS_URL;
  }
  // For local development and initial deployment, use internal routes
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api`;
};

// Check if we're in build mode
const isBuildTime = process.env.SKIP_DB_DURING_BUILD === 'true';

interface FetchOptions {
  timeout?: number;
  cache?: RequestCache;
  revalidate?: number;
}

async function internalFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T | null> {
  if (isBuildTime) {
    logger.debug(`Skipping API call during build: ${endpoint}`);
    return null;
  }

  const { timeout = 10000, cache = 'no-store', revalidate } = options;
  const url = `${getApiBase()}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true', // Mark as internal request
      },
      signal: controller.signal,
      cache,
    };

    // Add Next.js revalidation if specified
    if (revalidate !== undefined) {
      fetchOptions.next = { revalidate };
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error(`Internal API error: ${response.status}`, {
        endpoint,
        status: response.status
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(`Internal API timeout: ${endpoint}`, { timeout });
    } else {
      logger.error(`Internal API fetch failed: ${endpoint}`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return null;
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

// API Functions

/**
 * Fetch featured gear for homepage
 */
export async function fetchFeaturedGear(limit: number = 12): Promise<GearItem[]> {
  const response = await internalFetch<GearListResponse>(
    `/gear?limit=${limit}&sortBy=rating`,
    { revalidate: 300 } // Cache for 5 minutes
  );
  return response?.data || [];
}

/**
 * Fetch gear details by ID
 */
export async function fetchGearById(gearId: string): Promise<GearItem | null> {
  const response = await internalFetch<GearItem>(
    `/gear/${gearId}`,
    { revalidate: 60 } // Cache for 1 minute
  );
  return response;
}

/**
 * Fetch categories with counts
 */
export async function fetchCategories(): Promise<CategoryCount[]> {
  // For now, this calls the gear endpoint and aggregates
  // In the future, this could be a dedicated endpoint
  const response = await internalFetch<GearListResponse>(
    `/gear?limit=1000`,
    { revalidate: 600 } // Cache for 10 minutes
  );

  if (!response?.data) {
    return getDefaultCategories();
  }

  // Aggregate categories from gear data
  const categoryMap = new Map<string, number>();
  for (const gear of response.data) {
    if (gear.category) {
      categoryMap.set(
        gear.category,
        (categoryMap.get(gear.category) || 0) + 1
      );
    }
  }

  const categories: CategoryCount[] = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return categories.length > 0 ? categories : getDefaultCategories();
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
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  if (params.condition) searchParams.set('condition', params.condition);
  if (params.minPrice) searchParams.set('minPrice', params.minPrice.toString());
  if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
  if (params.city) searchParams.set('city', params.city);
  if (params.state) searchParams.set('state', params.state);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);

  const response = await internalFetch<GearListResponse>(
    `/gear?${searchParams.toString()}`,
    { cache: 'no-store' } // Don't cache search results
  );

  return response || {
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
  };
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

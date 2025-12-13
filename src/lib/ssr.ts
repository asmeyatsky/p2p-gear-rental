import { Metadata } from 'next';
import { logger } from './logger';
import {
  fetchFeaturedGear,
  fetchGearById,
  fetchCategories,
  GearItem,
  CategoryCount
} from './api-internal';

// Check if we're in build mode
const isBuildTime = process.env.SKIP_DB_DURING_BUILD === 'true';

// Performance measurement utility for SSR
export function measureSSRPerformance(operation: string) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      if (!isBuildTime) {
        logger.info(`SSR Performance: ${operation}`, { duration });
      }
      return duration;
    }
  };
}

// Get gear details for SSR - uses internal API
export async function getGearDetailSSR(gearId: string): Promise<GearItem | null> {
  if (isBuildTime) return null;

  try {
    return await fetchGearById(gearId);
  } catch (error) {
    logger.error('Failed to fetch gear details for SSR:', { gearId, error });
    return null;
  }
}

// Generate metadata for gear pages
export async function generateGearMetadata(gearId: string): Promise<Metadata> {
  if (isBuildTime) {
    return {
      title: 'Gear Details | P2P Gear Rental',
      description: 'View details for photography and videography equipment available for rent.'
    };
  }

  try {
    const gear = await fetchGearById(gearId);

    if (!gear) {
      return {
        title: 'Gear Not Found | P2P Gear Rental',
        description: 'The requested gear item could not be found.'
      };
    }

    const truncatedDescription = gear.description.length > 160
      ? gear.description.slice(0, 157) + '...'
      : gear.description;

    return {
      title: `${gear.title} - $${gear.dailyRate}/day | P2P Gear Rental`,
      description: truncatedDescription,
      keywords: [
        gear.title,
        gear.category || 'equipment',
        'rental',
        'photography',
        'videography',
        gear.city,
        gear.state
      ].join(', '),
      openGraph: {
        title: gear.title,
        description: truncatedDescription,
        images: gear.images.slice(0, 1).map(img => ({ url: img })),
        type: 'website'
      },
      twitter: {
        card: 'summary_large_image',
        title: gear.title,
        description: truncatedDescription,
        images: gear.images.slice(0, 1)
      }
    };
  } catch (error) {
    logger.error('Failed to generate gear metadata:', { gearId, error });
    return {
      title: 'Gear Details | P2P Gear Rental',
      description: 'View details for photography and videography equipment available for rent.'
    };
  }
}

// Generate static paths - always return empty for dynamic rendering
export async function generateGearStaticPaths(_limit: number = 50) {
  // Always return empty - we use dynamic rendering
  return { paths: [] };
}

// Get featured gear for homepage - uses internal API
export async function getFeaturedGearSSR(limit: number = 12): Promise<GearItem[]> {
  if (isBuildTime) return [];

  try {
    return await fetchFeaturedGear(limit);
  } catch (error) {
    logger.error('Failed to fetch featured gear for SSR:', { error });
    return [];
  }
}

// Get categories for homepage - uses internal API
export async function getCategoriesSSR(): Promise<CategoryCount[]> {
  const defaultCategories: CategoryCount[] = [
    { name: 'cameras', count: 0 },
    { name: 'lenses', count: 0 },
    { name: 'lighting', count: 0 },
    { name: 'audio', count: 0 },
    { name: 'drones', count: 0 },
    { name: 'accessories', count: 0 }
  ];

  if (isBuildTime) return defaultCategories;

  try {
    const categories = await fetchCategories();
    return categories.length > 0 ? categories : defaultCategories;
  } catch (error) {
    logger.error('Failed to fetch categories for SSR:', { error });
    return defaultCategories;
  }
}

// Cache revalidation utility
export async function revalidateGearCache(gearId: string) {
  logger.info('Revalidating gear cache', { gearId });
  return true;
}

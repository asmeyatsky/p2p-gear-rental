import { Metadata } from 'next';
import { prisma } from '@/lib/database';
import { logger } from './logger';

// Performance measurement utility for SSR
export function measureSSRPerformance(operation: string) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      logger.info(`SSR Performance: ${operation}`, { duration });
      return duration;
    }
  };
}

// Get gear details for SSR with optimized queries
export async function getGearDetailSSR(gearId: string) {
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
            totalReviews: true
          }
        },
        rentals: {
          where: {
            status: { in: ['approved', 'completed'] }
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        _count: {
          select: {
            rentals: true
          }
        }
      }
    });

    if (!gear) {
      return null;
    }

    return {
      ...gear,
      createdAt: gear.createdAt.toISOString(),
      updatedAt: gear.updatedAt.toISOString(),
      rentals: gear.rentals.map(rental => ({
        ...rental,
        startDate: rental.startDate.toISOString(),
        endDate: rental.endDate.toISOString()
      })),
      user: gear.user ? {
        ...gear.user,
        createdAt: undefined,
        updatedAt: undefined
      } : null
    };
  } catch (error) {
    logger.error('Failed to fetch gear details for SSR:', { gearId, error });
    throw error;
  }
}

// Generate metadata for gear pages
export async function generateGearMetadata(gearId: string): Promise<Metadata> {
  try {
    const gear = await prisma.gear.findUnique({
      where: { id: gearId },
      select: {
        title: true,
        description: true,
        images: true,
        dailyRate: true,
        city: true,
        state: true,
        category: true
      }
    });

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

// Generate static paths for popular gear
export async function generateGearStaticPaths(limit: number = 50) {
  try {
    const popularGear = await prisma.gear.findMany({
      take: limit,
      orderBy: [
        { totalReviews: 'desc' },
        { createdAt: 'desc' }
      ],
      select: { id: true }
    });

    return {
      paths: popularGear.map(gear => ({ params: { id: gear.id } }))
    };
  } catch (error) {
    logger.error('Failed to generate static paths for gear:', { error });
    return { paths: [] };
  }
}

// Get featured gear for homepage
export async function getFeaturedGearSSR(limit: number = 12) {
  try {
    const featuredGear = await prisma.gear.findMany({
      take: limit,
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            averageRating: true,
            totalReviews: true
          }
        },
        _count: {
          select: {
            rentals: true
          }
        }
      }
    });

    return featuredGear.map(gear => ({
      ...gear,
      createdAt: gear.createdAt.toISOString(),
      updatedAt: gear.updatedAt.toISOString(),
    }));
  } catch (error) {
    logger.error('Failed to fetch featured gear for SSR:', { error });
    return [];
  }
}

// Get categories for homepage
export async function getCategoriesSSR() {
  try {
    const categories = await prisma.gear.groupBy({
      by: ['category'],
      where: {
        category: { not: null }
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 8
    });

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));
  } catch (error) {
    logger.error('Failed to fetch categories for SSR:', { error });
    return [
      { name: 'cameras', count: 0 },
      { name: 'lenses', count: 0 },
      { name: 'lighting', count: 0 },
      { name: 'audio', count: 0 },
      { name: 'drones', count: 0 },
      { name: 'accessories', count: 0 }
    ];
  }
}

// Cache revalidation utility
export async function revalidateGearCache(gearId: string) {
  // In a real implementation, this would trigger ISR revalidation
  logger.info('Revalidating gear cache', { gearId });
  return true;
}
import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getGearDetailSSR, generateGearMetadata, measureSSRPerformance, revalidateGearCache } from '@/lib/ssr';
import GearDetailsClient from './GearDetailsClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';

async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    return await generateGearMetadata(resolvedParams.id);
  } catch (error) {
    const resolvedParams = await params;
    logger.error('Failed to generate metadata for gear:', { gearId: resolvedParams.id, error });
    return {
      title: 'Gear Details | P2P Gear Rental',
      description: 'View details for photography and videography equipment available for rent.',
    };
  }
}

// Server component for gear details
async function GearDetailsServer({ gearId }: { gearId: string }) {
  const perf = measureSSRPerformance('gear-detail-page');

  try {
    const [gear, session] = await Promise.all([
      getGearDetailSSR(gearId),
      getServerSession()
    ]);
    const currentUserId = session?.user?.id || null;
    perf.end();
    
    if (!gear) {
      notFound();
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
              {gear.images && gear.images.length > 0 ? (
                <Image
                  src={gear.images[0]}
                  alt={gear.title}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg"></div>
                    <p>No image available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Thumbnail images */}
            {gear.images && gear.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {gear.images.slice(1, 5).map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={image}
                      alt={`${gear.title} - View ${index + 2}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Gear Information */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                {gear.category && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                    {gear.category}
                  </span>
                )}
                {gear.condition && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                    {gear.condition}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{gear.title}</h1>
              
              {(gear.brand || gear.model) && (
                <p className="text-lg text-gray-600 mb-4">
                  {[gear.brand, gear.model].filter(Boolean).join(' ')}
                </p>
              )}
              
              {/* Pricing */}
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">
                  ${gear.dailyRate.toFixed(2)}
                  <span className="text-lg font-normal text-gray-600 ml-1">/ day</span>
                </div>
                
                {(gear.weeklyRate || gear.monthlyRate) && (
                  <div className="flex gap-4 text-sm text-gray-600">
                    {gear.weeklyRate && (
                      <span>Weekly: ${gear.weeklyRate.toFixed(2)}</span>
                    )}
                    {gear.monthlyRate && (
                      <span>Monthly: ${gear.monthlyRate.toFixed(2)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            {gear.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{gear.description}</p>
              </div>
            )}
            
            {/* Location */}
            {(gear.city || gear.state) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Location</h2>
                <p className="text-gray-700">
                  {[gear.city, gear.state].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
            
            {/* Owner Information */}
            {gear.user && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Owner</h2>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {gear.user.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{gear.user.full_name || 'Gear Owner'}</p>
                    {gear.user.averageRating && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <span className="text-yellow-400">★</span>
                        <span>{gear.user.averageRating.toFixed(1)}</span>
                        {gear.user.totalReviews && (
                          <span>({gear.user.totalReviews} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Reviews Section */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600">Reviews will be displayed here after rentals are completed.</p>
              </div>
            </div>
            
            {/* Client-side interactive components */}
            <div className="border-t pt-6">
              <GearDetailsClient gear={gear} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    perf.end();
    logger.error('Gear details server error:', { gearId, error });
    throw error;
  }
}

// Main page component
export default async function GearDetailsPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <GearDetailsServer gearId={resolvedParams.id} />
    </Suspense>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Generate static paths for popular gear items
export async function generateStaticParams() {
  try {
    const { generateGearStaticPaths } = await import('@/lib/ssr');
    const { paths } = await generateGearStaticPaths(50); // Generate for top 50 gear items
    
    return paths.map((path: { params: { id: string } }) => ({
      id: path.params.id,
    }));
  } catch (error) {
    logger.error('Failed to generate static params for gear:', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}


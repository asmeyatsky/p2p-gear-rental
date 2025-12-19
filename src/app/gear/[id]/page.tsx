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
import Header from '@/components/Header';

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
      <div className="min-h-screen bg-background overflow-hidden">
        <Header />

        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 px-4 py-6 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
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
                      <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg"></div>
                      <p className="text-sm">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {gear.images && gear.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {gear.images.slice(1, 5).map((image: string, index: number) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 shadow-sm">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {gear.category && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                      {gear.category}
                    </span>
                  )}
                  {gear.condition && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                      {gear.condition}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-1">{gear.title}</h1>

                {(gear.brand || gear.model) && (
                  <p className="text-sm text-gray-500 mb-3">
                    {[gear.brand, gear.model].filter(Boolean).join(' ')}
                  </p>
                )}

                {/* Pricing */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-gray-900">
                    ${gear.dailyRate.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500 ml-1">/ day</span>
                  </div>

                  {(gear.weeklyRate || gear.monthlyRate) && (
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      {gear.weeklyRate && (
                        <span>Weekly: <strong>${gear.weeklyRate.toFixed(2)}</strong></span>
                      )}
                      {gear.monthlyRate && (
                        <span>Monthly: <strong>${gear.monthlyRate.toFixed(2)}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {gear.description && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{gear.description}</p>
                </div>
              )}

              {/* Location */}
              {(gear.city || gear.state) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[gear.city, gear.state].filter(Boolean).join(', ')}
                </div>
              )}

              {/* Owner Information */}
              {gear.user && (
                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Listed by</h2>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {gear.user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{gear.user.full_name || 'Gear Owner'}</p>
                      {gear.user.averageRating && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <span className="text-yellow-500">★</span>
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
              <div className="border-t border-gray-200 pt-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Reviews</h2>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Reviews will be displayed here after rentals are completed.</p>
                </div>
              </div>

              {/* Client-side interactive components */}
              <div className="border-t border-gray-200 pt-4">
                <GearDetailsClient gear={gear} currentUserId={currentUserId} />
              </div>
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

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// Enable ISR with 1 hour revalidation at runtime
export const revalidate = 3600;

// Don't generate static paths - use dynamic rendering instead
export async function generateStaticParams() {
  // Return empty array to skip static generation during build
  // Pages will be generated on-demand at runtime
  return [];
}


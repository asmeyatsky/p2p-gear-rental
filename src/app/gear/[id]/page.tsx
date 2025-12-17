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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 px-1 py-1 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-w-7xl mx-auto">
            {/* Image Gallery */}
            <div className="space-y-1">
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
                      <p className="text-xs">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {gear.images && gear.images.length > 1 && (
                <div className="grid grid-cols-4 gap-1">
                  {gear.images.slice(1, 5).map((image: string, index: number) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded bg-gray-100">
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
            <div className="space-y-3">
              {/* Header */}
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  {gear.category && (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize">
                      {gear.category}
                    </span>
                  )}
                  {gear.condition && (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize">
                      {gear.condition}
                    </span>
                  )}
                </div>

                <h1 className="text-xl font-bold text-white mb-1">{gear.title}</h1>

                {(gear.brand || gear.model) && (
                  <p className="text-xs text-gray-400 mb-2">
                    {[gear.brand, gear.model].filter(Boolean).join(' ')}
                  </p>
                )}

                {/* Pricing */}
                <div className="space-y-1">
                  <div className="text-xl font-bold text-white">
                    ${gear.dailyRate.toFixed(2)}
                    <span className="text-xs font-normal text-gray-400 ml-1">/ day</span>
                  </div>

                  {(gear.weeklyRate || gear.monthlyRate) && (
                    <div className="flex gap-2 text-[10px] text-gray-400">
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
                  <h2 className="text-sm font-semibold text-white mb-2">Description</h2>
                  <p className="text-xs text-gray-300 leading-relaxed">{gear.description}</p>
                </div>
              )}

              {/* Location */}
              {(gear.city || gear.state) && (
                <div>
                  <h2 className="text-sm font-semibold text-white mb-2">Location</h2>
                  <p className="text-xs text-gray-300">
                    {[gear.city, gear.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Owner Information */}
              {gear.user && (
                <div className="border-t border-white/10 pt-2">
                  <h2 className="text-sm font-semibold text-white mb-2">Owner</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {gear.user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{gear.user.full_name || 'Gear Owner'}</p>
                      {gear.user.averageRating && (
                        <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                          <span className="text-yellow-400 text-xs">★</span>
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
              <div className="border-t border-white/10 pt-2">
                <h2 className="text-sm font-semibold text-white mb-2">Reviews</h2>
                <div className="bg-white/5 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                  <p className="text-xs text-gray-400">Reviews will be displayed here after rentals are completed.</p>
                </div>
              </div>

              {/* Client-side interactive components */}
              <div className="border-t border-white/10 pt-2">
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


import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import GearGrid from "@/components/gear/GearGrid";
import SearchFiltersClient from "@/components/gear/SearchFiltersClient";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getFeaturedGearSSR, getCategoriesSSR, measureSSRPerformance } from '@/lib/ssr';
import { logger } from '@/lib/logger';

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'P2P Gear Rental - Rent Photography & Videography Equipment',
    description: 'Find and rent professional photography and videography gear from trusted local providers. Cameras, lenses, lighting, audio equipment and more.',
    keywords: [
      'gear rental',
      'camera rental',
      'photography equipment',
      'videography equipment',
      'lens rental',
      'lighting rental',
      'audio equipment rental'
    ],
    openGraph: {
      title: 'P2P Gear Rental - Professional Equipment Sharing',
      description: 'Discover and rent photography and videography equipment from trusted providers.',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'https://p2p-gear-rental.com',
      siteName: 'P2P Gear Rental',
      images: [
        {
          url: '/images/hero-og.jpg',
          width: 1200,
          height: 630,
          alt: 'P2P Gear Rental Platform',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'P2P Gear Rental - Professional Equipment Sharing',
      description: 'Find and rent photography & videography gear from local providers.',
      images: ['/images/hero-twitter.jpg'],
    },
    alternates: {
      canonical: process.env.NEXT_PUBLIC_BASE_URL || 'https://p2p-gear-rental.com',
    },
  };
}

// Hero section component (static)
function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20 text-center mb-8">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Rent & Share Gear with Ease
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
          Find the perfect gear for your next adventure or list your own to earn extra cash.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/browse" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Browse Gear
          </Link>
          <Link 
            href="/add-gear" 
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
          >
            List Your Gear
          </Link>
        </div>
      </div>
    </section>
  );
}

// Featured gear section (with SSG data)
async function FeaturedGearSection() {
  const perf = measureSSRPerformance('homepage-featured-gear');
  
  try {
    const featuredGear = await getFeaturedGearSSR(8);
    perf.end();
    
    if (!featuredGear || featuredGear.length === 0) {
      return (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Gear</h2>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No featured gear available at the moment.</p>
            <Link 
              href="/browse" 
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Gear
            </Link>
          </div>
        </section>
      );
    }
    
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Featured Gear</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover top-rated photography and videography equipment from our trusted community.
          </p>
        </div>
        <GearGrid gear={featuredGear} />
        <div className="text-center mt-8">
          <Link 
            href="/browse" 
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            View All Gear
          </Link>
        </div>
      </section>
    );
  } catch (error) {
    perf.end();
    logger.error('Failed to load featured gear:', { error: error instanceof Error ? error.message : String(error) });
    
    return (
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Gear</h2>
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600 text-lg">Unable to load featured gear at the moment.</p>
          <Link 
            href="/browse" 
            className="mt-4 inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Browse Gear Instead
          </Link>
        </div>
      </section>
    );
  }
}

// Category showcase section
async function CategoryShowcase() {
  try {
    const categories = await getCategoriesSSR();
    
    if (!categories || categories.length === 0) {
      return null;
    }
    
    return (
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find exactly what you need from our extensive collection of professional equipment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.name}
                href={`/browse?category=${encodeURIComponent(category.name || '')}`}
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow duration-200 border border-gray-100"
              >
                <h3 className="font-semibold text-lg mb-2 text-gray-900 capitalize">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {category.count} item{category.count !== 1 ? 's' : ''} available
                </p>
                <p className="text-blue-600 font-medium">
                  View Category →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    logger.error('Failed to load categories:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// Main homepage component with ISR
export default async function Home() {
  const perf = measureSSRPerformance('homepage-total');
  
  try {
    const result = (
      <div>
        <HeroSection />
        
        {/* Interactive search filters - client component */}
        <div className="container mx-auto px-4 mb-8">
          <SearchFiltersClient />
        </div>
        
        {/* Featured gear with loading fallback */}
        <Suspense fallback={
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Gear</h2>
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </section>
        }>
          <FeaturedGearSection />
        </Suspense>
        
        {/* Category showcase */}
        <Suspense fallback={
          <section className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
                <div className="flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              </div>
            </div>
          </section>
        }>
          <CategoryShowcase />
        </Suspense>
      </div>
    );
    
    perf.end();
    return result;
  } catch (error) {
    perf.end();
    logger.error('Homepage render error:', { error: error instanceof Error ? error.message : String(error) });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Service Temporarily Unavailable</h1>
          <p className="text-red-600 mb-6">We&apos;re experiencing technical difficulties. Please try again in a few moments.</p>
          <Link 
            href="/browse" 
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Browse Page
          </Link>
        </div>
      </div>
    );
  }
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

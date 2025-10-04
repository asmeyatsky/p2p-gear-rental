'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/ui/Layout';
import SearchFiltersClient from '@/components/gear/SearchFiltersClient';
import GearCard from '@/components/gear/GearCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';

interface GearItem {
  id: string;
  title: string;
  description: string;
  dailyRate: number;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  images: string[];
  city: string;
  state: string;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  condition?: string | null;
  averageRating?: number | null;
  totalReviews: number;
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    averageRating?: number | null;
    totalReviews: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface SearchFilters {
  query: string;
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  city: string;
  state: string;
  sortBy: string;
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [gear, setGear] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('query') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
  });

  const fetchGear = useCallback(async (pageNum: number = 1, newFilters?: SearchFilters, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = newFilters || filters;
      const params = new URLSearchParams();
      
      // Add pagination
      params.set('page', pageNum.toString());
      params.set('limit', '20');
      
      // Add filters
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.set(key, value);
        }
      });

      const response = await fetch(`/api/gear?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gear');
      }

      const data = await response.json();
      
      if (reset || pageNum === 1) {
        setGear(data.data || []);
      } else {
        setGear(prev => [...prev, ...(data.data || [])]);
      }
      
      setHasMore(data.pagination?.hasNext || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching gear:', err);
      setError('Failed to load gear. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    fetchGear(1, newFilters, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchGear(page + 1);
    }
  };

  useEffect(() => {
    fetchGear(1, filters, true);
  }, [fetchGear, filters]);

  if (loading && gear.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" text="Loading gear..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Photography & Video Gear
          </h1>
          <p className="text-gray-600">
            Discover thousands of cameras, lenses, and equipment available for rent
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFiltersClient 
          onFiltersChange={handleFiltersChange}
          showAdvanced={true}
        />

        {/* Results */}
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={() => fetchGear(1, filters, true)}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {gear.length > 0 ? `${gear.length} items found` : 'No items found'}
              </h2>
              {filters.query && (
                <p className="text-gray-600">
                  Results for &quot;{filters.query}&quot;
                </p>
              )}
            </div>

            {/* Gear Grid */}
            {gear.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gear.map((item) => (
                  <GearCard key={item.id} gear={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No gear found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or browse all categories
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => handleFiltersChange({
                      query: '',
                      category: '',
                      condition: '',
                      minPrice: '',
                      maxPrice: '',
                      city: '',
                      state: '',
                      sortBy: 'newest',
                    })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Load More */}
            {hasMore && gear.length > 0 && (
              <div className="text-center py-8">
                <Button 
                  onClick={loadMore}
                  loading={loading}
                  variant="outline"
                  size="lg"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
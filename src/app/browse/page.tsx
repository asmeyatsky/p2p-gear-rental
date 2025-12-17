'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import GearCard from '@/components/gear/GearCard';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

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

const categories = [
  { value: '', label: 'All Categories', icon: '📦' },
  { value: 'cameras', label: 'Cameras', icon: '📷' },
  { value: 'lenses', label: 'Lenses', icon: '🔍' },
  { value: 'lighting', label: 'Lighting', icon: '💡' },
  { value: 'audio', label: 'Audio', icon: '🎙️' },
  { value: 'drones', label: 'Drones', icon: '🚁' },
  { value: 'tripods', label: 'Tripods', icon: '📐' },
  { value: 'monitors', label: 'Monitors', icon: '🖥️' },
  { value: 'accessories', label: 'Accessories', icon: '🔧' },
];

const conditions = [
  { value: '', label: 'Any Condition' },
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [gear, setGear] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    state: '',
    sortBy: 'newest',
  });
  const initialFetchDone = useRef(false);

  const fetchGear = async (pageNum: number = 1, currentFilters: SearchFilters, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '24');

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value.trim()) {
          const paramKey = key === 'query' ? 'search' : key;
          params.set(paramKey, value);
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
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const initialFilters: SearchFilters = {
      query: searchParams?.get('query') || '',
      category: searchParams?.get('category') || '',
      condition: searchParams?.get('condition') || '',
      minPrice: searchParams?.get('minPrice') || '',
      maxPrice: searchParams?.get('maxPrice') || '',
      city: searchParams?.get('city') || '',
      state: searchParams?.get('state') || '',
      sortBy: searchParams?.get('sortBy') || 'newest',
    };

    setFilters(initialFilters);
    fetchGear(1, initialFilters, true);
  }, [searchParams]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    fetchGear(1, newFilters, true);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    handleFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      state: '',
      sortBy: 'newest',
    };
    handleFiltersChange(clearedFilters);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchGear(page + 1, filters, false);
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'sortBy' && key !== 'query'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-2 py-3">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-1 text-white">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">GearShare</span>
            </Link>
            <Link
              href="/add-gear"
              className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full hover:bg-white/30 transition-all border border-white/30"
            >
              List Gear
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cameras, lenses..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-full text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-2 py-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <AdjustmentsHorizontalIcon className="w-3 h-3" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white text-blue-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Category Pills */}
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleFilterChange('category', cat.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  filters.category === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="max-w-7xl mx-auto px-2 py-2">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {/* Condition */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Condition</label>
                    <select
                      value={filters.condition}
                      onChange={(e) => handleFilterChange('condition', e.target.value)}
                      className="w-full px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {conditions.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Min Price */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Min Price</label>
                    <input
                      type="number"
                      placeholder="$0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Max Price</label>
                    <input
                      type="number"
                      placeholder="$500"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">City</label>
                    <input
                      type="text"
                      placeholder="Any city"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="w-full px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {sortOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-0.5"
                    >
                      <XMarkIcon className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-2 py-2">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-700">
            {loading ? 'Loading...' : `${gear.length} items found`}
          </div>
          {filters.query && (
            <div className="text-xs text-gray-600">
              Results for "<span className="font-medium text-gray-800">{filters.query}</span>"
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => { initialFetchDone.current = false; fetchGear(1, filters, true); }}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && gear.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                <div className="h-28 bg-gray-200" />
                <div className="p-2 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gear Grid */}
        {!error && gear.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
          >
            {gear.map((item, index) => (
              <GearCard key={item.id} gear={item} index={index} />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && gear.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CameraIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">No gear found</h3>
            <p className="text-sm text-gray-600 mb-3">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Load More */}
        {hasMore && gear.length > 0 && (
          <div className="text-center py-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium shadow-sm text-sm"
            >
              {loading ? 'Loading...' : 'Load More'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

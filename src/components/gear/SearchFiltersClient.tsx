'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

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

interface SearchFiltersClientProps {
  onFiltersChange?: (filters: SearchFilters) => void;
  showAdvanced?: boolean;
}

export default function SearchFiltersClient({ 
  onFiltersChange, 
  showAdvanced = false 
}: SearchFiltersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  useEffect(() => {
    if (searchParams) {
      setFilters({
        query: searchParams.get('query') || '',
        category: searchParams.get('category') || '',
        condition: searchParams.get('condition') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        city: searchParams.get('city') || '',
        state: searchParams.get('state') || '',
        sortBy: searchParams.get('sortBy') || 'newest',
      });
    }
  }, [searchParams]);

  const [showFilters, setShowFilters] = useState(showAdvanced);

  const categories = [
    'cameras',
    'lenses', 
    'lighting',
    'audio',
    'drones',
    'accessories',
    'tripods',
    'monitors',
    'other'
  ];

  const conditions = [
    'new',
    'like-new',
    'good',
    'fair',
    'poor'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Distance' },
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.push(`/browse?${params.toString()}`);
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
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 p-2">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search cameras, lenses..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleSearch} size="sm" className="text-xs px-3 py-1">
          Search
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs px-2 py-1"
        >
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t mt-2 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-2">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Min $</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                min="0"
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Max $</label>
              <input
                type="number"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                min="0"
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">City</label>
              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">State</label>
              <input
                type="text"
                placeholder="CA"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                maxLength={2}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Sort</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} size="sm" className="text-xs px-2 py-1">
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs px-2 py-1">
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
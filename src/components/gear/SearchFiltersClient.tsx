'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
    query: searchParams.get('query') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
  });

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

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Search Bar */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search for cameras, lenses, lighting..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch} className="px-6">
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="px-4"
        >
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Condition</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <Input
                type="number"
                placeholder="$0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <Input
                type="number"
                placeholder="$1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                type="text"
                placeholder="San Francisco"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <Input
                type="text"
                placeholder="CA"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                maxLength={2}
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex gap-3">
            <Button onClick={handleSearch}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
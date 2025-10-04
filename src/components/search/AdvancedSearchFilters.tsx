'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  search: string;
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  availability: {
    startDate: string;
    endDate: string;
  };
  sortBy: 'newest' | 'price-low' | 'price-high' | 'distance' | 'rating';
  radius: number; // in miles
  showMap: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

const categories = [
  'cameras',
  'lenses',
  'lighting',
  'audio',
  'drones',
  'accessories',
  'tripods',
  'monitors',
  'other',
];

const conditions = [
  'new',
  'like-new',
  'good',
  'fair',
  'poor',
];

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  className,
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const updateAvailability = (key: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      availability: {
        ...filters.availability,
        [key]: value,
      },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      availability: {
        startDate: '',
        endDate: '',
      },
      sortBy: 'newest',
      radius: 25,
      showMap: false,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.category ||
    filters.condition ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.location ||
    filters.availability.startDate ||
    filters.availability.endDate ||
    filters.sortBy !== 'newest';

  return (
    <div className={cn('bg-white rounded-lg shadow-md border', className)}>
      {/* Main search bar */}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search gear by name, brand, or description..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'px-4 py-3 border rounded-lg font-medium transition-colors',
              isExpanded
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                !
              </span>
            )}
          </button>

          <button
            onClick={() => updateFilter('showMap', !filters.showMap)}
            className={cn(
              'px-4 py-3 border rounded-lg font-medium transition-colors',
              filters.showMap
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            {filters.showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Condition</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price ($/day)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price ($/day)
              </label>
              <input
                type="number"
                min="0"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City, State or ZIP"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Search Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius ({filters.radius} miles)
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={filters.radius}
                onChange={(e) => updateFilter('radius', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="distance">Nearest First</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Availability Dates */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Availability (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.availability.startDate}
                  onChange={(e) => updateAvailability('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.availability.endDate}
                  onChange={(e) => updateAvailability('endDate', e.target.value)}
                  min={filters.availability.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center border-t border-gray-200 pt-4">
            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear all filters
            </button>

            <div className="text-sm text-gray-500">
              {hasActiveFilters && 'Filters applied'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchFilters {
  query: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  condition: string;
}

interface QuickFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRanges: Array<{ min: number; max: number; label: string }>;
  selectedRange: { min: number; max: number } | null;
  onRangeChange: (range: { min: number; max: number } | null) => void;
}

export function QuickFilters({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  priceRanges, 
  selectedRange, 
  onRangeChange 
}: QuickFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Filters</h3>
      
      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                ${selectedCategory === category 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => onRangeChange(
                selectedRange?.min === range.min && selectedRange?.max === range.max 
                  ? null 
                  : { min: range.min, max: range.max }
              )}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                ${selectedRange?.min === range.min && selectedRange?.max === range.max 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
                }
              `}
            >
              <div className="text-center">
                <div className="text-xs text-gray-500">${range.min}</div>
                <div className="text-xs text-gray-500">-</div>
                <div className="text-xs text-gray-500">${range.max}</div>
              </div>
              <div className="text-xs mt-1">{range.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          onCategoryChange('All');
          onRangeChange(null);
        }}
        className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <XMarkIcon className="w-4 h-4 mr-2" />
        Clear All Filters
      </button>
    </div>
  );
}

export function AdvancedSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
      setIsExpanded(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Search</h3>
        
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by title, brand, model, or description..."
              className="w-full px-4 py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full px-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Search Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use specific keywords (e.g., "Canon 5D" instead of "camera")</li>
            <li>• Try different search terms if you don't find what you're looking for</li>
            <li>• Use filters to narrow down results</li>
            <li>• Search by location or category for better results</li>
          </ul>
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
      >
        {isExpanded ? (
          <>
            <FunnelIcon className="h-4 w-4 mr-2" />
            Show Less
          </>
        ) : (
          <>
            <FunnelIcon className="h-4 w-4 mr-2" />
            Show More Options
          </>
        )}
      </button>
    </div>
  );
}
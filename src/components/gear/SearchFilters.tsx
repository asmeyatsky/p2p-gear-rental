'use client';

import { useState } from 'react';

interface SearchFiltersProps {
  onSearch: (filters: { searchTerm: string; category: string; minPrice: number; maxPrice: number; city: string; state: string; startDate: string; endDate: string }) => void;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ searchTerm, category, minPrice, maxPrice, city, state, startDate, endDate });
  };

  return (
    <form onSubmit={handleSearch} className="bg-gray-100 p-4 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search for gear..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded-md"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">All Categories</option>
          <option value="cameras">Cameras</option>
          <option value="lenses">Lenses</option>
          <option value="lighting">Lighting</option>
          <option value="audio">Audio</option>
          <option value="drones">Drones</option>
        </select>
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(parseFloat(e.target.value))}
          className="p-2 border rounded-md"
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
          className="p-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="p-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="p-2 border rounded-md"
        />
        <input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border rounded-md"
        />
        <input
          type="date"
          placeholder="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 col-span-full"
        >
          Search
        </button>
      </div>
    </form>

  );
}

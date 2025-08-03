'use client';

import { useState } from 'react';

interface SearchFiltersProps {
  onSearch: (filters: { searchTerm: string; category: string }) => void;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ searchTerm, category });
  };

  return (
    <form onSubmit={handleSearch} className="bg-gray-100 p-4 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState, useEffect } from 'react';
import GearGrid from "@/components/gear/GearGrid";
import SearchFilters from "@/components/gear/SearchFilters";

export default function Home() {
  const [gear, setGear] = useState([]);
  const [filteredGear, setFilteredGear] = useState([]);

  useEffect(() => {
    const fetchGear = async () => {
      const res = await fetch('/api/gear');
      const data = await res.json();
      setGear(data);
      setFilteredGear(data);
    };

    fetchGear();
  }, []);

  const handleSearch = ({ searchTerm, category }: { searchTerm: string; category: string }) => {
    let filtered = gear;

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }

    setFilteredGear(filtered);
  };

  return (
    <div>
      <SearchFilters onSearch={handleSearch} />
      <h1 className="text-3xl font-bold mb-8">Featured Gear</h1>
      <GearGrid gear={filteredGear} />
    </div>
  );
}

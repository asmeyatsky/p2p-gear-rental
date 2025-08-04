'use client';

import { useState, useEffect } from 'react';
import GearGrid from "@/components/gear/GearGrid";
import SearchFilters from "@/components/gear/SearchFilters";
import { GearItem } from '@/types';

export default function Home() {
  const [gear, setGear] = useState<GearItem[]>([]);
  const [filteredGear, setFilteredGear] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGear = async () => {
      try {
        const res = await fetch('/api/gear');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setGear(Array.isArray(data) ? data : []);
        setFilteredGear(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch gear:", error);
        setGear([]);
        setFilteredGear([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGear();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading gear...</div>;
  }

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

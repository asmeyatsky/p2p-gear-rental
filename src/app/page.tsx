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

  const handleSearch = async ({ searchTerm, category, minPrice, maxPrice, city, state }: { searchTerm: string; category: string; minPrice: number; maxPrice: number; city: string; state: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(category && { category }),
        minPrice: minPrice.toString(),
        maxPrice: maxPrice.toString(),
        ...(city && { city }),
        ...(state && { state }),
      });
      const res = await fetch(`/api/gear?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGear(Array.isArray(data) ? data : []);
      setFilteredGear(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch gear with filters:", error);
      setGear([]);
      setFilteredGear([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-blue-600 text-white py-20 text-center mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Rent & Share Gear with Ease</h1>
          <p className="text-xl mb-8">Find the perfect gear for your next adventure or list your own to earn extra cash.</p>
          <div className="space-x-4">
            <Link href="/browse" className="bg-white text-blue-600 px-8 py-3 rounded-md text-lg font-semibold hover:bg-gray-100 transition-colors">
              Browse Gear
            </Link>
            <Link href="/add-gear" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              List Your Gear
            </Link>
          </div>
        </div>
      </div>
      <SearchFilters onSearch={handleSearch} />
      <h1 className="text-3xl font-bold mb-8">Featured Gear</h1>
      {loading ? (
        <div className="text-center py-8">Loading gear...</div>
      ) : (
        <GearGrid gear={filteredGear} />
      )}
    </div>
  );
}

'use client';

import GearCard from './GearCard';
import { GearItem } from '@/types';

interface GearGridProps {
  gear: GearItem[];
}

export default function GearGrid({ gear }: GearGridProps) {
  if (gear.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No gear found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gear.map((item: GearItem) => (
        <GearCard key={item.id} gear={item} />
      ))}
    </div>
  );
}

'use client';

import GearCard from './GearCard';

interface GearGridProps {
  gear: any[];
}

export default function GearGrid({ gear }: GearGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gear.map((item) => (
        <GearCard key={item.id} gear={item} />
      ))}
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GearItem } from '@/types';

interface GearCardProps {
  gear: GearItem;
}

export default function GearCard({ gear }: GearCardProps) {
  const displayImage = gear.images[0] || '/placeholder-gear.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/gear/${gear.id}`}>
        <div className="relative h-48 w-full">
          <Image
            src={displayImage}
            alt={gear.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/gear/${gear.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate">
            {gear.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-2">
          {gear.city}, {gear.state}
        </p>
        
        <div className="text-lg font-bold text-gray-900">
          ${gear.dailyRate.toFixed(2)}
          <span className="text-sm text-gray-500"> / day</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { GearItem } from '@/types';
import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid';

interface GearCardProps {
  gear: GearItem;
  priority?: boolean;
  index?: number;
}

// Helper to parse images from JSON string or array
function parseImages(images: string | string[] | undefined): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function GearCard({ gear, priority = false, index = 0 }: GearCardProps) {
  const images = parseImages(gear.images);
  const displayImage = images[0] || '/placeholder-gear.jpg';
  const hasMultipleImages = images.length > 1;
  const rating = 4.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/gear/${gear.id}`} className="block">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
          {/* Image Section */}
          <div className="relative h-28 w-full overflow-hidden bg-gray-100">
            <Image
              src={displayImage}
              alt={gear.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              priority={priority}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Category Badge */}
            {gear.category && (
              <div className="absolute top-1 left-1">
                <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                  {gear.category}
                </span>
              </div>
            )}

            {/* Image Count */}
            {hasMultipleImages && (
              <div className="absolute top-1 right-1">
                <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {images.length}
                </span>
              </div>
            )}

            {/* Price Badge - Appears on Hover */}
            <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                ${gear.dailyRate}/day
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-2">
            {/* Title */}
            <h3 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-0.5 line-clamp-1">
              {gear.title}
            </h3>

            {/* Brand/Model */}
            {(gear.brand || gear.model) && (
              <p className="text-[10px] text-gray-500 mb-1 truncate">
                {gear.brand && gear.model
                  ? `${gear.brand} ${gear.model}`
                  : gear.brand || gear.model
                }
              </p>
            )}

            {/* Location & Rating Row */}
            <div className="flex items-center justify-between text-[10px]">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${gear.city}, ${gear.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-gray-500 hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPinIcon className="w-2.5 h-2.5" />
                <span className="truncate">{gear.city}, {gear.state}</span>
              </a>
              <div className="flex items-center gap-0.5 text-amber-500">
                <StarIcon className="w-2.5 h-2.5 fill-current" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
              <div>
                <span className="text-base font-bold text-gray-900">${gear.dailyRate}</span>
                <span className="text-[9px] text-gray-500">/day</span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-green-600 font-medium">Avail</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GearItem } from '@/types';
import Card from '../ui/Card';

interface GearCardProps {
  gear: GearItem;
  priority?: boolean;
}

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ filled = false }) => (
  <svg
    className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function GearCard({ gear, priority = false }: GearCardProps) {
  const displayImage = gear.images?.[0] || '/placeholder-gear.jpg';
  const hasMultipleImages = gear.images && gear.images.length > 1;
  
  // Mock rating data (would come from database in real app)
  const rating = 4.5;
  const reviewCount = 12;

  return (
    <Card 
      padding="none" 
      hoverable 
      className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image Section */}
      <Link href={`/gear/${gear.id}`} className="block relative">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={displayImage}
            alt={gear.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
          
          {/* Image overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Multiple images indicator */}
          {hasMultipleImages && (
            <div className="absolute top-3 right-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700 flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{gear.images.length}</span>
              </div>
            </div>
          )}
          
          {/* Category badge */}
          {gear.category && (
            <div className="absolute top-3 left-3">
              <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                {gear.category}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <Link href={`/gear/${gear.id}`} className="block group/title">
          <h3 className="text-lg font-semibold text-gray-900 group-hover/title:text-primary-600 transition-colors mb-2 line-clamp-2 leading-tight">
            {gear.title}
          </h3>
        </Link>

        {/* Brand/Model */}
        {(gear.brand || gear.model) && (
          <p className="text-sm text-gray-500 mb-2">
            {gear.brand && gear.model 
              ? `${gear.brand} ${gear.model}`
              : gear.brand || gear.model
            }
          </p>
        )}

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <LocationIcon />
          <span className="ml-1">{gear.city}, {gear.state}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} filled={i < Math.floor(rating)} />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)} ({reviewCount})
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${gear.dailyRate.toFixed(0)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/ day</span>
            {gear.weeklyRate && (
              <div className="text-xs text-gray-500 mt-1">
                ${gear.weeklyRate.toFixed(0)}/week
              </div>
            )}
          </div>
          
          {/* Availability indicator */}
          <div className="text-right">
            <div className="flex items-center space-x-1 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Available</span>
            </div>
          </div>
        </div>

        {/* Condition (if available) */}
        {gear.condition && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Condition: <span className="font-medium text-gray-700">{gear.condition}</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

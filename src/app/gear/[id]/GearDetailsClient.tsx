'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface GearDetailsClientProps {
  gear: {
    id: string;
    title: string;
    description: string;
    dailyRate: number;
    weeklyRate?: number | null;
    monthlyRate?: number | null;
    images: string[];
    city: string;
    state: string;
    category?: string | null;
    brand?: string | null;
    model?: string | null;
    condition?: string | null;
    user?: {
      id: string;
      email: string;
      full_name?: string | null;
      averageRating?: number | null;
      totalReviews: number;
    } | null;
  };
}

export default function GearDetailsClient({ gear }: GearDetailsClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      <div className="grid grid-cols-4 gap-2">
        {gear.images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImageIndex(index)}
            className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
              index === selectedImageIndex 
                ? 'border-blue-500' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img 
              src={image} 
              alt={`${gear.title} - Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Gear Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{gear.title}</h1>
          <p className="text-gray-600 mt-2">{gear.description}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
            ${gear.dailyRate}/day
          </div>
          {gear.weeklyRate && (
            <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 font-medium">
              ${gear.weeklyRate}/week
            </div>
          )}
          {gear.monthlyRate && (
            <div className="bg-purple-50 px-3 py-1 rounded-full text-purple-700 font-medium">
              ${gear.monthlyRate}/month
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Location:</span> {gear.city}, {gear.state}
          </div>
          {gear.category && (
            <div>
              <span className="font-semibold">Category:</span> {gear.category}
            </div>
          )}
          {gear.brand && (
            <div>
              <span className="font-semibold">Brand:</span> {gear.brand}
            </div>
          )}
          {gear.condition && (
            <div>
              <span className="font-semibold">Condition:</span> {gear.condition}
            </div>
          )}
        </div>

        {gear.user && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Owner</h3>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {gear.user.full_name?.charAt(0) || gear.user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{gear.user.full_name || gear.user.email}</p>
                {gear.user.averageRating && gear.user.totalReviews > 0 && (
                  <p className="text-sm text-gray-600">
                    ⭐ {gear.user.averageRating.toFixed(1)} ({gear.user.totalReviews} reviews)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button className="w-full">
            Request Rental
          </Button>
          <Button variant="outline" className="w-full">
            Message Owner
          </Button>
        </div>
      </div>
    </div>
  );
}
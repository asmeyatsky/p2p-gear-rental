'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import AvailabilityCalendar from '@/components/gear/AvailabilityCalendar';
import { apiUrl } from '@/lib/api';

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
  currentUserId?: string | null;
}

export default function GearDetailsClient({ gear, currentUserId }: GearDetailsClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnGear = currentUserId === gear.user?.id;

  const calculateTotalPrice = useCallback(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 0;

    // Apply weekly/monthly rates if applicable
    if (days >= 30 && gear.monthlyRate) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return months * gear.monthlyRate + remainingDays * gear.dailyRate;
    }
    if (days >= 7 && gear.weeklyRate) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return weeks * gear.weeklyRate + remainingDays * gear.dailyRate;
    }
    return days * gear.dailyRate;
  }, [startDate, endDate, gear.dailyRate, gear.weeklyRate, gear.monthlyRate]);

  const handleRequestRental = useCallback(() => {
    if (!currentUserId) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/gear/${gear.id}`));
      return;
    }
    setShowRentalModal(true);
  }, [currentUserId, router, gear.id]);

  const handleMessageOwner = useCallback(() => {
    if (!currentUserId) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/gear/${gear.id}`));
      return;
    }
    if (gear.user?.id) {
      router.push(`/messages?userId=${gear.user.id}&gearId=${gear.id}`);
    }
  }, [currentUserId, router, gear.id, gear.user?.id]);

  const handleSubmitRental = useCallback(async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setError('Start date cannot be in the past');
      return;
    }

    if (end <= start) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Optimistically close modal and show loading on next page
      const response = await fetch(apiUrl('/api/rentals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gearId: gear.id,
          startDate: startDate + 'T00:00:00.000Z',
          endDate: endDate + 'T00:00:00.000Z',
          totalPrice: calculateTotalPrice(),
        }),
        // Enable keepalive for better reliability
        keepalive: true,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create rental request');
      }

      const { rental: createdRental } = await response.json();

      // Close modal before navigation for smoother UX
      setShowRentalModal(false);

      // Use router.push with shallow routing for faster perceived navigation
      await router.push(`/rentals/${createdRental.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [startDate, endDate, gear.id, calculateTotalPrice, router]);

  const totalPrice = calculateTotalPrice();
  const rentalDays = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-2">
      {/* Image Gallery */}
      {gear.images.length > 0 && (
        <>
          <div className="aspect-video rounded overflow-hidden bg-gray-100 relative">
            <Image
              src={gear.images[selectedImageIndex]}
              alt={`${gear.title} - Main Image`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              priority
              quality={90}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
            />
          </div>
          {gear.images.length > 1 && (
            <div className="grid grid-cols-4 gap-1">
              {gear.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square rounded overflow-hidden border transition-colors relative ${
                    index === selectedImageIndex
                      ? 'border-white'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${gear.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 150px"
                    loading="lazy"
                    quality={75}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Gear Info */}
      <div className="space-y-3">
        <div>
          <h1 className="text-base font-bold text-white">{gear.title}</h1>
          <p className="text-xs text-gray-400 mt-1">{gear.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20">
            ${gear.dailyRate}/day
          </div>
          {gear.weeklyRate && (
            <div className="bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20">
              ${gear.weeklyRate}/week
            </div>
          )}
          {gear.monthlyRate && (
            <div className="bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20">
              ${gear.monthlyRate}/month
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-semibold text-gray-400">Location:</span> <span className="text-gray-300">{gear.city}, {gear.state}</span>
          </div>
          {gear.category && (
            <div>
              <span className="font-semibold text-gray-400">Category:</span> <span className="text-gray-300">{gear.category}</span>
            </div>
          )}
          {gear.brand && (
            <div>
              <span className="font-semibold text-gray-400">Brand:</span> <span className="text-gray-300">{gear.brand}</span>
            </div>
          )}
          {gear.condition && (
            <div>
              <span className="font-semibold text-gray-400">Condition:</span> <span className="text-gray-300">{gear.condition}</span>
            </div>
          )}
        </div>

        {gear.user && (
          <div className="border-t border-white/10 pt-2">
            <h3 className="font-semibold text-xs text-gray-400 mb-1">Owner</h3>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                {gear.user.full_name?.charAt(0) || gear.user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium text-white">{gear.user.full_name || gear.user.email}</p>
                {gear.user.averageRating && gear.user.totalReviews > 0 ? (
                  <p className="text-[10px] text-gray-400">
                    <span className="text-yellow-500 text-xs">★</span> {gear.user.averageRating.toFixed(1)} ({gear.user.totalReviews} reviews)
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500">New owner</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {isOwnGear ? (
            <Button
              onClick={() => router.push(`/gear/${gear.id}/edit`)}
              className="w-full text-xs py-1.5"
            >
              Edit Listing
            </Button>
          ) : (
            <>
              <Button
                onClick={handleRequestRental}
                className="w-full text-xs py-1.5"
              >
                Request Rental
              </Button>
              <Button
                variant="outline"
                onClick={handleMessageOwner}
                className="w-full text-xs py-1.5"
              >
                Message Owner
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rental Request Modal */}
      {showRentalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-3 space-y-2 border border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">Request Rental</h2>
              <button
                onClick={() => setShowRentalModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {/* Availability Calendar */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Select Dates
                </label>
                <AvailabilityCalendar
                  gearId={gear.id}
                  selectedStart={startDate}
                  selectedEnd={endDate}
                  onDateSelect={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </div>

              {rentalDays > 0 && (
                <div className="bg-white/5 backdrop-blur-sm p-2 rounded border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
                    <span className="text-gray-300">${gear.dailyRate}/day</span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm border-t border-white/10 pt-1">
                    <span className="text-gray-300">Total</span>
                    <span className="text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/50 text-red-300 px-2 py-1.5 rounded text-xs">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmitRental}
                disabled={isSubmitting || !startDate || !endDate}
                className="w-full text-xs py-1.5 bg-sky-500 hover:bg-sky-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>

              <p className="text-[9px] text-gray-500 text-center">
                You won&apos;t be charged until the owner accepts your request
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

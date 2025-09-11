'use client';

import { useEffect, useRef, useState } from 'react';
// import Map, { Marker, Popup, ViewState } from 'react-map-gl';
import { GearItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapViewProps {
  gearItems: GearItem[];
  center?: { latitude: number; longitude: number };
  className?: string;
  onMarkerClick?: (gear: GearItem) => void;
}

interface GearWithCoordinates extends GearItem {
  coordinates?: { latitude: number; longitude: number };
}

export default function MapView({
  gearItems,
  center,
  className = '',
  onMarkerClick,
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: center?.longitude || -122.4194,
    latitude: center?.latitude || 37.7749,
    zoom: 10,
  });
  
  const [selectedGear, setSelectedGear] = useState<GearWithCoordinates | null>(null);
  const [gearWithCoords, setGearWithCoords] = useState<GearWithCoordinates[]>([]);

  // Geocode gear locations (in a real app, you'd store coordinates in the database)
  useEffect(() => {
    const geocodeGear = async () => {
      const geocodedGear: GearWithCoordinates[] = [];
      
      for (const gear of gearItems) {
        try {
          // Mock geocoding - in production, use a real geocoding service
          const coords = await mockGeocode(gear.city, gear.state);
          geocodedGear.push({
            ...gear,
            coordinates: coords,
          });
        } catch (error) {
          console.error('Geocoding failed for gear:', gear.id, error);
          // Add without coordinates to exclude from map
          geocodedGear.push(gear);
        }
      }
      
      setGearWithCoords(geocodedGear);
    };

    if (gearItems.length > 0) {
      geocodeGear();
    }
  }, [gearItems]);

  // Auto-fit map to show all markers
  useEffect(() => {
    if (gearWithCoords.length > 0 && mapRef.current) {
      const validCoords = gearWithCoords
        .filter(gear => gear.coordinates)
        .map(gear => gear.coordinates!);
      
      if (validCoords.length > 0) {
        const bounds = calculateBounds(validCoords);
        mapRef.current.fitBounds(
          [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
          { padding: 50 }
        );
      }
    }
  }, [gearWithCoords]);

  const handleMarkerClick = (gear: GearWithCoordinates) => {
    setSelectedGear(gear);
    onMarkerClick?.(gear);
  };

  return (
    <div className={`relative ${className}`} style={{ minHeight: '400px' }}>
      {/* <Map
        ref={mapRef}
        {...viewState}
        onViewStateChange={(viewState) => setViewState(viewState.viewState)}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        width="100%"
        height="100%"
        style={{ width: '100%', height: '100%' }}
        onClick={() => setSelectedGear(null)}
      > */}
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map View Coming Soon</h3>
          <p className="text-gray-600">Interactive map with gear locations will be available soon</p>
        </div>
      </div>
      {/* Map functionality temporarily disabled
        {gearWithCoords
          .filter(gear => gear.coordinates)
          .map((gear) => (
            <Marker
              key={gear.id}
              longitude={gear.coordinates!.longitude}
              latitude={gear.coordinates!.latitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(gear);
              }}
            >
              <div className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-lg cursor-pointer hover:bg-blue-700 transform hover:scale-105 transition-all">
                {formatCurrency(gear.dailyRate)}
              </div>
            </Marker>
          ))}

        {selectedGear && selectedGear.coordinates && (
          <Popup
            longitude={selectedGear.coordinates.longitude}
            latitude={selectedGear.coordinates.latitude}
            anchor="bottom"
            onClose={() => setSelectedGear(null)}
            closeOnClick={false}
            className="map-popup"
          >
            <div className="p-3 max-w-xs">
              <div className="flex gap-3">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={selectedGear.images[0] || '/placeholder-gear.jpg'}
                    alt={selectedGear.title}
                    fill
                    className="object-cover rounded"
                    sizes="64px"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/gear/${selectedGear.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 block truncate"
                  >
                    {selectedGear.title}
                  </Link>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {selectedGear.brand} {selectedGear.model}
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    {selectedGear.city}, {selectedGear.state}
                  </p>
                  
                  <div className="mt-1">
                    <span className="font-semibold text-lg text-green-600">
                      {formatCurrency(selectedGear.dailyRate)}
                    </span>
                    <span className="text-sm text-gray-500"> / day</span>
                  </div>
                </div>
              </div>
              
              <Link
                href={`/gear/${selectedGear.id}`}
                className="mt-3 block w-full bg-blue-600 text-white text-center py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View Details
              </Link>
            </div>
          </Popup>
        )}
      </Map> */}

      {/* Map controls temporarily disabled
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setViewState(prev => ({
                    ...prev,
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                    zoom: 12,
                  }));
                },
                (error) => {
                  console.error('Geolocation error:', error);
                }
              );
            }
          }}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Go to my location"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
      </div> */}

      {/* Loading overlay temporarily disabled
      {gearItems.length > 0 && gearWithCoords.length === 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )} */}
    </div>
  );
}

// Mock geocoding function - replace with real service in production
async function mockGeocode(city: string, state: string): Promise<{ latitude: number; longitude: number }> {
  // Mock coordinates for common cities
  const mockCoords: Record<string, { latitude: number; longitude: number }> = {
    'San Francisco, CA': { latitude: 37.7749, longitude: -122.4194 },
    'Los Angeles, CA': { latitude: 34.0522, longitude: -118.2437 },
    'New York, NY': { latitude: 40.7128, longitude: -74.0060 },
    'Chicago, IL': { latitude: 41.8781, longitude: -87.6298 },
    'Austin, TX': { latitude: 30.2672, longitude: -97.7431 },
    'Seattle, WA': { latitude: 47.6062, longitude: -122.3321 },
  };

  const key = `${city}, ${state}`;
  const coords = mockCoords[key];
  
  if (coords) {
    return coords;
  }
  
  // Return random coordinates in the US for unknown locations
  return {
    latitude: 39.8283 + (Math.random() - 0.5) * 10,
    longitude: -98.5795 + (Math.random() - 0.5) * 40,
  };
}

function calculateBounds(coordinates: { latitude: number; longitude: number }[]) {
  if (coordinates.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  return { minLat, maxLat, minLng, maxLng };
}
'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import ImageUpload from '../../components/ImageUpload';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import { event } from '../../lib/gtag';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiUrl } from '../../lib/api';

export default function AddGearPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('');
  const [insuranceRequired, setInsuranceRequired] = useState(false);
  const [insuranceRate, setInsuranceRate] = useState('10');
  const [replacementValue, setReplacementValue] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Published!</h2>
            <p className="text-gray-600 mb-4">Your gear is now live and visible to renters.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecting to your listing...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/gear'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent with the request
        body: JSON.stringify({
          title,
          description,
          dailyRate: parseFloat(dailyRate),
          weeklyRate: weeklyRate ? parseFloat(weeklyRate) : undefined,
          monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
          city,
          state,
          zipCode: zipCode || undefined,
          images,
          category,
          brand,
          model,
          condition,
          insuranceRequired,
          insuranceRate: parseFloat(insuranceRate) / 100, // Convert percentage to decimal
          replacementValue: replacementValue ? parseFloat(replacementValue) : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        if (res.status === 401) {
          toast.error('Please log in to list your gear');
          router.push('/auth/login?redirectTo=/add-gear');
          return;
        }
        throw new Error(errorData.error || errorData.message || 'Failed to add gear');
      }

      const data = await res.json();

      setSuccess(true);
      toast.success('Gear listed successfully!');
      event({
        action: 'add_gear',
        category: 'gear_management',
        label: 'new_gear_listing',
        value: 1,
      });

      // Redirect after showing success
      setTimeout(() => {
        router.push(data.id ? `/gear/${data.id}` : '/browse');
      }, 1500);
    } catch (err: unknown) {
      console.error('Error adding gear:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      <Header />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">List Your Gear</h1>
              <p className="mt-2 text-gray-600">
                Share your photography and videography equipment with the community
              </p>
            </div>
            <Link
              href="/add-gear/bulk"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap ml-4"
            >
              Bulk Upload (CSV) →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Gear Title
                    </label>
                    <Input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g., Canon EOS R5 Mirrorless Camera"
                      className="w-full"
                    />
                    <p className="mt-1 text-sm text-gray-500">Be specific and descriptive to attract more renters</p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                      placeholder="Describe your gear, its condition, what's included, and any special features..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Include details about condition, accessories, and usage guidelines
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                      >
                        <option value="">Select a category</option>
                        <option value="cameras">📷 Cameras</option>
                        <option value="lenses">🔍 Lenses</option>
                        <option value="lighting">💡 Lighting</option>
                        <option value="audio">🎙️ Audio</option>
                        <option value="drones">🚁 Drones</option>
                        <option value="tripods">📐 Tripods & Support</option>
                        <option value="accessories">🔧 Accessories</option>
                        <option value="other">📦 Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        id="condition"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                      >
                        <option value="">Select condition</option>
                        <option value="new">✨ New - Never used</option>
                        <option value="like-new">🆕 Like New - Minimal use</option>
                        <option value="good">👍 Good - Light wear</option>
                        <option value="fair">👌 Fair - Noticeable wear</option>
                        <option value="poor">⚠️ Poor - Heavy wear</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      <Input
                        type="text"
                        id="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g., Canon, Sony, Nikon"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <Input
                        type="text"
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g., EOS R5, A7 IV"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        id="dailyRate"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        required
                        step="0.01"
                        placeholder="50.00"
                        className="w-full pl-7"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Per day rental rate</p>
                  </div>

                  <div>
                    <label htmlFor="weeklyRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Weekly Rate (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        id="weeklyRate"
                        value={weeklyRate}
                        onChange={(e) => setWeeklyRate(e.target.value)}
                        step="0.01"
                        placeholder="300.00"
                        className="w-full pl-7"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Discounted weekly rate</p>
                  </div>

                  <div>
                    <label htmlFor="monthlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Rate (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        id="monthlyRate"
                        value={monthlyRate}
                        onChange={(e) => setMonthlyRate(e.target.value)}
                        step="0.01"
                        placeholder="1000.00"
                        className="w-full pl-7"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Discounted monthly rate</p>
                  </div>
                </div>
              </div>

              {/* Insurance & Protection */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Insurance & Protection</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Protect your gear by requiring insurance for renters. The insurance premium is automatically calculated and added to the rental price.
                </p>

                <div className="space-y-4">
                  {/* Insurance Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label htmlFor="insuranceRequired" className="text-sm font-medium text-gray-900">
                        Require Insurance
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Renters will pay an insurance premium to protect your gear
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="insuranceRequired"
                        checked={insuranceRequired}
                        onChange={(e) => setInsuranceRequired(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Conditional Insurance Options */}
                  {insuranceRequired && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div>
                        <label htmlFor="insuranceRate" className="block text-sm font-medium text-gray-700 mb-1">
                          Insurance Rate (%)
                        </label>
                        <select
                          id="insuranceRate"
                          value={insuranceRate}
                          onChange={(e) => setInsuranceRate(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                        >
                          <option value="5">5% - Basic Coverage</option>
                          <option value="8">8% - Standard Coverage</option>
                          <option value="10">10% - Enhanced Coverage</option>
                          <option value="12">12% - Premium Coverage</option>
                          <option value="15">15% - Maximum Coverage</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Percentage of the daily rate charged as insurance premium
                        </p>
                      </div>

                      <div>
                        <label htmlFor="replacementValue" className="block text-sm font-medium text-gray-700 mb-1">
                          Replacement Value
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <Input
                            type="number"
                            id="replacementValue"
                            value={replacementValue}
                            onChange={(e) => setReplacementValue(e.target.value)}
                            step="0.01"
                            placeholder="2500.00"
                            className="w-full pl-7"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Full replacement cost if lost/damaged</p>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <Link href="/insurance-terms" className="text-purple-600 hover:text-purple-700">
                        Learn more about insurance coverage
                      </Link>{' '}
                      and what is covered in case of damage or theft.
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <Input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        placeholder="e.g., San Francisco"
                        className="w-full pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <Input
                      type="text"
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      placeholder="CA"
                      maxLength={2}
                      className="w-full"
                    />
                    <p className="mt-1 text-sm text-gray-500">2-letter state code</p>
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code (Optional)
                    </label>
                    <Input
                      type="text"
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="94102"
                      maxLength={10}
                      className="w-full"
                    />
                    <p className="mt-1 text-sm text-gray-500">For location-based search</p>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Add high-quality photos to showcase your gear. The first image will be the main thumbnail.
                </p>
                <ImageUpload
                  onImagesChange={setImages}
                  existingImages={images}
                  maxImages={10}
                  maxSizePerImage={5}
                />
              </div>

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col gap-4">
                  {/* Validation hints */}
                  {(!title || !description || !dailyRate || !city || !state) && (
                    <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      Please fill in all required fields: Title, Description, Daily Rate, City, and State
                    </div>
                  )}
                  {images.length === 0 && title && description && dailyRate && city && state && (
                    <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      Please upload at least one photo of your gear
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Link
                        href="/"
                        className="text-gray-600 hover:text-gray-900 font-medium"
                      >
                        ← Cancel
                      </Link>
                      <span className="text-sm text-gray-500">
                        By listing, you agree to our{' '}
                        <Link href="/terms-of-service" className="text-purple-600 hover:text-purple-700">
                          Terms
                        </Link>
                      </span>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading || !title || !description || !dailyRate || !city || !state || images.length === 0}
                      className="px-6 py-3"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Publishing...
                        </span>
                      ) : 'Publish Listing'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

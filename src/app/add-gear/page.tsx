'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';
import { event } from '../../lib/gtag';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Layout from '../../components/ui/Layout';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/gear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          dailyRate: parseFloat(dailyRate),
          weeklyRate: weeklyRate ? parseFloat(weeklyRate) : undefined,
          monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
          city,
          state,
          images,
          category,
          brand,
          model,
          condition,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add gear');
      }

      toast.success('Gear added successfully!'); // Toast notification
      event({
        action: 'add_gear',
        category: 'gear_management',
        label: 'new_gear_listing',
        value: 1,
      });
      router.push('/'); // Redirect to home page after successful addition
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error adding gear: ${errorMessage}`); // Toast notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 px-4 py-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">List Your Gear</h1>
            <p className="mt-2 text-gray-600">
              Share your photography and videography equipment with the community
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-3">
                  <Input
                    label="Gear Title"
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g., Canon EOS R5 Mirrorless Camera"
                    helperText="Be specific and descriptive to attract more renters"
                    className="text-xs"
                  />

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
                    <Input
                      label="Brand"
                      type="text"
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g., Canon, Sony, Nikon"
                      className="text-xs"
                    />

                    <Input
                      label="Model"
                      type="text"
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g., EOS R5, A7 IV"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Daily Rate"
                    type="number"
                    id="dailyRate"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    required
                    step="0.01"
                    placeholder="50.00"
                    leftIcon={<span className="text-gray-400 text-xs">$</span>}
                    helperText="Per day rental rate"
                    className="text-xs"
                  />

                  <Input
                    label="Weekly Rate (Optional)"
                    type="number"
                    id="weeklyRate"
                    value={weeklyRate}
                    onChange={(e) => setWeeklyRate(e.target.value)}
                    step="0.01"
                    placeholder="300.00"
                    leftIcon={<span className="text-gray-400 text-xs">$</span>}
                    helperText="Discounted weekly rate"
                    className="text-xs"
                  />

                  <Input
                    label="Monthly Rate (Optional)"
                    type="number"
                    id="monthlyRate"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    step="0.01"
                    placeholder="1000.00"
                    leftIcon={<span className="text-gray-400 text-xs">$</span>}
                    helperText="Discounted monthly rate"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="City"
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="e.g., San Francisco"
                    leftIcon={
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                    className="text-xs"
                  />

                  <Input
                    label="State"
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    placeholder="CA"
                    maxLength={2}
                    helperText="2-letter state code"
                    className="text-xs"
                  />
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    By listing your gear, you agree to our{' '}
                    <Link href="/terms-of-service" className="text-purple-600 hover:text-purple-700">
                      Terms of Service
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!title || !description || !dailyRate || !city || !state || images.length === 0}
                    className="px-6 py-3"
                  >
                    {loading ? 'Publishing...' : 'Publish Listing'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

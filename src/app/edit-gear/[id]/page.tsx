'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { GearItem } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';

export default function EditGearPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [gear, setGear] = useState<GearItem | null>(null);
  const [loadingGear, setLoadingGear] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState<number | string>('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('');

  useEffect(() => {
    if (id) {
      const fetchGear = async () => {
        setLoadingGear(true);
        try {
          const res = await fetch(`/api/gear/${id}`);
          if (!res.ok) {
            throw new Error('Failed to fetch gear');
          }
          const data = await res.json();
          setGear(data);
          setTitle(data.title);
          setDescription(data.description);
          setDailyRate(data.dailyRate);
          setCity(data.city);
          setState(data.state);
          setImages(data.images || []);
          setBrand(data.brand || '');
          setModel(data.model || '');
          setCondition(data.condition || '');
        } catch (err: any) {
          setError(err.message); // Keep setError for internal state management
          toast.error(err.message); // Add toast notification
          setGear(null);
        } finally {
          setLoadingGear(false);
        }
      };
      fetchGear();
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (!authLoading && user && !loadingGear && gear && gear.userId !== user.id) {
      // If user is logged in but not the owner, redirect to gear details page
      router.push(`/gear/${id}`);
    }
  }, [user, authLoading, loadingGear, gear, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!user || !gear) {
      setError('User not authenticated or gear not loaded.');
      toast.error('User not authenticated or gear not loaded.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/gear/${gear.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          dailyRate: parseFloat(dailyRate as string),
          city,
          state,
          images,
          brand,
          model,
          condition,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update gear');
      }

      toast.success('Gear updated successfully!');
      router.push(`/gear/${gear.id}`);
    } catch (err: any) {
      setError(err.message); // Keep setError for internal state management
      toast.error(err.message); // Add toast notification
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingGear) {
    return <div className="text-center py-8">Loading gear for editing...</div>;
  }

  if (!user || !gear || gear.userId !== user.id) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Gear</h1>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          ></textarea>
        </div>
        <div>
          <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700">Daily Rate ($)</label>
          <input
            type="number"
            id="dailyRate"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            required
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand (Optional)</label>
          <input
            type="text"
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model (Optional)</label>
          <input
            type="text"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition (Optional)</label>
          <input
            type="text"
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <ImageUpload
          onImagesChange={setImages}
          existingImages={images}
          maxImages={10}
          maxSizePerImage={5}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Updating...' : 'Update Gear'}
        </button>
      </form>
    </div>
  );
}

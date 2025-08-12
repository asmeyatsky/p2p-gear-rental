'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast'; // Import toast
import { event } from '@/lib/gtag'; // Import event for analytics

export default function AddGearPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState(''); // New state
  const [brand, setBrand] = useState(''); // New state
  const [model, setModel] = useState(''); // New state
  const [condition, setCondition] = useState(''); // New state
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push('/auth/login');
    return null;
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
          city,
          state,
          images,
          category, // New field
          brand,    // New field
          model,    // New field
          condition, // New field
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
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Gear</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            <option value="cameras">Cameras</option>
            <option value="lenses">Lenses</option>
            <option value="lighting">Lighting</option>
            <option value="audio">Audio</option>
            <option value="drones">Drones</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand (Optional)</label>
          <input
            type="text"
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model (Optional)</label>
          <input
            type="text"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition (Optional)</label>
          <input
            type="text"
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700">Image URLs (comma-separated)</label>
          <input
            type="text"
            id="images"
            value={images.join(',')}
            onChange={(e) => setImages(e.target.value.split(',').map(url => url.trim()))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Gear...' : 'Add Gear'}
        </button>
      </form>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PencilIcon, TrashIcon, EyeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface Gear {
  id: string;
  title: string;
  description: string;
  dailyRate: number;
  city: string;
  state: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  userId: string;
  user: {
    full_name: string;
  };
  createdAt: string;
  status: string; // 'active', 'inactive', 'suspended'
}

export default function AdminGearPage() {
  const [gears, setGears] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchGear();
  }, []);

  const fetchGear = async () => {
    try {
      const { data, error } = await supabase
        .from('gear')
        .select(`
          id, 
          title, 
          description, 
          dailyRate, 
          city, 
          state, 
          category, 
          brand, 
          model, 
          condition, 
          userId, 
          createdAt,
          status,
          user:users(full_name)
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Transform data to match Gear interface (user is returned as array from join)
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        user: Array.isArray(item.user) ? item.user[0] : item.user
      }));
      setGears(transformedData);
    } catch (error) {
      console.error('Error fetching gear:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGears = gears.filter(gear => {
    const matchesSearch = 
      gear.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gear.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gear.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gear.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gear.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'all' || gear.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const updateGearStatus = async (gearId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('gear')
        .update({ status: newStatus })
        .eq('id', gearId);

      if (error) throw error;

      // Update local state
      setGears(gears.map(gear => 
        gear.id === gearId ? { ...gear, status: newStatus } : gear
      ));
    } catch (error) {
      console.error('Error updating gear status:', error);
    }
  };

  const deleteGear = async (gearId: string) => {
    if (confirm('Are you sure you want to delete this gear listing?')) {
      try {
        const { error } = await supabase
          .from('gear')
          .delete()
          .eq('id', gearId);

        if (error) throw error;

        // Update local state
        setGears(gears.filter(gear => gear.id !== gearId));
      } catch (error) {
        console.error('Error deleting gear:', error);
      }
    }
  };

  const categories = [...new Set(gears.map(gear => gear.category).filter(Boolean) as string[])];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Gear Listings</h1>
          <p className="mt-2 text-sm text-gray-700">Manage all gear listings in the system</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search gear..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Gear
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Owner
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredGears.map((gear) => (
                    <tr key={gear.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{gear.title}</div>
                            <div className="text-gray-500">{gear.brand} {gear.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{gear.user?.full_name || 'Unknown'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900 capitalize">{gear.category || 'N/A'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">${gear.dailyRate}/day</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{gear.city}, {gear.state}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={gear.status || 'active'}
                          onChange={(e) => updateGearStatus(gear.id, e.target.value)}
                          className={`rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            gear.status === 'suspended' ? 'text-red-800 bg-red-50' : 
                            gear.status === 'inactive' ? 'text-yellow-800 bg-yellow-50' : 
                            'text-green-800 bg-green-50'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex space-x-2">
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteGear(gear.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          {gear.status === 'suspended' && (
                            <button
                              onClick={() => updateGearStatus(gear.id, 'active')}
                              className="text-green-600 hover:text-green-900"
                              title="Unsuspend"
                            >
                              <ShieldCheckIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
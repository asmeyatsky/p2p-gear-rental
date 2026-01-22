'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PencilIcon, TrashIcon, EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Rental {
  id: string;
  gearId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  message: string | null;
  createdAt: string;
  gear: {
    title: string;
    dailyRate: number;
  };
  renter: {
    full_name: string;
    email: string;
  };
  owner: {
    full_name: string;
    email: string;
  };
}

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          id, 
          gearId, 
          renterId, 
          ownerId, 
          startDate, 
          endDate, 
          status, 
          totalPrice, 
          message, 
          createdAt,
          gear:gear(title, dailyRate),
          renter:users!renterId(full_name, email),
          owner:users!ownerId(full_name, email)
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Transform data to match Rental interface (joins are returned as arrays)
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        gear: Array.isArray(item.gear) ? item.gear[0] : item.gear,
        renter: Array.isArray(item.renter) ? item.renter[0] : item.renter,
        owner: Array.isArray(item.owner) ? item.owner[0] : item.owner
      }));
      setRentals(transformedData);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.gear?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.renter?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      selectedStatus === 'all' || rental.status.toLowerCase() === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const updateRentalStatus = async (rentalId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({ status: newStatus })
        .eq('id', rentalId);

      if (error) throw error;

      // Update local state
      setRentals(rentals.map(rental => 
        rental.id === rentalId ? { ...rental, status: newStatus } : rental
      ));
    } catch (error) {
      console.error('Error updating rental status:', error);
    }
  };

  const deleteRental = async (rentalId: string) => {
    if (confirm('Are you sure you want to delete this rental?')) {
      try {
        const { error } = await supabase
          .from('rentals')
          .delete()
          .eq('id', rentalId);

        if (error) throw error;

        // Update local state
        setRentals(rentals.filter(rental => rental.id !== rentalId));
      } catch (error) {
        console.error('Error deleting rental:', error);
      }
    }
  };

  const statuses = [...new Set(rentals.map(rental => rental.status.toLowerCase()))];

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
          <h1 className="text-xl font-semibold text-gray-900">Rentals</h1>
          <p className="mt-2 text-sm text-gray-700">Manage all rentals in the system</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search rentals..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
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
                      Rental ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Gear
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Renter
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Owner
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Dates
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Price
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
                  {filteredRentals.map((rental) => (
                    <tr key={rental.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{rental.id.substring(0, 8)}...</div>
                        <div className="text-gray-500">Created {new Date(rental.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{rental.gear?.title}</div>
                        <div className="text-gray-500">${rental.gear?.dailyRate}/day</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{rental.renter?.full_name}</div>
                        <div className="text-gray-500">{rental.renter?.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{rental.owner?.full_name}</div>
                        <div className="text-gray-500">{rental.owner?.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">${rental.totalPrice.toFixed(2)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={rental.status}
                          onChange={(e) => updateRentalStatus(rental.id, e.target.value)}
                          className={`rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            rental.status === 'completed' ? 'text-green-800 bg-green-50' : 
                            rental.status === 'cancelled' ? 'text-red-800 bg-red-50' : 
                            rental.status === 'pending' ? 'text-yellow-800 bg-yellow-50' : 
                            'text-blue-800 bg-blue-50'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
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
                            onClick={() => deleteRental(rental.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
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
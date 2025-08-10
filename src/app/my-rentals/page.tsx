'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { event } from '@/lib/gtag'; // Import event for analytics

interface RentalItem {
  id: string;
  gearId: string;
  gear: {
    id: string;
    title: string;
    images: string[];
    dailyRate: number;
  };
  renterId: string;
  renter: {
    id: string;
    email: string;
    full_name?: string;
  };
  ownerId: string;
  owner: {
    id: string;
    email: string;
    full_name?: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export default function MyRentalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [ownerMessage, setOwnerMessage] = useState(''); // New state for owner's message

  const fetchRentals = async () => {
    setLoadingRentals(true);
    try {
      const res = await fetch('/api/rentals');
      if (!res.ok) {
        throw new Error('Failed to fetch rentals');
      }
      const data = await res.json();
      setRentals(data);
    } catch (error: any) {
      toast.error(`Error fetching rentals: ${error.message}`);
      console.error('Error fetching rentals:', error);
    } finally {
      setLoadingRentals(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchRentals();
    }
  }, [user, authLoading, router]);

  const handleApprove = async (rentalId: string) => {
    if (!confirm('Are you sure you want to approve this rental request?')) {
      return;
    }
    try {
      const res = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: ownerMessage }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to approve rental');
      }

      toast.success('Rental request approved!');
      event({
        action: 'approve_rental',
        category: 'rentals',
        label: 'rental_approved',
        value: 1,
      });
      setOwnerMessage(''); // Clear message
      fetchRentals(); // Refresh rentals
    } catch (error: any) {
      toast.error(`Error approving rental: ${error.message}`);
      console.error('Error approving rental:', error);
    }
  };

  const handleReject = async (rentalId: string) => {
    if (!confirm('Are you sure you want to reject this rental request?')) {
      return;
    }
    try {
      const res = await fetch(`/api/rentals/${rentalId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: ownerMessage }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to reject rental');
      }

      toast.success('Rental request rejected!');
      event({
        action: 'reject_rental',
        category: 'rentals',
        label: 'rental_rejected',
        value: 1,
      });
      setOwnerMessage(''); // Clear message
      fetchRentals(); // Refresh rentals
    } catch (error: any) {
      toast.error(`Error rejecting rental: ${error.message}`);
      console.error('Error rejecting rental:', error);
    }
  };

  if (authLoading || loadingRentals) {
    return <div className="text-center py-8">Loading rentals...</div>;
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  const myRentedGear = rentals.filter(rental => rental.renterId === user.id);
  const myOwnedGearRentals = rentals.filter(rental => rental.ownerId === user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">My Rentals</h1>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Gear I'm Renting</h2>
        {myRentedGear.length === 0 ? (
          <p className="text-gray-600">You haven't requested to rent any gear yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRentedGear.map(rental => (
              <div key={rental.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Link href={`/gear/${rental.gear.id}`}>
                  <img src={rental.gear.images[0]} alt={rental.gear.title} className="w-full h-48 object-cover" />
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{rental.gear.title}</h3>
                  <p className="text-gray-600 text-sm">From: {rental.owner.full_name || rental.owner.email}</p>
                  <p className="text-gray-600 text-sm">Dates: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}</p>
                  <p className="text-gray-600 text-sm">Status: <span className={`font-medium ${rental.status === 'pending' ? 'text-yellow-600' : rental.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{rental.status}</span></p>
                  {rental.message && <p className="text-gray-600 text-sm mt-2">Message: {rental.message}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Rentals for My Gear</h2>
        {myOwnedGearRentals.length === 0 ? (
          <p className="text-gray-600">No one has requested to rent your gear yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myOwnedGearRentals.map(rental => (
              <div key={rental.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Link href={`/gear/${rental.gear.id}`}>
                  <img src={rental.gear.images[0]} alt={rental.gear.title} className="w-full h-48 object-cover" />
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{rental.gear.title}</h3>
                  <p className="text-gray-600 text-sm">By: {rental.renter.full_name || rental.renter.email}</p>
                  <p className="text-gray-600 text-sm">Dates: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}</p>
                  <p className="text-gray-600 text-sm">Status: <span className={`font-medium ${rental.status === 'pending' ? 'text-yellow-600' : rental.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{rental.status}</span></p>
                  {rental.message && <p className="text-gray-600 text-sm mt-2">Message: {rental.message}</p>}
                  {rental.status === 'pending' && (
                    <div className="mt-4">
                      <textarea
                        className="w-full p-2 border rounded-md text-sm mb-2"
                        rows={2}
                        placeholder="Add a message for the renter (optional)..."
                        value={ownerMessage}
                        onChange={(e) => setOwnerMessage(e.target.value)}
                      ></textarea>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(rental.id)}
                          className="flex-1 bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(rental.id)}
                          className="flex-1 bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

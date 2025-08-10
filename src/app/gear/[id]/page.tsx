import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { GearItem } from '@/types'; // Assuming GearItem type is updated to include userId
import toast from 'react-hot-toast'; // Import toast

export default function GearDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [gear, setGear] = useState<GearItem | null>(null);
  const [isLoadingGear, setIsLoadingGear] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState(''); // New state for message

  useEffect(() => {
    if (id) {
      const fetchGear = async () => {
        setIsLoadingGear(true);
        try {
          const res = await fetch(`/api/gear/${id}`);
          if (!res.ok) {
            throw new Error('Failed to fetch gear');
          }
          const data = await res.json();
          setGear(data);
        } catch (error) {
          console.error('Error fetching gear:', error);
          setGear(null);
        } finally {
          setIsLoadingGear(false);
        }
      };

      fetchGear();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!gear || !user || !confirm('Are you sure you want to delete this gear?')) {
      return;
    }

    try {
      const res = await fetch(`/api/gear/${gear.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete gear');
      }

      toast.success('Gear deleted successfully!');
      router.push('/'); // Redirect to home page after deletion
    } catch (error: any) {
      toast.error(`Error deleting gear: ${error.message}`);
      console.error('Error deleting gear:', error);
    }
  };

  const handleRent = async () => {
    if (!gear || !user) {
      toast.error('Please log in to rent gear.');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      toast.error('End date must be after start date.');
      return;
    }

    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gearId: gear.id,
          startDate,
          endDate,
          message, // Include message in the request
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send rental request');
      }

      toast.success('Rental request sent successfully!');
      event({
        action: 'send_rental_request',
        category: 'rentals',
        label: 'new_rental_request',
        value: 1,
      });
      // Optionally, clear dates or redirect
      setStartDate('');
      setEndDate('');
    } catch (error: any) {
      toast.error(`Error sending rental request: ${error.message}`);
      console.error('Error sending rental request:', error);
    }
  };

  if (isLoadingGear || loading) {
    return <div>Loading...</div>;
  }

  if (!gear) {
    return <div>Gear not found.</div>;
  }

  const isOwner = user && gear.userId === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative h-96 w-full mb-4">
            {gear.images && gear.images.length > 0 && (
              <Image
                src={gear.images[0]}
                alt={gear.title}
                fill
                className="object-cover rounded-lg"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {gear.images && gear.images.slice(1).map((image: string, index: number) => (
              <div key={index} className="relative h-24 w-full">
                <Image
                  src={image}
                  alt={`${gear.title} - ${index + 2}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{gear.title}</h1>
          <p className="text-lg text-gray-600 mb-4">
            {gear.brand} {gear.model}
          </p>
          <div className="text-2xl font-bold text-gray-900 mb-4">
            ${gear.dailyRate.toFixed(2)}
            <span className="text-sm text-gray-500"> / day</span>
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{gear.description}</p>
          </div>
          {/* Removed gear.features as it's not in the schema yet */}
          {/* Removed gear.owner as it's not directly in the schema yet, will fetch user details if needed */}
          {/* Removed gear.features as it's not in the schema yet */}
          {/* Removed gear.owner as it's not directly in the schema yet, will fetch user details if needed */}
          {!isOwner && user && (
            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h3 className="text-xl font-semibold mb-4">Rent this Gear</h3>
              <div className="flex flex-col space-y-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message (Optional)</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Add a message for the owner..."
                  ></textarea>
                </div>
                <button
                  onClick={handleRent}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 w-full"
                >
                  Send Rental Request
                </button>
              </div>
            </div>
          )}
          {isOwner && (
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => router.push(`/edit-gear/${gear.id}`)} // Placeholder for edit page
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
              >
                Edit Gear
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700"
              >
                Delete Gear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

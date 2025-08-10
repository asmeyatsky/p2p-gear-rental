'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  if (!user) {
    return null; // Redirecting, so no content to render
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">User Profile</h1>
      <div className="space-y-4">
        <p className="text-lg">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        {user.user_metadata?.full_name && (
          <p className="text-lg">
            <span className="font-semibold">Full Name:</span> {user.user_metadata.full_name}
          </p>
        )}
        {/* Add more user details here as needed */}
      </div>
    </div>
  );
}

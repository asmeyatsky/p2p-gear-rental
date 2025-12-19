'use client';
export const dynamic = "force-dynamic";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MyRentalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to new dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    } else if (!authLoading && !user) {
      router.push('/auth/login?redirectTo=/my-rentals');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to dashboard...</p>
    </div>
  );
}
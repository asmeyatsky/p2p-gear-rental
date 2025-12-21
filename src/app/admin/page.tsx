'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  UserIcon,
  ShoppingBagIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGear: 0,
    totalRentals: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      if (user) {
        // In a real app, you'd check user roles from database
        // For now, we'll use a simple check - in production, this should be verified server-side
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      }
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      // Fetch dashboard stats
      fetchStats();
      fetchRecentActivity();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch gear count
      const { count: gearCount } = await supabase
        .from('gear')
        .select('*', { count: 'exact', head: true });

      // Fetch rental count
      const { count: rentalCount } = await supabase
        .from('rentals')
        .select('*', { count: 'exact', head: true });

      // Fetch revenue (this is simplified - in reality you'd need to aggregate payment data)
      const { data: rentals } = await supabase
        .from('rentals')
        .select('totalPrice, paymentStatus')
        .in('paymentStatus', ['succeeded', 'paid']);

      const totalRevenue = rentals?.reduce((sum, rental) =>
        rental.paymentStatus === 'succeeded' || rental.paymentStatus === 'paid'
          ? sum + (rental.totalPrice || 0)
          : sum, 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalGear: gearCount || 0,
        totalRentals: rentalCount || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, full_name, email, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5);

      // Fetch recent gear
      const { data: recentGear } = await supabase
        .from('gear')
        .select('id, title, user:users(full_name), createdAt')
        .order('createdAt', { ascending: false })
        .limit(5);

      // Fetch recent rentals
      const { data: recentRentals } = await supabase
        .from('rentals')
        .select('id, gear:gear(title), renter:users(full_name), startDate, endDate, status, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5);

      // Combine and sort by date
      const activity = [
        ...(recentUsers || []).map(item => ({ ...item, type: 'user' })),
        ...(recentGear || []).map(item => ({ ...item, type: 'gear' })),
        ...(recentRentals || []).map(item => ({ ...item, type: 'rental' })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const adminMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Users', href: '/admin/users', icon: UserIcon },
    { name: 'Gear', href: '/admin/gear', icon: ShoppingBagIcon },
    { name: 'Rentals', href: '/admin/rentals', icon: CalendarIcon },
    { name: 'Content Moderation', href: '/admin/moderation', icon: ShieldCheckIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Welcome, Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Gear</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalGear}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Rentals</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalRentals}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">${stats.totalRevenue.toFixed(2)}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="mb-8">
          <AdvancedAnalytics />
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest actions on the platform</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity, index) => (
                <li key={index} className="py-4">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="text-sm font-medium text-purple-600 truncate capitalize">
                            {activity.type} created
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500">
                            {activity.type === 'user' && (
                              <span>{activity.full_name} ({activity.email})</span>
                            )}
                            {activity.type === 'gear' && (
                              <span>{activity.title} by {activity.user?.full_name}</span>
                            )}
                            {activity.type === 'rental' && (
                              <span>{activity.gear?.title} by {activity.renter?.full_name}</span>
                            )}
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div className="text-sm text-gray-900">
                            <time dateTime={activity.createdAt}>
                              {new Date(activity.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <div className="mt-2 flex">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                              activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              activity.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status || 'active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/lib/toast';
import { apiUrl } from '@/lib/api';

interface DashboardStats {
  totalRentals: number;
  activeRentals: number;
  pendingRequests: number;
  completedRentals: number;
  totalEarnings: number;
  averageRating: number | null;
  thisMonthEarnings: number;
  thisMonthRentals: number;
  trends: {
    earnings: {
      value: number;
      isPositive: boolean;
    };
    rentals: {
      value: number;
      isPositive: boolean;
    };
  };
}

interface RecentActivity {
  id: string;
  type: 'rental' | 'message' | 'review';
  title: string;
  description: string;
  timestamp: string;
  href?: string;
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className="text-sm text-gray-500 mt-1">{change}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          trend.isPositive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {trend.isPositive ? (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7l-4 4-4-4h8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 13l4-4 4 4H8z" clipRule="evenodd" />
            </svg>
          )}
          {Math.abs(trend.value)}%
        </span>
        <span className="ml-2 text-sm text-gray-500">from last month</span>
      </div>
    )}
  </div>
);

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse] = await Promise.all([
          fetch(apiUrl('/api/dashboard/stats')),
          // In the future, add more endpoints for recent activity
        ]);

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

        // Mock recent activity for now
        setRecentActivity([
          {
            id: '1',
            type: 'rental',
            title: 'New rental request',
            description: 'Canon EOS R5 requested by John D.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            href: '/dashboard/rentals'
          },
          {
            id: '2',
            type: 'message',
            title: 'New message',
            description: 'Message about Sony A7III rental',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            href: '/dashboard/messages'
          },
          {
            id: '3',
            type: 'review',
            title: 'New review received',
            description: '5-star review from Sarah M.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            href: '/dashboard'
          },
        ]);

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rental':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="opacity-90">Here&apos;s what&apos;s happening with your gear rental business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Rentals"
          value={stats.totalRentals}
          change="All time"
          trend={stats.trends.rentals}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <StatCard
          title="Active Rentals"
          value={stats.activeRentals}
          change="Currently active"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatCard
          title="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          change="All time"
          trend={stats.trends.earnings}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <StatCard
          title="Average Rating"
          value={stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : 'N/A'}
          change="From reviews"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/add-gear"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Add New Gear</h3>
              <p className="text-sm text-gray-500">List new equipment for rent</p>
            </div>
          </Link>

          <Link
            href="/add-gear/bulk"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Bulk Upload</h3>
              <p className="text-sm text-gray-500">Import multiple items via CSV</p>
            </div>
          </Link>

          <Link
            href="/dashboard/rentals"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Rentals</h3>
              <p className="text-sm text-gray-500">Review and approve requests</p>
            </div>
          </Link>

          <Link
            href="/dashboard/messages"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">Chat with renters</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity & This Month Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
                {activity.href && (
                  <Link
                    href={activity.href}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* This Month's Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Earnings</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(stats.thisMonthEarnings)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">New Rentals</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.thisMonthRentals}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Pending Requests</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.pendingRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Completed Rentals</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.completedRentals}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
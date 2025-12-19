'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Header from '@/components/Header';

interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  pendingRequests: number;
  completedRentals: number;
  totalEarnings: number;
  averageRating: number;
  thisMonthEarnings: number;
  thisMonthRentals: number;
}

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
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  message?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentStatus?: string;
  createdAt: string;
  amount?: number;
}

type TabType = 'overview' | 'incoming' | 'outgoing' | 'analytics';
type FilterType = 'all' | 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';

export default function RentalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
  }, [rentals, filter, searchTerm, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [rentalsRes, statsRes] = await Promise.all([
        fetch('/api/rentals'),
        fetch('/api/dashboard/stats')
      ]);

      if (rentalsRes.ok) {
        const rentalsData = await rentalsRes.json();
        setRentals(rentalsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const applyFilters = () => {
      let filtered = rentals;

      // Filter by tab (incoming vs outgoing)
      if (activeTab === 'incoming') {
        filtered = filtered.filter(rental => rental.ownerId === user?.id);
      } else if (activeTab === 'outgoing') {
        filtered = filtered.filter(rental => rental.renterId === user?.id);
      }

      // Filter by status
      if (filter !== 'all') {
        filtered = filtered.filter(rental => rental.status === filter);
      }

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(rental =>
          rental.gear.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rental.renter.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rental.owner.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredRentals(filtered);
    };
    applyFilters();
  }, [rentals, filter, searchTerm, activeTab, user]);

  const handleApprove = async (rentalId: string) => {
    try {
      const res = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        toast.success('Rental approved!');
        fetchDashboardData();
      } else {
        throw new Error('Failed to approve rental');
      }
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to approve rental');
    }
  };

  const handleReject = async (rentalId: string) => {
    try {
      const res = await fetch(`/api/rentals/${rentalId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        toast.success('Rental rejected');
        fetchDashboardData();
      } else {
        throw new Error('Failed to reject rental');
      }
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to reject rental');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const StatCard = ({ title, value, subtitle, icon, trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rental Dashboard</h1>
          <p className="text-gray-600">Manage your gear rentals and track performance</p>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'incoming', name: 'My Gear Rentals', icon: '📥' },
            { id: 'outgoing', name: 'My Bookings', icon: '📤' },
            { id: 'analytics', name: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Rentals"
              value={stats.totalRentals}
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Active Rentals"
              value={stats.activeRentals}
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" /></svg>}
            />
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              subtitle="Need attention"
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" /></svg>}
            />
            <StatCard
              title="Total Earnings"
              value={formatCurrency(stats.totalEarnings)}
              subtitle="All time"
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" /></svg>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatCard
              title="This Month"
              value={formatCurrency(stats.thisMonthEarnings)}
              subtitle={`${stats.thisMonthRentals} rentals`}
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" /></svg>}
            />
            <StatCard
              title="Average Rating"
              value={stats.averageRating ? `${stats.averageRating.toFixed(1)} ⭐` : 'No ratings yet'}
              subtitle="From customers"
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
            />
          </div>
        </div>
      )}

      {/* Rental Management Tabs */}
      {(activeTab === 'incoming' || activeTab === 'outgoing') && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search rentals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Rental Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRentals.map((rental) => (
              <div key={rental.id} className="bg-white rounded-lg shadow overflow-hidden">
                <Image
                  src={rental.gear.images[0] || '/placeholder-gear.jpg'}
                  alt={rental.gear.title}
                  width={300}
                  height={192}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{rental.gear.title}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">
                        {activeTab === 'incoming' ? 'Renter' : 'Owner'}:
                      </span>{' '}
                      {activeTab === 'incoming' 
                        ? rental.renter.full_name || rental.renter.email
                        : rental.owner.full_name || rental.owner.email
                      }
                    </p>
                    <p>
                      <span className="font-medium">Dates:</span>{' '}
                      {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                    </p>
                    <p>
                      <span className="font-medium">Rate:</span>{' '}
                      {formatCurrency(rental.gear.dailyRate)}/day
                    </p>
                  </div>

                  <div className="mt-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rental.status)}`}>
                      {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                    </span>
                  </div>

                  {rental.message && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">Message:</span> {rental.message}
                    </div>
                  )}

                  {/* Action buttons for incoming rentals */}
                  {activeTab === 'incoming' && rental.status === 'pending' && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleApprove(rental.id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(rental.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredRentals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No rentals found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalEarnings)}</p>
              <p className="text-sm text-gray-500 mt-1">All time earnings</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">This Month</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.thisMonthEarnings)}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.thisMonthRentals} rentals</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Avg Per Rental</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.completedRentals > 0
                  ? formatCurrency(stats.totalEarnings / stats.completedRentals)
                  : '$0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Based on {stats.completedRentals} rentals</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRentals > 0
                    ? `${((stats.completedRentals / stats.totalRentals) * 100).toFixed(0)}%`
                    : '0%'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalRentals > 0 ? (stats.completedRentals / stats.totalRentals) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{'<'} 1 hr</p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                </p>
                <div className="flex text-yellow-400 mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star}>
                      {stats.averageRating && stats.averageRating >= star ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRentals}</p>
                <p className="text-xs text-blue-600 mt-1">Currently rented</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {rentals.length > 0 ? (
              <div className="space-y-3">
                {rentals.slice(0, 5).map(rental => (
                  <div key={rental.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {rental.gear.images[0] && (
                          <Image
                            src={rental.gear.images[0]}
                            alt={rental.gear.title}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rental.gear.title}</p>
                        <p className="text-xs text-gray-500">
                          {rental.ownerId === user?.id ? 'Rented by' : 'Rented from'}{' '}
                          {rental.ownerId === user?.id
                            ? rental.renter.full_name || rental.renter.email
                            : rental.owner.full_name || rental.owner.email
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rental.status)}`}>
                        {rental.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(rental.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>

          {/* Tips for Success */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-3">Tips to Increase Earnings</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="mr-2">📸</span>
                Add high-quality photos to your listings
              </li>
              <li className="flex items-center">
                <span className="mr-2">💰</span>
                Offer weekly and monthly discounts for longer rentals
              </li>
              <li className="flex items-center">
                <span className="mr-2">⚡</span>
                Respond to requests within 1 hour for higher visibility
              </li>
              <li className="flex items-center">
                <span className="mr-2">⭐</span>
                Maintain a 4.5+ rating to become a featured host
              </li>
            </ul>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
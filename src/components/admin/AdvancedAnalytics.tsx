'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  revenueByMonth: { month: string; revenue: number }[];
  rentalsByCategory: { name: string; value: number }[];
  userGrowth: { month: string; newUsers: number }[];
  topGear: { title: string; rentals: number }[];
}

export default function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3months');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on timeRange
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch rentals data for the specified period
      const { data: rentals } = await supabase
        .from('rentals')
        .select(`
          id, 
          totalPrice, 
          createdAt, 
          gear:gear(category)
        `)
        .gte('createdAt', startDate.toISOString())
        .in('status', ['completed', 'active', 'approved']);

      // Fetch users data for the specified period
      const { data: users } = await supabase
        .from('users')
        .select('createdAt')
        .gte('createdAt', startDate.toISOString());

      // Fetch gear data
      const { data: gear } = await supabase
        .from('gear')
        .select('title');

      if (!rentals || !users || !gear) {
        throw new Error('Failed to fetch analytics data');
      }

      // Transform rentals data (join returns array)
      const transformedRentals = rentals.map((rental: any) => ({
        ...rental,
        gear: Array.isArray(rental.gear) ? rental.gear[0] : rental.gear
      }));

      // Process revenue by month
      const revenueByMonthMap: { [key: string]: number } = {};
      transformedRentals.forEach((rental: any) => {
        const month = new Date(rental.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        revenueByMonthMap[month] = (revenueByMonthMap[month] || 0) + (rental.totalPrice || 0);
      });

      const revenueByMonth = Object.entries(revenueByMonthMap).map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2))
      }));

      // Process rentals by category
      const categoryCount: { [key: string]: number } = {};
      transformedRentals.forEach((rental: any) => {
        const category = rental.gear?.category || 'Uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const rentalsByCategory = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value
      }));

      // Process user growth
      const userGrowthMap: { [key: string]: number } = {};
      users.forEach(user => {
        const month = new Date(user.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        userGrowthMap[month] = (userGrowthMap[month] || 0) + 1;
      });

      const userGrowth = Object.entries(userGrowthMap).map(([month, newUsers]) => ({
        month,
        newUsers
      }));

      // Process top gear
      const gearRentalCount: { [key: string]: number } = {};
      transformedRentals.forEach((rental: any) => {
        const gearTitle = rental.gear?.title || 'Unknown';
        gearRentalCount[gearTitle] = (gearRentalCount[gearTitle] || 0) + 1;
      });

      const topGear = Object.entries(gearRentalCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([title, rentals]) => ({
          title,
          rentals
        }));

      setAnalyticsData({
        revenueByMonth,
        rentalsByCategory,
        userGrowth,
        topGear
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#4f46e5', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                ${analyticsData.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Rentals</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {analyticsData.rentalsByCategory.reduce((sum, item) => sum + item.value, 0)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 truncate">New Users</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {analyticsData.userGrowth.reduce((sum, item) => sum + item.newUsers, 0)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 truncate">Active Gear</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {analyticsData.topGear.length}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 shadow rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Month</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white p-6 shadow rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newUsers" stroke="#22c55e" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rentals by Category */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rentals by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.rentalsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.rentalsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Gear */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Gear by Rentals</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.topGear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rentals" name="Rentals" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
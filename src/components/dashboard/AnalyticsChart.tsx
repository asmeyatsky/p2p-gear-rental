'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  date: string;
  rentals: number;
  earnings: number;
}

interface AnalyticsChartProps {
  data?: AnalyticsData[];
  type: 'rentals' | 'earnings';
  period: 'week' | 'month' | 'year';
}

export default function AnalyticsChart({ data = [], type, period }: AnalyticsChartProps) {
  const [chartData, setChartData] = useState<AnalyticsData[]>([]);

  useEffect(() => {
    // Generate sample data if none provided
    if (data.length === 0) {
      const sampleData = generateSampleData(period);
      setChartData(sampleData);
    } else {
      setChartData(data);
    }
  }, [data, period]);

  const generateSampleData = (period: string): AnalyticsData[] => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const sampleData: AnalyticsData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      sampleData.push({
        date: date.toISOString().split('T')[0],
        rentals: Math.floor(Math.random() * 10) + 1,
        earnings: Math.floor(Math.random() * 500) + 50
      });
    }
    
    return sampleData;
  };

  const maxValue = Math.max(...chartData.map(item => type === 'rentals' ? item.rentals : item.earnings));
  const formatValue = (value: number) => {
    return type === 'earnings' 
      ? `$${value}` 
      : value.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {type === 'rentals' ? 'Rental Activity' : 'Earnings Trend'}
        </h3>
        <div className="text-sm text-gray-500 capitalize">{period}ly View</div>
      </div>

      <div className="space-y-4">
        {/* Chart Container */}
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {chartData.map((item, index) => {
              const value = type === 'rentals' ? item.rentals : item.earnings;
              const height = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 max-w-12">
                  <div
                    className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                      type === 'rentals' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${formatDate(item.date)}: ${formatValue(value)}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex items-center justify-between px-2 text-xs text-gray-500">
          {chartData.map((item, index) => {
            // Show fewer labels on mobile
            const showLabel = chartData.length <= 10 || index % Math.ceil(chartData.length / 6) === 0;
            return (
              <div key={index} className={`flex-1 text-center ${showLabel ? '' : 'invisible'}`}>
                {showLabel && formatDate(item.date)}
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {chartData.reduce((sum, item) => sum + (type === 'rentals' ? item.rentals : item.earnings), 0)}
            </div>
            <div className="text-sm text-gray-500">
              Total {type === 'rentals' ? 'Rentals' : 'Earnings'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {Math.round(chartData.reduce((sum, item) => sum + (type === 'rentals' ? item.rentals : item.earnings), 0) / chartData.length)}
            </div>
            <div className="text-sm text-gray-500">
              Daily Average
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {Math.max(...chartData.map(item => type === 'rentals' ? item.rentals : item.earnings))}
            </div>
            <div className="text-sm text-gray-500">
              Peak Day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
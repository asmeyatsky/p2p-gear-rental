'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '@/lib/api';

interface UnavailablePeriod {
  start: string;
  end: string;
  status: string;
}

interface AvailabilityCalendarProps {
  gearId: string;
  onDateSelect?: (startDate: string, endDate: string) => void;
  selectedStart?: string;
  selectedEnd?: string;
}

export default function AvailabilityCalendar({
  gearId,
  onDateSelect,
  selectedStart,
  selectedEnd,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<UnavailablePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStart, setTempStart] = useState<string | null>(selectedStart || null);
  const [tempEnd, setTempEnd] = useState<string | null>(selectedEnd || null);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const response = await fetch(apiUrl(`/api/gear/${gearId}/availability`));
        if (response.ok) {
          const data = await response.json();
          setUnavailableDates(data.unavailableDates || []);
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [gearId]);

  const unavailableDateSet = useMemo(() => {
    const set = new Set<string>();
    unavailableDates.forEach(period => {
      const start = new Date(period.start);
      const end = new Date(period.end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(d.toISOString().split('T')[0]);
      }
    });
    return set;
  }, [unavailableDates]);

  const isDateUnavailable = (dateStr: string) => unavailableDateSet.has(dateStr);

  const isDateInPast = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const isDateSelected = (dateStr: string) => {
    if (!tempStart || !tempEnd) return dateStr === tempStart || dateStr === tempEnd;
    return dateStr >= tempStart && dateStr <= tempEnd;
  };

  const isDateInRange = (dateStr: string) => {
    if (!tempStart || !tempEnd) return false;
    return dateStr > tempStart && dateStr < tempEnd;
  };

  const handleDateClick = (dateStr: string) => {
    if (isDateUnavailable(dateStr) || isDateInPast(dateStr)) return;

    if (selectingStart || !tempStart) {
      setTempStart(dateStr);
      setTempEnd(null);
      setSelectingStart(false);
    } else {
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd(null);
      } else {
        // Check if any date in range is unavailable
        let hasConflict = false;
        const start = new Date(tempStart);
        const end = new Date(dateStr);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (isDateUnavailable(d.toISOString().split('T')[0])) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) {
          setTempStart(dateStr);
          setTempEnd(null);
        } else {
          setTempEnd(dateStr);
          setSelectingStart(true);
          onDateSelect?.(tempStart, dateStr);
        }
      }
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="font-semibold text-gray-900">{monthName}</h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-10"></div>;
          }

          const dateStr = day.toISOString().split('T')[0];
          const isUnavailable = isDateUnavailable(dateStr);
          const isPast = isDateInPast(dateStr);
          const isSelected = isDateSelected(dateStr);
          const isInRange = isDateInRange(dateStr);
          const isStart = dateStr === tempStart;
          const isEnd = dateStr === tempEnd;

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(dateStr)}
              disabled={isUnavailable || isPast}
              className={`
                h-10 rounded-lg text-sm font-medium transition-colors relative
                ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                ${isUnavailable && !isPast ? 'bg-red-100 text-red-400 cursor-not-allowed line-through' : ''}
                ${!isUnavailable && !isPast && !isSelected && !isInRange ? 'hover:bg-blue-50 text-gray-700' : ''}
                ${isSelected && !isInRange ? 'bg-blue-500 text-white' : ''}
                ${isInRange ? 'bg-blue-100 text-blue-700' : ''}
                ${isStart ? 'rounded-r-none' : ''}
                ${isEnd ? 'rounded-l-none' : ''}
              `}
            >
              {day.getDate()}
              {isUnavailable && !isPast && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>Available</span>
        </div>
      </div>

      {/* Selection info */}
      {(tempStart || tempEnd) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          {tempStart && !tempEnd && (
            <p className="text-blue-700">
              Start: <strong>{new Date(tempStart).toLocaleDateString()}</strong>
              <span className="text-blue-500 ml-2">Select end date</span>
            </p>
          )}
          {tempStart && tempEnd && (
            <p className="text-blue-700">
              {new Date(tempStart).toLocaleDateString()} - {new Date(tempEnd).toLocaleDateString()}
              <span className="text-blue-500 ml-2">
                ({Math.ceil((new Date(tempEnd).getTime() - new Date(tempStart).getTime()) / (1000 * 60 * 60 * 24))} days)
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

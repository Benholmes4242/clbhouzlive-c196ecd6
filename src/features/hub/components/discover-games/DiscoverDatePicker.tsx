/**
 * DiscoverDatePicker - Date/time picker for discover filters
 * 
 * Supports:
 * - Preset modes (today, week, month, any)
 * - Custom single date (±3h window)
 * - Custom date range
 */

import React, { useState } from 'react';
import { format, addHours, startOfDay, endOfDay } from 'date-fns';
import { Calendar, CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import type { DiscoverWhen } from '../../hooks/useDiscoverGamesV2';

export type DateMode = 'preset' | 'single' | 'range';

export interface DateFilterValue {
  mode: DateMode;
  preset?: DiscoverWhen;
  singleDate?: Date;
  dateRange?: DateRange;
}

interface DiscoverDatePickerProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

const presetOptions: { value: DiscoverWhen; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

export function DiscoverDatePicker({ value, onChange }: DiscoverDatePickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');

  // Get display label
  const getDisplayLabel = () => {
    if (value.mode === 'preset') {
      return presetOptions.find(o => o.value === value.preset)?.label ?? 'Any time';
    }
    if (value.mode === 'single' && value.singleDate) {
      return format(value.singleDate, 'MMM d');
    }
    if (value.mode === 'range' && value.dateRange?.from) {
      if (value.dateRange.to) {
        return `${format(value.dateRange.from, 'MMM d')} - ${format(value.dateRange.to, 'MMM d')}`;
      }
      return format(value.dateRange.from, 'MMM d');
    }
    return 'Any time';
  };

  const isActive = value.mode !== 'preset' || value.preset !== 'any';

  const handlePresetSelect = (preset: DiscoverWhen) => {
    onChange({ mode: 'preset', preset });
    setShowDropdown(false);
    setShowCalendar(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange({ mode: 'single', singleDate: date });
    setShowCalendar(false);
    setShowDropdown(false);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from) return;
    onChange({ mode: 'range', dateRange: range });
    if (range.to) {
      setShowCalendar(false);
      setShowDropdown(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ mode: 'preset', preset: 'any' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          setShowCalendar(false);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
        style={{
          background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.04)',
          color: isActive ? 'rgb(37, 99, 235)' : 'rgba(71, 85, 105, 0.8)',
        }}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="max-w-[100px] truncate">{getDisplayLabel()}</span>
        {isActive && (
          <button
            onClick={handleClear}
            className="p-0.5 -mr-0.5 rounded-full hover:bg-black/10"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-[10]" 
            onClick={() => {
              setShowDropdown(false);
              setShowCalendar(false);
            }} 
          />
          <div 
            className="absolute top-full left-0 mt-1 rounded-xl shadow-lg z-[11] overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              minWidth: showCalendar ? '280px' : '180px',
            }}
          >
            {!showCalendar ? (
              <div className="py-1">
                {/* Preset options */}
                {presetOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePresetSelect(opt.value)}
                    className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-black/5 transition-colors flex items-center gap-2"
                    style={{
                      color: value.mode === 'preset' && value.preset === opt.value 
                        ? 'rgb(37, 99, 235)' 
                        : '#1e293b',
                      fontWeight: value.mode === 'preset' && value.preset === opt.value ? 500 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
                
                {/* Divider */}
                <div className="h-px my-1 mx-2 bg-black/5" />
                
                {/* Custom date options */}
                <button
                  onClick={() => {
                    setCalendarMode('single');
                    setShowCalendar(true);
                  }}
                  className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-black/5 transition-colors flex items-center gap-2"
                  style={{ color: '#1e293b' }}
                >
                  <CalendarDays className="w-3.5 h-3.5 opacity-60" />
                  Pick a date
                </button>
                <button
                  onClick={() => {
                    setCalendarMode('range');
                    setShowCalendar(true);
                  }}
                  className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-black/5 transition-colors flex items-center gap-2"
                  style={{ color: '#1e293b' }}
                >
                  <CalendarDays className="w-3.5 h-3.5 opacity-60" />
                  Pick date range
                </button>
              </div>
            ) : (
              <div className="p-2">
                {/* Back button */}
                <button
                  onClick={() => setShowCalendar(false)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[12px] text-slate-500 hover:text-slate-700 mb-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                
                {calendarMode === 'single' ? (
                  <DayPicker
                    mode="single"
                    selected={value.singleDate}
                    onSelect={handleDateSelect}
                    disabled={{ before: new Date() }}
                    className={cn("p-2 pointer-events-auto")}
                    classNames={{
                      months: "flex flex-col",
                      month: "space-y-2",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-slate-800",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-slate-100 hover:bg-slate-200 p-0 rounded-md transition-colors inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-slate-400 rounded w-8 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-8 w-8 text-center text-sm p-0 relative",
                      day: "h-8 w-8 p-0 font-normal hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center text-slate-700",
                      day_selected: "bg-blue-500 text-white hover:bg-blue-600",
                      day_today: "bg-slate-100 font-medium",
                      day_outside: "text-slate-300",
                      day_disabled: "text-slate-300 hover:bg-transparent cursor-not-allowed",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                      IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                  />
                ) : (
                  <DayPicker
                    mode="range"
                    selected={value.dateRange}
                    onSelect={handleRangeSelect}
                    disabled={{ before: new Date() }}
                    numberOfMonths={1}
                    className={cn("p-2 pointer-events-auto")}
                    classNames={{
                      months: "flex flex-col",
                      month: "space-y-2",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-slate-800",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-slate-100 hover:bg-slate-200 p-0 rounded-md transition-colors inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-slate-400 rounded w-8 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-8 w-8 text-center text-sm p-0 relative",
                      day: "h-8 w-8 p-0 font-normal hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center text-slate-700",
                      day_selected: "bg-blue-500 text-white hover:bg-blue-600",
                      day_range_start: "rounded-l-md",
                      day_range_end: "rounded-r-md",
                      day_range_middle: "bg-blue-100 text-blue-700 rounded-none",
                      day_today: "bg-slate-100 font-medium",
                      day_outside: "text-slate-300",
                      day_disabled: "text-slate-300 hover:bg-transparent cursor-not-allowed",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                      IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper to convert DateFilterValue to query params
export function dateFilterToQueryParams(value: DateFilterValue): { startAt?: string; endAt?: string } {
  if (value.mode === 'preset') {
    // Handled by existing when logic in the hook
    return {};
  }
  
  if (value.mode === 'single' && value.singleDate) {
    // ±3 hour window around selected date
    const date = value.singleDate;
    return {
      startAt: startOfDay(date).toISOString(),
      endAt: endOfDay(date).toISOString(),
    };
  }
  
  if (value.mode === 'range' && value.dateRange?.from) {
    return {
      startAt: startOfDay(value.dateRange.from).toISOString(),
      endAt: value.dateRange.to 
        ? endOfDay(value.dateRange.to).toISOString()
        : endOfDay(value.dateRange.from).toISOString(),
    };
  }
  
  return {};
}

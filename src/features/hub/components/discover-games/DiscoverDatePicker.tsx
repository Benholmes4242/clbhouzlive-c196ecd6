/**
 * DiscoverDatePicker - Date/time picker for discover filters
 * 
 * Supports:
 * - Preset modes (today, week, month, any)
 * - Custom single date + optional time (±3h window when time selected)
 * - Custom date range
 */

import React, { useState } from 'react';
import { format, addHours, subHours, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';
import { Calendar, CalendarDays, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import type { DiscoverWhen } from '../../hooks/useDiscoverGamesV2';

export type DateMode = 'preset' | 'single' | 'range';

export interface DateFilterValue {
  mode: DateMode;
  preset?: DiscoverWhen;
  singleDate?: Date;
  singleTime?: string; // HH:mm format, optional
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

// Generate time options every 30 minutes
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 5; h <= 21; h++) {
  for (const m of [0, 30]) {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    TIME_OPTIONS.push({
      value: `${hh}:${mm}`,
      label: format(new Date(2000, 0, 1, h, m), 'h:mm a'),
    });
  }
}

export function DiscoverDatePicker({ value, onChange }: DiscoverDatePickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Get display label
  const getDisplayLabel = () => {
    if (value.mode === 'preset') {
      return presetOptions.find(o => o.value === value.preset)?.label ?? 'Any time';
    }
    if (value.mode === 'single' && value.singleDate) {
      const dateStr = format(value.singleDate, 'MMM d');
      if (value.singleTime) {
        const [h, m] = value.singleTime.split(':').map(Number);
        const timeStr = format(new Date(2000, 0, 1, h, m), 'h:mm a');
        return `${dateStr}, ${timeStr}`;
      }
      return dateStr;
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
    setShowTimePicker(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange({ mode: 'single', singleDate: date, singleTime: value.singleTime });
    // Show time picker after selecting date
    setShowTimePicker(true);
  };

  const handleTimeSelect = (time: string | null) => {
    if (value.mode === 'single' && value.singleDate) {
      onChange({ 
        mode: 'single', 
        singleDate: value.singleDate, 
        singleTime: time || undefined 
      });
    }
    setShowCalendar(false);
    setShowDropdown(false);
    setShowTimePicker(false);
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
    setShowTimePicker(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          setShowCalendar(false);
          setShowTimePicker(false);
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "bg-muted text-muted-foreground"
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{getDisplayLabel()}</span>
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
              setShowTimePicker(false);
            }} 
          />
          <div 
            className={cn(
              "absolute top-full left-0 mt-1 rounded-xl shadow-lg z-[11] overflow-hidden",
              "bg-popover border border-border backdrop-blur-xl"
            )}
            style={{ minWidth: showCalendar ? '280px' : '180px' }}
          >
            {!showCalendar ? (
              <div className="py-1">
                {/* Preset options */}
                {presetOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePresetSelect(opt.value)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-[13px] hover:bg-muted transition-colors flex items-center gap-2",
                      value.mode === 'preset' && value.preset === opt.value 
                        ? "text-primary font-medium" 
                        : "text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                
                {/* Divider */}
                <div className="h-px my-1 mx-2 bg-border" />
                
                {/* Custom date options */}
                <button
                  onClick={() => {
                    setCalendarMode('single');
                    setShowCalendar(true);
                    setShowTimePicker(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-[13px] text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <CalendarDays className="w-3.5 h-3.5 opacity-60" />
                  Pick a date & time
                </button>
                <button
                  onClick={() => {
                    setCalendarMode('range');
                    setShowCalendar(true);
                    setShowTimePicker(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-[13px] text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <CalendarDays className="w-3.5 h-3.5 opacity-60" />
                  Pick date range
                </button>
              </div>
            ) : showTimePicker && calendarMode === 'single' ? (
              <div className="p-3">
                {/* Back button */}
                <button
                  onClick={() => setShowTimePicker(false)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back to calendar
                </button>

                <div className="text-sm font-medium text-foreground mb-2 px-1">
                  {value.singleDate && format(value.singleDate, 'EEEE, MMMM d')}
                </div>

                {/* Time picker */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Select a tee time (optional)</span>
                </div>
                
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  <button
                    onClick={() => handleTimeSelect(null)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[13px] rounded-lg transition-colors",
                      !value.singleTime
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    Flexible (all day)
                  </button>
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleTimeSelect(opt.value)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[13px] rounded-lg transition-colors",
                        value.singleTime === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground mt-2 px-1">
                  Selecting a time shows games ±3 hours around it
                </p>
              </div>
            ) : (
              <div className="p-2">
                {/* Back button */}
                <button
                  onClick={() => setShowCalendar(false)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-1"
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
                      caption_label: "text-sm font-medium text-foreground",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-muted hover:bg-muted/80 p-0 rounded-md transition-colors inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded w-8 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-8 w-8 text-center text-sm p-0 relative",
                      day: "h-8 w-8 p-0 font-normal hover:bg-muted rounded-md transition-colors inline-flex items-center justify-center text-foreground",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                      day_today: "bg-muted font-medium",
                      day_outside: "text-muted-foreground/40",
                      day_disabled: "text-muted-foreground/40 hover:bg-transparent cursor-not-allowed",
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
                      caption_label: "text-sm font-medium text-foreground",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-muted hover:bg-muted/80 p-0 rounded-md transition-colors inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded w-8 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-8 w-8 text-center text-sm p-0 relative",
                      day: "h-8 w-8 p-0 font-normal hover:bg-muted rounded-md transition-colors inline-flex items-center justify-center text-foreground",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                      day_range_start: "rounded-l-md",
                      day_range_end: "rounded-r-md",
                      day_range_middle: "bg-primary/20 text-primary rounded-none",
                      day_today: "bg-muted font-medium",
                      day_outside: "text-muted-foreground/40",
                      day_disabled: "text-muted-foreground/40 hover:bg-transparent cursor-not-allowed",
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

/**
 * Helper to convert DateFilterValue to query params
 * - Single date without time: full day (startOfDay to endOfDay)
 * - Single date with time: ±3 hour window around selected time
 * - Range: startOfDay(from) to endOfDay(to)
 */
export function dateFilterToQueryParams(value: DateFilterValue): { startAt?: string; endAt?: string } {
  if (value.mode === 'preset') {
    // Handled by existing when logic in the hook
    return {};
  }
  
  if (value.mode === 'single' && value.singleDate) {
    const date = value.singleDate;
    
    if (value.singleTime) {
      // ±3 hour window around selected time
      const [hours, minutes] = value.singleTime.split(':').map(Number);
      const selectedDateTime = setMinutes(setHours(date, hours), minutes);
      return {
        startAt: subHours(selectedDateTime, 3).toISOString(),
        endAt: addHours(selectedDateTime, 3).toISOString(),
      };
    }
    
    // No time selected: full day
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

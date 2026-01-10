/**
 * TimeOfDayChips - Quick filter chips for time of day
 * 
 * Options:
 * - Any (default)
 * - Morning (05:00–11:59)
 * - Midday (12:00–15:59)
 * - Afternoon (16:00–20:59)
 */

import React from 'react';
import { Sun, Sunrise, Sunset, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';

export type TimeOfDay = 'any' | 'morning' | 'midday' | 'afternoon';

interface TimeOfDayChipsProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
  disabled?: boolean;
}

const timeOfDayOptions: Array<{
  value: TimeOfDay;
  label: string;
  icon: React.ElementType;
  range: string;
}> = [
  { value: 'any', label: 'Any', icon: Clock, range: '' },
  { value: 'morning', label: 'Morning', icon: Sunrise, range: '5am-12pm' },
  { value: 'midday', label: 'Midday', icon: Sun, range: '12pm-4pm' },
  { value: 'afternoon', label: 'Afternoon', icon: Sunset, range: '4pm-9pm' },
];

export function TimeOfDayChips({ value, onChange, disabled }: TimeOfDayChipsProps) {
  const handleSelect = (newValue: TimeOfDay) => {
    if (disabled) return;
    haptic('light');
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {timeOfDayOptions.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-150",
              "border",
              isActive
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="w-3 h-3" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get time range for a given TimeOfDay selection
 * Returns start and end hours (24h format)
 */
export function getTimeOfDayRange(tod: TimeOfDay): { startHour: number; endHour: number } | null {
  switch (tod) {
    case 'morning':
      return { startHour: 5, endHour: 12 }; // 05:00-11:59
    case 'midday':
      return { startHour: 12, endHour: 16 }; // 12:00-15:59
    case 'afternoon':
      return { startHour: 16, endHour: 21 }; // 16:00-20:59
    case 'any':
    default:
      return null;
  }
}

/**
 * Detect which TimeOfDay matches a given hour
 */
export function detectTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 21) return 'afternoon';
  return 'any';
}

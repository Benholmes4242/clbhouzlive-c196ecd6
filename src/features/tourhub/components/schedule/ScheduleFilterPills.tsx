/**
 * ScheduleFilterPills - Premium tab-style filters with clear active states
 * 
 * Features:
 * - Prominent active state with pill background
 * - Smooth transitions between tabs
 * - Pulsing dot for Live when live events exist
 * - Minimum 44px touch targets
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type ScheduleFilterType = 'all' | 'upcoming' | 'live' | 'completed';

interface FilterOption {
  value: ScheduleFilterType;
  label: string;
  hasLiveIndicator?: boolean;
}

interface ScheduleFilterPillsProps {
  activeFilter: ScheduleFilterType;
  onFilterChange: (filter: ScheduleFilterType) => void;
  counts: {
    all: number;
    live: number;
    upcoming: number;
    completed: number;
  };
}

export function ScheduleFilterPills({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: ScheduleFilterPillsProps) {
  const options: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live', hasLiveIndicator: true },
    { value: 'completed', label: 'Completed' },
  ];

  const showLiveDot = counts.live > 0;

  return (
    <div 
      className="py-2 mx-4"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {/* Pill container with subtle background - full width to match hero card */}
      <div 
        className="flex items-center justify-center gap-1 p-1 rounded-xl w-full"
        style={{ background: '#e2e8f0' }}
      >
        {options.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "relative px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                "min-h-[44px] min-w-[44px]", // Accessibility touch target
                isActive 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {option.label}
                
                {/* Live indicator dot */}
                {option.hasLiveIndicator && showLiveDot && (
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    isActive 
                      ? "bg-red-500 animate-pulse" 
                      : "bg-red-400"
                  )} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

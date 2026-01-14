/**
 * ScheduleFilterPills - Tab-style filters with neutral slate styling
 * No orange accents - uses black underline for active state
 */

import { cn } from '@/lib/utils';

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
      className="py-3"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {/* Horizontal scroll on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {options.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-lg",
                "transition-all duration-200 ease-out whitespace-nowrap",
                "inline-flex items-center justify-center gap-1.5",
                isActive 
                  ? "bg-black text-white" 
                  : "bg-transparent text-muted-foreground hover:bg-black/5 hover:text-foreground"
              )}
            >
              {option.label}
              
              {/* Live indicator dot */}
              {option.hasLiveIndicator && showLiveDot && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  isActive ? "bg-white" : "bg-slate-500"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

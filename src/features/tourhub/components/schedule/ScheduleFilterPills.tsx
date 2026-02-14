/**
 * ScheduleFilterPills - Simple text tab row with active underline
 * 
 * Matches the Course Details page pattern:
 * - Plain text tabs in a horizontal row
 * - Active tab: text-foreground + 2px bottom underline
 * - Inactive tab: text-muted-foreground
 * - Live tab keeps red dot indicator
 * - 44px minimum touch targets
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
      className="flex items-center gap-4 px-4 py-2 border-b border-border/10"
      role="tablist"
      aria-label="Filter tournaments"
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
              "relative text-sm font-semibold py-2.5 min-h-[44px] transition-colors duration-200",
              "bg-transparent border-0 shadow-none rounded-none",
              "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-full after:transition-all after:duration-200 after:ease-out",
              isActive
                ? "text-foreground after:w-full after:opacity-100 after:bg-foreground"
                : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              {option.label}
              
              {/* Live count + red dot indicator */}
              {option.hasLiveIndicator && showLiveDot && (
                <>
                  <span className="text-[11px]">({counts.live})</span>
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75",
                      isActive ? "animate-ping bg-red-500" : "bg-red-400"
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isActive ? "bg-red-500" : "bg-red-400"
                    )} />
                  </span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

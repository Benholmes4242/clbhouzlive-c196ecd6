/**
 * ScheduleFilterPills - Tab-style filters matching courses page tabs
 * Uses orange underline indicator (same as Explore/Top 100/Friends tabs)
 */

import { cn } from '@/lib/utils';

export type ScheduleFilterType = 'all' | 'upcoming' | 'live' | 'completed';

interface FilterOption {
  value: ScheduleFilterType;
  label: string;
  showCount?: boolean;
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
    { value: 'completed', label: 'Completed', showCount: true },
  ];

  const showLiveDot = counts.live > 0;

  return (
    <div 
      className="py-3"
      role="tablist"
      aria-label="Filter tournaments"
    >
      <div className="flex items-center">
        {options.map((option) => {
          const isActive = activeFilter === option.value;
          const count = counts[option.value];

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "relative text-sm px-3 py-2.5 font-medium",
                "bg-transparent border-0 shadow-none rounded-none",
                "transition-colors duration-200 ease-out",
                "flex items-center gap-2",
                // Orange underline using after pseudo-element
                "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                "after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))]",
                "after:transition-all after:duration-200 after:ease-out",
                isActive 
                  ? "text-foreground after:w-full after:opacity-[0.85]" 
                  : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
              )}
            >
              <span>{option.label}</span>
              
              {/* Live indicator dot */}
              {option.hasLiveIndicator && showLiveDot && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              
              {/* Completed count badge */}
              {option.showCount && count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-normal bg-muted text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

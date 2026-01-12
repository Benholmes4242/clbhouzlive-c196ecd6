/**
 * ScheduleFilterPills - Tab-style filters matching Discover tabs
 * Uses underline indicator instead of pills
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
      <div className="flex items-center gap-1">
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
                "relative px-4 py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                "flex items-center gap-2",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <span>{option.label}</span>
              
              {/* Live indicator dot */}
              {option.hasLiveIndicator && showLiveDot && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              
              {/* Completed count badge */}
              {option.showCount && count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-normal",
                  isActive 
                    ? "bg-muted text-muted-foreground" 
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  {count}
                </span>
              )}

              {/* Orange underline indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

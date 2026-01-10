/**
 * ScheduleFilterPills - Premium segmented pill controls
 * Matches Overview styling with subtle elevation on active state
 */

import { cn } from '@/lib/utils';

export type ScheduleFilterType = 'all' | 'upcoming' | 'live' | 'completed';

interface FilterOption {
  value: ScheduleFilterType;
  label: string;
  count?: number;
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
    { value: 'all', label: 'All', count: counts.all },
    { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { value: 'live', label: 'Live', count: counts.live, hasLiveIndicator: true },
    { value: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div 
      className="flex gap-1.5 p-1.5 rounded-xl bg-muted/50 backdrop-blur-sm"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {options.map((option) => {
        const isActive = activeFilter === option.value;
        const showCount = option.value !== 'all' && option.count !== undefined && option.count > 0;
        const showLiveDot = option.hasLiveIndicator && counts.live > 0;

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{option.label}</span>
            
            {showCount && (
              <span 
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "bg-background/60"
                )}
              >
                {option.count}
              </span>
            )}
            
            {showLiveDot && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}

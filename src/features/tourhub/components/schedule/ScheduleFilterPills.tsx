/**
 * ScheduleFilterPills - Premium pill-style filters
 * Active: solid dark background, white text, rounded-full
 * Inactive: transparent with subtle border
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
      <div className="flex items-center gap-2 flex-wrap">
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
                "px-4 py-2 rounded-full text-sm font-medium",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                "flex items-center gap-2",
                isActive 
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm" 
                  : "bg-transparent border border-border text-foreground/80 hover:bg-muted/50 hover:border-border/80"
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
                    ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900" 
                    : "bg-muted text-muted-foreground"
                )}>
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

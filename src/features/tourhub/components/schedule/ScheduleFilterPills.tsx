/**
 * ScheduleFilterPills - Tab-style filters matching courses page tabs
 * Uses orange underline indicator
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
                "flex flex-col items-center gap-1 py-3 px-4 relative",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                "hover:bg-muted/50",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{option.label}</span>
                
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
              </div>

              {/* Orange underline indicator */}
              {isActive && (
                <div 
                  className="w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-fade-in"
                  style={{ marginTop: '4px' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

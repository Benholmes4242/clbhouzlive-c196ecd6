/**
 * ScheduleFilterPills - Segmented control style filters
 * Premium mode-switching design with pill backgrounds
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
  // Upgraded microcopy
  const options: FilterOption[] = [
    { value: 'all', label: 'Full Season' },
    { value: 'upcoming', label: "What's Next" },
    { value: 'live', label: 'In Play', hasLiveIndicator: true },
    { value: 'completed', label: 'Finished' },
  ];

  const showLiveDot = counts.live > 0;

  return (
    <div 
      className="py-2"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {/* Segmented control container */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50">
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
                "transition-all duration-200 ease-out",
                "inline-flex items-center justify-center gap-1.5",
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {option.label}
              
              {/* Live indicator dot */}
              {option.hasLiveIndicator && showLiveDot && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

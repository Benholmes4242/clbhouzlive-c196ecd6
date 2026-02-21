/**
 * ScheduleFilterPills - Segmented control matching LiveUpcomingToggle style
 * Transparent track, white active pill with shadow
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

  return (
    <div 
      className="py-1"
      role="tablist"
      aria-label="Filter tournaments"
    >
      <div className="flex items-stretch rounded-xl overflow-hidden bg-transparent">
        {options.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "relative flex-1 py-2.5 text-[14px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] flex items-center justify-center gap-1.5",
                isActive
                  ? "bg-card text-foreground shadow-sm m-1 rounded-lg"
                  : "text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 active:bg-muted/70"
              )}
            >
              {option.hasLiveIndicator && counts.live > 0 && (
                <span className="relative flex h-[6px] w-[6px]">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                    style={{ background: '#22C55E' }}
                  />
                  <span className="relative inline-flex rounded-full h-[6px] w-[6px]" style={{ background: '#22C55E' }} />
                </span>
              )}
              {option.label}
              {option.hasLiveIndicator && counts.live > 0 && (
                <span className="text-[11px]">({counts.live})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
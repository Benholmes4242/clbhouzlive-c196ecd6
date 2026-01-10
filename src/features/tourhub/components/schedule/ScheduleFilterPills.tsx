/**
 * ScheduleFilterPills - Tab-style filters matching Discover page
 * Uses underline active state with orange accent like Explore, Top 100, Friends tabs
 */

import { cn } from '@/lib/utils';
import '@/styles/discover-tabs.css';

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
    { value: 'completed', label: `Completed · ${counts.completed}` },
  ];

  const showLiveDot = counts.live > 0;

  return (
    <div 
      className="discover-header relative w-full"
      role="tablist"
      aria-label="Filter tournaments"
    >
      <div className="discover-tabs flex w-full items-center">
        <div className="flex flex-1">
          {options.map((option) => {
            const isActive = activeFilter === option.value;

            return (
              <button
                key={option.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(option.value)}
                className={cn(
                  "discover-tab flex-1 py-[10px] px-4 text-center relative z-10 text-heading-md font-medium leading-tight",
                  "transition-all duration-motion-fast ease-standard",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  "flex items-center justify-center gap-1.5",
                  isActive 
                    ? "active text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80 motion-reduce:transition-none"
                )}
              >
                <span>{option.label}</span>
                
                {option.hasLiveIndicator && showLiveDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

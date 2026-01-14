/**
 * ScheduleFilterPills - Tab-style filters with orange underline (matching Explore page)
 * Matches ProfileTabsNav / StickyFilterBar style exactly
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

  // Tab trigger class matching ProfileTabsNav / StickyFilterBar exactly
  const tabClass = (isActive: boolean) => cn(
    "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none transition-colors duration-200 ease-out whitespace-nowrap",
    isActive 
      ? "text-slate-800" 
      : "text-slate-800/60 hover:text-slate-800",
    // Underline indicator - exact match to ProfileTabsNav
    "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out",
    isActive 
      ? "after:w-full after:opacity-[0.85]" 
      : "after:w-0 after:opacity-0"
  );

  return (
    <div 
      className="py-1"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {/* Centered tabs container matching ProfileTabsNav / StickyFilterBar */}
      <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(tabClass(isActive), "inline-flex items-center justify-center gap-1.5")}
            >
              <span>{option.label}</span>
              
              {/* Live indicator dot */}
              {option.hasLiveIndicator && showLiveDot && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  isActive ? "bg-[hsl(var(--tab-orange))]" : "bg-slate-400"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
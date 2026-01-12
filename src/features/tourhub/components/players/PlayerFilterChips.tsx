/**
 * PlayerFilterChips - Filter pills for player discovery
 * Matches Discover page tab styling with underline + player counts
 */

import { cn } from '@/lib/utils';
import '@/styles/discover-tabs.css';

export type PlayerFilterType = 'all' | 'top-ranked' | 'most-active' | 'rookies';

interface PlayerFilterChipsProps {
  activeFilter: PlayerFilterType;
  onFilterChange: (filter: PlayerFilterType) => void;
  counts?: {
    all: number;
    topRanked: number;
    mostActive: number;
    rookies: number;
  };
}

const filters: { value: PlayerFilterType; label: string; countKey: keyof NonNullable<PlayerFilterChipsProps['counts']> }[] = [
  { value: 'all', label: 'All Players', countKey: 'all' },
  { value: 'top-ranked', label: 'Top Ranked', countKey: 'topRanked' },
  { value: 'most-active', label: 'Most Active', countKey: 'mostActive' },
  { value: 'rookies', label: 'Rookies', countKey: 'rookies' },
];

export function PlayerFilterChips({ activeFilter, onFilterChange, counts }: PlayerFilterChipsProps) {
  return (
    <div 
      className="discover-header relative w-full"
      role="tablist"
      aria-label="Filter players"
    >
      <div className="discover-tabs flex w-full items-center">
        <div className="flex flex-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;
            const count = counts?.[filter.countKey];

            return (
              <button
                key={filter.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "discover-tab flex-1 py-[10px] px-2 text-center relative z-10 text-[13px] font-medium leading-tight",
                  "transition-all duration-motion-fast ease-standard",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  isActive 
                    ? "active text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80 motion-reduce:transition-none"
                )}
              >
                <span>{filter.label}</span>
                {count !== undefined && (
                  <span className={cn(
                    "ml-1",
                    isActive ? "text-foreground/70" : "text-muted-foreground/60"
                  )}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

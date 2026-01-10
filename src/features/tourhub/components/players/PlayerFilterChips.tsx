/**
 * PlayerFilterChips - Filter pills for player discovery
 * Matches Discover page tab styling with underline
 */

import { cn } from '@/lib/utils';
import '@/styles/discover-tabs.css';

export type PlayerFilterType = 'all' | 'top-ranked' | 'most-active' | 'rookies';

interface PlayerFilterChipsProps {
  activeFilter: PlayerFilterType;
  onFilterChange: (filter: PlayerFilterType) => void;
}

const filters: { value: PlayerFilterType; label: string }[] = [
  { value: 'all', label: 'All Players' },
  { value: 'top-ranked', label: 'Top Ranked' },
  { value: 'most-active', label: 'Most Active' },
  { value: 'rookies', label: 'Rookies' },
];

export function PlayerFilterChips({ activeFilter, onFilterChange }: PlayerFilterChipsProps) {
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

            return (
              <button
                key={filter.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "discover-tab flex-1 py-[10px] px-4 text-center relative z-10 text-heading-md font-medium leading-tight",
                  "transition-all duration-motion-fast ease-standard",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  isActive 
                    ? "active text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80 motion-reduce:transition-none"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

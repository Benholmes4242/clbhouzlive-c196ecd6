/**
 * PlayerFilterChips - Tab-style filters matching schedule page tabs exactly
 * Uses orange underline indicator (same as Schedule tabs)
 */

import { cn } from '@/lib/utils';

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
      className="py-3"
      role="tablist"
      aria-label="Filter players"
    >
      {/* Grid layout matching schedule page - 4 columns, centered */}
      <div className="grid w-full grid-cols-4 bg-transparent border-0 px-0 py-0 gap-0">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                // Exact same styling as schedule page tabs
                "relative text-sm px-3 py-2.5 font-medium",
                "bg-transparent border-0 shadow-none rounded-none",
                "transition-colors duration-200 ease-out",
                "inline-flex items-center justify-center gap-1",
                // Orange underline using after pseudo-element
                "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                "after:h-[3px] after:rounded-full after:bg-[hsl(var(--tab-orange))]",
                "after:transition-all after:duration-200 after:ease-out",
                isActive 
                  ? "text-foreground after:w-full after:opacity-[0.85]" 
                  : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

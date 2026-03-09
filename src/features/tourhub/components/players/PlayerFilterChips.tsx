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
                "px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold",
                "inline-flex items-center justify-center gap-1",
                isActive
                  ? "text-white"
                  : "text-muted-foreground bg-muted"
              )}
              style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

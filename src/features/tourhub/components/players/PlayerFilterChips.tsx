/**
 * PlayerFilterChips - Mode-switch style tabs with pill backgrounds
 * Premium segmented control feel
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

// Cleaner, shorter labels
const filters: { value: PlayerFilterType; label: string; countKey: keyof NonNullable<PlayerFilterChipsProps['counts']> }[] = [
  { value: 'all', label: 'All', countKey: 'all' },
  { value: 'top-ranked', label: 'Ranked', countKey: 'topRanked' },
  { value: 'most-active', label: 'Active', countKey: 'mostActive' },
  { value: 'rookies', label: 'Rookies', countKey: 'rookies' },
];

export function PlayerFilterChips({ activeFilter, onFilterChange, counts }: PlayerFilterChipsProps) {
  return (
    <div 
      className="py-2"
      role="tablist"
      aria-label="Filter players"
    >
      {/* Mode-switch segmented control */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-lg",
                "transition-all duration-200 ease-out",
                "inline-flex items-center justify-center gap-1.5",
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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

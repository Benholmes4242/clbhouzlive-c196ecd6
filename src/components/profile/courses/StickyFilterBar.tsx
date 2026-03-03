/**
 * StickyFilterBar - Filter tabs for All Courses Played
 * 
 * Updated to Hub toggle bar style (rounded pill container with active white pill)
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type CourseFilterType = 
  | 'all' 
  | 'rated' 
  | 'unrated' 
  | 'regulars' 
  | 'travel' 
  | 'top100' 
  | 'highest-rated' 
  | 'recently-played';

interface StickyFilterBarProps {
  activeFilter: CourseFilterType;
  onFilterChange: (filter: CourseFilterType) => void;
  counts?: Partial<Record<CourseFilterType, number>>;
  onOpenFilters?: () => void;
  isSticky?: boolean;
}

const filters: { id: CourseFilterType; label: string; showCount?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'top100', label: 'Top 100', showCount: true },
  { id: 'highest-rated', label: 'Rating' },
  { id: 'recently-played', label: 'Recent' },
];

export const StickyFilterBar: React.FC<StickyFilterBarProps> = ({
  activeFilter,
  onFilterChange,
  counts = {},
  onOpenFilters,
  isSticky = false,
}) => {
  const top100Count = counts.top100;

  return (
    <div className="py-2">
      <div 
        className="inline-flex p-1 w-full"
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "relative flex-1 py-1.5 px-4 text-sm transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] rounded-lg",
                isActive
                  ? "bg-foreground text-background font-semibold shadow-sm"
                  : "text-muted-foreground font-medium hover:text-foreground"
              )}
            >
              {filter.label}
              {filter.showCount && top100Count !== undefined && top100Count > 0 && (
                <span className={cn(
                  "ml-1 text-[11px]",
                  isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {top100Count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
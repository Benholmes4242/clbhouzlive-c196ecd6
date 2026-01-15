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
    <div className="py-3">
      <div 
        className="inline-flex items-center gap-1 p-1 rounded-full"
        style={{ background: '#e2e8f0' }}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150",
                isActive
                  ? "bg-white text-[#1e293b] shadow-sm"
                  : "text-[#64748b] hover:text-[#1e293b]"
              )}
            >
              {filter.label}
              {filter.showCount && top100Count !== undefined && top100Count > 0 && (
                <span className={cn(
                  "ml-1.5 text-xs",
                  isActive ? "text-[#64748b]" : "text-[#94a3b8]"
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

/**
 * StickyFilterBar - Filter tabs for All Courses Played
 * 
 * Updated to match ProfileTabsNav style (underline indicator)
 */
import React from 'react';
import { Trophy, Star, Clock, Filter } from 'lucide-react';
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

interface FilterOption {
  key: CourseFilterType;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface StickyFilterBarProps {
  activeFilter: CourseFilterType;
  onFilterChange: (filter: CourseFilterType) => void;
  counts?: Partial<Record<CourseFilterType, number>>;
  onOpenFilters?: () => void;
  isSticky?: boolean;
}

export const StickyFilterBar: React.FC<StickyFilterBarProps> = ({
  activeFilter,
  onFilterChange,
  counts = {},
  onOpenFilters,
  isSticky = false,
}) => {
  const filterOptions: FilterOption[] = [
    { key: 'all', label: 'All' },
    { key: 'top100', label: 'Top 100', count: counts.top100 },
    { key: 'highest-rated', label: 'Highest' },
    { key: 'recently-played', label: 'Recent' },
  ];

  // Tab trigger class matching ProfileTabsNav exactly
  const tabClass = (isActive: boolean) => cn(
    "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none transition-colors duration-200 ease-out whitespace-nowrap",
    isActive 
      ? "text-foreground" 
      : "text-muted-foreground hover:text-foreground",
    // Underline indicator - exact match to ProfileTabsNav
    "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out",
    isActive 
      ? "after:w-full after:opacity-[0.85]" 
      : "after:w-0 after:opacity-0"
  );

  return (
    <div 
      className={cn(
        "transition-all",
        isSticky && "bg-background/95 backdrop-blur-md shadow-sm"
      )}
    >
      {/* Centered tabs container matching ProfileTabsNav */}
      <div className="px-4">
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${filterOptions.length}, minmax(0, 1fr))` }}>
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.key;
            
            return (
              <button
                key={option.key}
                onClick={() => onFilterChange(option.key)}
                className={tabClass(isActive)}
              >
                <span>{option.label}</span>
                {option.count !== undefined && option.count > 0 && (
                  <span className="text-xs text-muted-foreground/60 ml-1">
                    {option.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

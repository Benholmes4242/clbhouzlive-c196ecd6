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
    { key: 'top100', label: 'Top 100', icon: <Trophy className="w-3.5 h-3.5" />, count: counts.top100 },
    { key: 'highest-rated', label: 'Highest', icon: <Star className="w-3.5 h-3.5" /> },
    { key: 'recently-played', label: 'Recent', icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  // Tab trigger class matching ProfileTabsNav style
  const tabClass = (isActive: boolean) => cn(
    "relative flex items-center gap-1.5 text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none transition-colors duration-200 ease-out whitespace-nowrap",
    isActive 
      ? "text-foreground" 
      : "text-muted-foreground hover:text-foreground",
    // Underline indicator
    "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out",
    isActive 
      ? "after:w-full after:opacity-[0.85]" 
      : "after:w-0 after:opacity-0"
  );

  return (
    <div 
      className={cn(
        "border-b border-border/30 transition-all",
        isSticky && "bg-background/95 backdrop-blur-md shadow-sm"
      )}
    >
      <div className="flex items-center">
        {/* Filter tabs - horizontal scroll */}
        <div className="flex-1 flex overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.key;
            
            return (
              <button
                key={option.key}
                onClick={() => onFilterChange(option.key)}
                className={tabClass(isActive)}
              >
                {option.icon && (
                  <span className={cn(
                    isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}>
                    {option.icon}
                  </span>
                )}
                <span>{option.label}</span>
                {option.count !== undefined && option.count > 0 && (
                  <span className={cn(
                    "text-xs",
                    isActive 
                      ? "text-muted-foreground" 
                      : "text-muted-foreground/60"
                  )}>
                    {option.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Advanced filters button */}
        {onOpenFilters && (
          <button
            onClick={onOpenFilters}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
            title="More filters"
          >
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

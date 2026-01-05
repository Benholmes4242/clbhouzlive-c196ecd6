import React from 'react';
import { Trophy, Star, Clock, Globe, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
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
  // Ordered by how golfers think
  const filterOptions: FilterOption[] = [
    { key: 'all', label: 'All' },
    { key: 'top100', label: 'Top 100', icon: <Trophy className="w-3 h-3" />, count: counts.top100 },
    { key: 'highest-rated', label: 'Highest', icon: <Star className="w-3 h-3" /> },
    { key: 'rated', label: 'Rated', count: counts.rated },
    { key: 'unrated', label: 'Unrated', count: counts.unrated },
    { key: 'recently-played', label: 'Recent', icon: <Clock className="w-3 h-3" /> },
    { key: 'travel', label: 'Travel', icon: <Globe className="w-3 h-3" /> },
  ];

  return (
    <div 
      className={cn(
        "py-3 transition-all",
        isSticky && "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Filter pills - horizontal scroll */}
        <div className="flex-1 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.key;
            const isTop100Filter = option.key === 'top100';
            
            return (
              <motion.button
                key={option.key}
                onClick={() => onFilterChange(option.key)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all",
                  isActive
                    ? isTop100Filter
                      // Top 100 filter when active gets gold emphasis
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                    : isTop100Filter
                      // Top 100 filter when inactive gets subtle gold hint
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200/50 dark:border-amber-700/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {/* Active underline indicator - gold for Top 100 */}
                {isActive && (
                  <motion.div
                    layoutId="activeFilterIndicator"
                    className={cn(
                      "absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full",
                      isTop100Filter ? "bg-amber-400" : "bg-slate-900 dark:bg-white"
                    )}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {option.icon && (
                  <span className={cn(
                    isActive 
                      ? "text-white" 
                      : isTop100Filter 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-slate-500 dark:text-slate-400"
                  )}>
                    {option.icon}
                  </span>
                )}
                <span>{option.label}</span>
                {option.count !== undefined && option.count > 0 && (
                  <span className={cn(
                    "text-[10px]",
                    isActive 
                      ? "text-white/70" 
                      : isTop100Filter
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                  )}>
                    {option.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Advanced filters button */}
        {onOpenFilters && (
          <button
            onClick={onOpenFilters}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="More filters"
          >
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

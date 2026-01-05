import React from 'react';
import { Trophy, Star, Clock, Globe, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

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
      className={`py-3 transition-all ${
        isSticky 
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' 
          : ''
      }`}
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
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sq-pill whitespace-nowrap transition-all ${
                  isActive
                    ? isTop100Filter
                      ? 'bg-amber-50 text-amber-900 shadow-sm border border-amber-200'
                      : 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {/* Active underline indicator - gold for Top 100 */}
                {isActive && (
                  <motion.div
                    layoutId="activeFilterIndicator"
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${
                      isTop100Filter ? 'bg-amber-500' : 'bg-slate-900'
                    }`}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {option.icon && (
                  <span className={
                    isActive 
                      ? isTop100Filter 
                        ? 'text-amber-600' 
                        : 'text-white'
                      : 'text-slate-500'
                  }>
                    {option.icon}
                  </span>
                )}
                <span>{option.label}</span>
                {option.count !== undefined && option.count > 0 && (
                  <span className={`text-[10px] ${
                    isActive 
                      ? isTop100Filter 
                        ? 'text-amber-600/70' 
                        : 'text-white/70'
                      : 'text-slate-400'
                  }`}>
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
            className="flex-shrink-0 p-2 rounded-sq-sm hover:bg-slate-100 transition-colors"
            title="More filters"
          >
            <Filter className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
};

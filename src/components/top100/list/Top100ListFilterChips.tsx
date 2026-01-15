import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Top100FilterChip = 'official' | 'community' | 'played' | 'unplayed';
export type Top100SortMode = 'rating_high' | 'rating_low' | 'most_rated' | 'az' | 'za';

interface Top100ListFilterChipsProps {
  activeFilter: Top100FilterChip;
  onFilterChange: (filter: Top100FilterChip) => void;
  activeSort: Top100SortMode;
  onSortChange: (sort: Top100SortMode) => void;
  counts?: Partial<Record<Top100FilterChip, number>>;
  isSticky?: boolean;
  hasReviewData?: boolean;
}

const FILTER_OPTIONS: { value: Top100FilterChip; label: string }[] = [
  { value: 'official', label: 'Official Rating' },
  { value: 'community', label: 'Community Rating' },
  { value: 'played', label: 'Played' },
  { value: 'unplayed', label: 'Unplayed' },
];

const SORT_OPTIONS: { value: Top100SortMode; label: string; requiresReviewData?: boolean }[] = [
  { value: 'rating_high', label: 'High to Low' },
  { value: 'rating_low', label: 'Low to High' },
  { value: 'most_rated', label: 'Most Rated', requiresReviewData: true },
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
];

/**
 * Two inline Explore-style dropdowns for filter (Show) and sort (Sort).
 * 
 * Polish applied:
 * - Smooth transitions between states
 * - Better visual hierarchy
 * - Animated chevron on dropdown open
 */
export const Top100ListFilterChips: React.FC<Top100ListFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  counts = {},
  isSticky = false,
  hasReviewData = false,
}) => {
  const currentFilterLabel = FILTER_OPTIONS.find(f => f.value === activeFilter)?.label || 'Official Rating';
  const currentSortLabel = SORT_OPTIONS.find(s => s.value === activeSort)?.label || 'High to Low';

  // When Played/Unplayed is active, only rating_high is enabled
  const isPlayedOrUnplayed = activeFilter === 'played' || activeFilter === 'unplayed';

  // Filter sort options based on available data
  const availableSortOptions = SORT_OPTIONS.filter(
    opt => !opt.requiresReviewData || hasReviewData
  );

  return (
    <motion.div 
      className={`px-4 py-3 transition-all duration-200 ${
        isSticky 
          ? 'bg-slate-50/98 backdrop-blur-md border-b border-slate-200/80 shadow-sm' 
          : 'bg-slate-50 border-b border-slate-200/60'
      }`}
      initial={false}
      animate={{ 
        boxShadow: isSticky ? '0 4px 12px rgba(0,0,0,0.06)' : '0 0 0 rgba(0,0,0,0)' 
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-center gap-2">
        {/* Show dropdown (Filter) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-between w-44 px-3 py-2.5 rounded-sq-sm bg-white border border-slate-200 hover:border-[#e2e8f0] hover:shadow-sm transition-all duration-150 text-sm font-medium text-[#1e293b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e2e8f0]"
            >
              <span className="truncate">{currentFilterLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b] flex-shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px] bg-white border-[#e2e8f0] shadow-lg z-50">
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.value;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`cursor-pointer transition-colors duration-100 ${
                    isActive 
                      ? 'bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] font-medium' 
                      : 'text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {option.label}
                    {counts[option.value] !== undefined && counts[option.value]! > 0 && (
                      <span className={`text-[11px] ${isActive ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                        ({counts[option.value]})
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-between w-44 px-3 py-2.5 rounded-sq-sm bg-white border border-slate-200 hover:border-[#e2e8f0] hover:shadow-sm transition-all duration-150 text-sm font-medium text-[#1e293b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e2e8f0]"
            >
              <span className="truncate">{currentSortLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b] flex-shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px] bg-white border-[#e2e8f0] shadow-lg z-50">
            {availableSortOptions.map((option) => {
              const isActive = activeSort === option.value;
              // When Played/Unplayed: only rating_high is enabled
              const isDisabled = isPlayedOrUnplayed && option.value !== 'rating_high';
              
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    if (!isDisabled) {
                      onSortChange(option.value);
                    }
                  }}
                  className={`transition-colors duration-100 ${
                    isDisabled
                      ? 'text-[#94a3b8] cursor-not-allowed'
                      : isActive 
                        ? 'bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] font-medium cursor-pointer' 
                        : 'text-[#64748b] hover:bg-[#f8fafc] cursor-pointer'
                  }`}
                  disabled={isDisabled}
                >
                  {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

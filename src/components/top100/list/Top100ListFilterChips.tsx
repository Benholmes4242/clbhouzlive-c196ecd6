import React from 'react';
import { ChevronDown } from 'lucide-react';
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
  { value: 'rating_high', label: 'Rating: High to Low' },
  { value: 'rating_low', label: 'Rating: Low to High' },
  { value: 'most_rated', label: 'Most Rated', requiresReviewData: true },
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
];

/**
 * Two inline Explore-style dropdowns for filter (Show) and sort (Sort).
 * Active option uses slate highlight background (no checkmarks).
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
  const currentSortLabel = SORT_OPTIONS.find(s => s.value === activeSort)?.label || 'Rating: High to Low';

  // When Played/Unplayed is active, only rating_high is enabled
  const isPlayedOrUnplayed = activeFilter === 'played' || activeFilter === 'unplayed';

  // Filter sort options based on available data
  const availableSortOptions = SORT_OPTIONS.filter(
    opt => !opt.requiresReviewData || hasReviewData
  );

  return (
    <div 
      className={`px-4 py-3 transition-all ${
        isSticky 
          ? 'bg-slate-50/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm' 
          : 'bg-slate-50 border-b border-slate-200/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Show dropdown (Filter) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors text-sm font-medium text-slate-700"
            >
              <span>{currentFilterLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px] bg-white">
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.value;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`cursor-pointer ${
                    isActive 
                      ? 'bg-[var(--surface-slate)] text-white font-medium' 
                      : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {option.label}
                    {counts[option.value] !== undefined && counts[option.value]! > 0 && (
                      <span className={isActive ? 'text-white/70' : 'text-slate-400'}> ({counts[option.value]})</span>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors text-sm font-medium text-slate-700"
            >
              <span>{currentSortLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px] bg-white">
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
                  className={`${
                    isDisabled
                      ? 'text-slate-400 opacity-50 cursor-not-allowed'
                      : isActive 
                        ? 'bg-[var(--surface-slate)] text-white font-medium cursor-pointer' 
                        : 'text-slate-700 cursor-pointer'
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
    </div>
  );
};

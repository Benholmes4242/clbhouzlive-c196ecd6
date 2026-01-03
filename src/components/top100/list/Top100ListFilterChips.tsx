import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Top100FilterChip = 'official' | 'community' | 'played' | 'unplayed';
export type Top100SortMode = 'rank' | 'az' | 'za' | 'most_reviewed' | 'highest_rated';

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
  { value: 'official', label: 'Official' },
  { value: 'community', label: 'Community' },
  { value: 'played', label: 'Played' },
  { value: 'unplayed', label: 'Unplayed' },
];

const SORT_OPTIONS: { value: Top100SortMode; label: string; requiresReviewData?: boolean }[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
  { value: 'most_reviewed', label: 'Most reviewed', requiresReviewData: true },
  { value: 'highest_rated', label: 'Highest rated', requiresReviewData: true },
];

/**
 * Two inline slate dropdowns for filter (Show) and sort (Sort by).
 * Replaces the previous bottom sheet approach.
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
  const currentFilterLabel = FILTER_OPTIONS.find(f => f.value === activeFilter)?.label || 'Official';
  const currentSortLabel = SORT_OPTIONS.find(s => s.value === activeSort)?.label || 'Rank';

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
              <span className="text-slate-500 text-xs">Show:</span>
              <span>{currentFilterLabel}</span>
              {counts[activeFilter] !== undefined && counts[activeFilter]! > 0 && (
                <span className="text-slate-400 text-xs">({counts[activeFilter]})</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px] bg-white">
            {FILTER_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {option.label}
                  {counts[option.value] !== undefined && counts[option.value]! > 0 && (
                    <span className="text-slate-400 text-xs">({counts[option.value]})</span>
                  )}
                </span>
                {activeFilter === option.value && (
                  <Check className="w-4 h-4 text-slate-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort by dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors text-sm font-medium text-slate-700"
            >
              <span className="text-slate-500 text-xs">Sort:</span>
              <span>{currentSortLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px] bg-white">
            {availableSortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{option.label}</span>
                {activeSort === option.value && (
                  <Check className="w-4 h-4 text-slate-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Top100FilterSheet } from './Top100FilterSheet';
import { motion } from 'framer-motion';

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

const FILTER_LABELS: Record<Top100FilterChip, string> = {
  official: 'Official',
  community: 'Community',
  played: 'Played',
  unplayed: 'Unplayed',
};

const SORT_LABELS: Record<Top100SortMode, string> = {
  rank: 'Rank',
  az: 'A–Z',
  za: 'Z–A',
  most_reviewed: 'Most reviewed',
  highest_rated: 'Highest rated',
};

/**
 * Premium frosted glass filter control with inner chip display.
 * Opens a bottom sheet selector on tap.
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const currentFilterLabel = FILTER_LABELS[activeFilter];
  const currentSortLabel = SORT_LABELS[activeSort];
  const count = counts[activeFilter];

  return (
    <>
      <div 
        className={`px-4 py-3 transition-all ${
          isSticky 
            ? 'bg-slate-50/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm' 
            : 'bg-slate-50 border-b border-slate-200/60'
        }`}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSheetOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
          style={{
            background: isSheetOpen 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: isSheetOpen 
              ? '1px solid rgba(15, 23, 42, 0.15)' 
              : '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: isSheetOpen 
              ? '0 0 8px 1px hsl(var(--primary) / 0.1), 0 2px 8px rgba(0,0,0,0.06)'
              : '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          {/* Filter icon */}
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          
          {/* Label */}
          <span className="text-sm font-semibold text-slate-700">
            Filter
          </span>
          
          {/* Active filter chip */}
          <span 
            className="text-[12px] font-medium px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(15, 23, 42, 0.06)',
              color: 'rgb(51, 65, 85)',
            }}
          >
            {currentFilterLabel}
            {count !== undefined && count > 0 && (
              <span className="text-slate-400 ml-1">({count})</span>
            )}
          </span>

          {/* Active sort chip */}
          <span 
            className="text-[12px] font-medium px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(15, 23, 42, 0.06)',
              color: 'rgb(51, 65, 85)',
            }}
          >
            Sort: {currentSortLabel}
          </span>
          
          {/* Chevron */}
          <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
        </motion.button>
      </div>

      <Top100FilterSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        activeSort={activeSort}
        onSortChange={onSortChange}
        counts={counts}
        hasReviewData={hasReviewData}
      />
    </>
  );
};

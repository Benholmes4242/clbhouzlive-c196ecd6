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

  const isPlayedOrUnplayed = activeFilter === 'played' || activeFilter === 'unplayed';

  const availableSortOptions = SORT_OPTIONS.filter(
    opt => !opt.requiresReviewData || hasReviewData
  );

  return (
    <motion.div 
      className={`px-4 py-3 transition-all duration-200 ${
        isSticky 
          ? 'backdrop-blur-md shadow-sm' 
          : ''
      }`}
      style={{
        background: isSticky ? 'rgba(248,250,252,0.97)' : 'rgba(15,23,42,0.03)',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
      }}
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
              className="flex items-center justify-between w-44 px-3 py-2.5 rounded-sq-sm transition-all duration-150 text-sm font-medium focus:outline-none active:scale-[0.98]"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
            >
              <span className="truncate">{currentFilterLabel}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px] shadow-lg z-50" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.value;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`cursor-pointer transition-colors duration-100 ${
                    isActive 
                      ? 'text-foreground font-medium' 
                      : 'text-muted-foreground'
                  }`}
                  style={isActive ? { background: 'rgba(15,23,42,0.04)', fontWeight: 600 } : undefined}
                >
                  <span className="flex items-center gap-2">
                    {option.label}
                    {counts[option.value] !== undefined && counts[option.value]! > 0 && (
                      <span className={`text-[11px] ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
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
              className="flex items-center justify-between w-44 px-3 py-2.5 rounded-sq-sm transition-all duration-150 text-sm font-medium focus:outline-none active:scale-[0.98]"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
            >
              <span className="truncate">{currentSortLabel}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px] shadow-lg z-50" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
            {availableSortOptions.map((option) => {
              const isActive = activeSort === option.value;
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
                      ? 'text-muted-foreground/60 cursor-not-allowed'
                      : isActive 
                        ? 'text-foreground font-medium cursor-pointer' 
                        : 'text-muted-foreground cursor-pointer'
                  }`}
                  style={isActive && !isDisabled ? { background: 'rgba(15,23,42,0.04)', fontWeight: 600 } : undefined}
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
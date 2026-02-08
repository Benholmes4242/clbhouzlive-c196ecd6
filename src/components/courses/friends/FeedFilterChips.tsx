import React from 'react';
import { cn } from '@/lib/utils';

export type FeedFilter = 'all' | 'trending' | 'new_for_you' | 'rounds';

interface FeedFilterChipsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'trending', label: 'Trending' },
  { key: 'new_for_you', label: 'New for you' },
  { key: 'rounds', label: 'Rounds' },
];

/**
 * FeedFilterChips - Tab-style filters matching the main Courses page tabs exactly
 * Uses orange underline indicator (same as Explore/Top 100/Friends tabs)
 */
const FeedFilterChips: React.FC<FeedFilterChipsProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div 
      role="tablist" 
      aria-label="Filter activity feed"
      className="flex items-center justify-center border-b border-transparent"
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <button
            key={filter.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`feed-panel-${filter.key}`}
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              'relative px-3 py-2.5 text-sm font-medium bg-transparent border-0 shadow-none rounded-none transition-all duration-200 ease-out active:scale-[0.97]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-border/60 focus-visible:ring-offset-1',
              // Text color
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              // Orange underline indicator
              'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2.5px] after:rounded-full after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out',
              isActive 
                ? 'after:w-full after:opacity-[0.85]' 
                : 'after:w-0 after:opacity-0'
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default FeedFilterChips;

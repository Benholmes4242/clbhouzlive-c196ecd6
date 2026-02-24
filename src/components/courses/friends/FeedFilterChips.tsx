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

const FeedFilterChips: React.FC<FeedFilterChipsProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div
      role="tablist"
      aria-label="Filter activity feed"
      className="flex items-center rounded-[14px] p-[3px]"
      style={{ background: 'rgba(0,0,0,0.03)' }}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <button
            key={filter.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]',
              isActive
                ? 'bg-white font-semibold text-foreground'
                : 'text-muted-foreground'
            )}
            style={isActive ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' } : undefined}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default FeedFilterChips;

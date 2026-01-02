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
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
            'border focus:outline-none focus:ring-1 focus:ring-slate-200/60',
            activeFilter === filter.key
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FeedFilterChips;

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
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            'border focus:outline-none',
            activeFilter === filter.key
              ? 'bg-slate-900/5 text-slate-900 border-slate-300'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FeedFilterChips;

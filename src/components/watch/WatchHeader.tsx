import React from 'react';
import { Search } from 'lucide-react';
import type { WatchFilter } from './types';

const FILTERS: { key: WatchFilter; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Latest' },
  { key: 'top', label: 'Top Rated' },
  { key: 'near', label: 'Near Me' },
];

interface WatchHeaderProps {
  activeFilter: WatchFilter;
  onFilterChange: (f: WatchFilter) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

const WatchHeader: React.FC<WatchHeaderProps> = ({ activeFilter, onFilterChange, onOpenSearch, embedded = false }) => {
  return (
    <div
      className="sticky top-[55px] z-30 bg-background/95 backdrop-blur-xl border-b border-border/50"
      style={{
        paddingTop: embedded ? '24px' : 'max(env(safe-area-inset-top, 0px), 47px)',
      }}
    >
      <div className="px-4 pb-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>Search shorts...</span>
        </button>
      </div>

      <div
        className="flex gap-2 overflow-x-auto justify-center px-4 pb-3 scrollbar-hide"
      >
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className="shrink-0 min-h-[36px] px-4 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? 'hsl(var(--tab-sub-active))' : 'hsl(var(--muted))',
                color: isActive ? 'hsl(var(--tab-sub-active-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WatchHeader;

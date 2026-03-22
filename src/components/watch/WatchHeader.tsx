import React from 'react';
import { Search, MapPin } from 'lucide-react';
import type { WatchFilter } from './types';

const FILTERS: { key: WatchFilter; label: string; icon?: React.ReactNode }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Latest' },
  { key: 'top', label: 'Top Rated' },
  { key: 'near', label: 'Near Me', icon: <MapPin className="w-3 h-3" /> },
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
      className="sticky z-30 bg-background pb-0 pt-2 px-0"
      style={{ top: embedded ? '47px' : '0px', borderBottom: '1px solid hsl(var(--border) / 0.12)' }}
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
        role="tablist"
        aria-label="Watch filters"
        className="flex justify-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide"
      >
        {FILTERS.map(({ key, label, icon }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => onFilterChange(key)}
              className="shrink-0 min-h-[36px] px-4 text-sm font-semibold transition-colors flex items-center gap-1.5"
              style={{
                borderRadius: 8,
                background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WatchHeader;

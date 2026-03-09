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
    <div className="bg-background">
      <div
        className="px-4"
        style={{
          marginTop: embedded ? '24px' : 'calc(max(env(safe-area-inset-top, 0px), 47px) + 16px)',
        }}
      >
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 rounded-xl border border-border bg-background shadow-sm"
          style={{ height: '40px', padding: '0 12px' }}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Search shorts...</span>
        </button>
      </div>

      <div
        className="flex gap-2 overflow-x-auto justify-center"
        style={{
          padding: '12px 16px 8px',
          scrollbarWidth: 'none',
        }}
      >
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className="shrink-0 rounded-full active:scale-[0.96]"
              style={{
                minHeight: '36px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: isActive ? 'hsl(var(--tab-sub-active))' : 'hsl(var(--muted))',
                color: isActive ? '#ffffff' : 'hsl(var(--muted-foreground))',
                border: 'none',
                transition: 'background 200ms ease, color 200ms ease',
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
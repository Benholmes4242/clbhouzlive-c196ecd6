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
}

const WatchHeader: React.FC<WatchHeaderProps> = ({ activeFilter, onFilterChange, onOpenSearch }) => {
  return (
    <div className="bg-[var(--bg-page)]">
      {/* Title */}
      <h1
        className="text-center font-bold text-foreground"
        style={{
          fontSize: '20px',
          marginTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
        }}
      >
        Watch
      </h1>

      {/* Search bar (button) */}
      <div className="px-4 mt-3">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 rounded-xl border border-border bg-background shadow-sm"
          style={{ height: '40px', padding: '0 12px' }}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Search shorts...</span>
        </button>
      </div>

      {/* Filter chips */}
      <div
        className="flex gap-2 overflow-x-auto"
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
                height: '32px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                background: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--background))',
                color: isActive ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                border: isActive ? 'none' : '1px solid hsl(var(--border))',
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

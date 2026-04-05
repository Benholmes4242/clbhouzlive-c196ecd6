import React from 'react';
import { MapPin } from 'lucide-react';
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

const WatchHeader: React.FC<WatchHeaderProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div
      className="sticky z-[28] bg-background pb-0 pt-0 px-0"
      style={{ top: '58px', borderBottom: '1px solid hsl(var(--border) / 0.12)' }}
    >
      <div
        role="tablist"
        aria-label="Watch filters"
        className="flex justify-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
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

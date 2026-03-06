import React from 'react';
import { Search } from 'lucide-react';
import type { VideosFilter } from './hooks/useVideosFeed';

const FILTERS: { key: VideosFilter; label: string }[] = [
  { key: 'latest', label: 'Latest' },
  { key: 'popular', label: 'Popular' },
  { key: 'following', label: 'Following' },
];

interface VideosHeaderProps {
  activeFilter: VideosFilter;
  onFilterChange: (f: VideosFilter) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

const VideosHeader: React.FC<VideosHeaderProps> = ({
  activeFilter,
  onFilterChange,
  onOpenSearch,
  embedded = false,
}) => {
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
          <span className="text-sm text-muted-foreground">Search videos...</span>
        </button>
      </div>

      <div
        className="flex gap-2 overflow-x-auto justify-center"
        style={{ padding: '12px 16px 8px', scrollbarWidth: 'none' }}
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

export default VideosHeader;

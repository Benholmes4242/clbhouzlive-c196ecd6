import { Search } from 'lucide-react';
import type { VideosFilter } from './hooks/useVideosFeed';

interface VideosHeaderProps {
  activeFilter: VideosFilter;
  onFilterChange: (filter: VideosFilter) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

const FILTERS: { id: VideosFilter; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' },
];

export function VideosHeader({
  activeFilter,
  onFilterChange,
  onOpenSearch,
}: VideosHeaderProps) {
  return (
    <div
      className="sticky z-30 bg-background pb-0 pt-0 px-0"
      style={{ top: '0px', borderBottom: '1px solid hsl(var(--border) / 0.12)' }}
    >
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 w-full h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
          aria-label="Search videos"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search videos…</span>
        </button>
      </div>

      <div role="tablist" aria-label="Video filters" className="flex justify-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map(({ id, label }) => {
          const isActive = activeFilter === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(id)}
              className="shrink-0 min-h-[36px] px-4 text-sm font-semibold transition-colors"
              style={{
                borderRadius: 8,
                background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

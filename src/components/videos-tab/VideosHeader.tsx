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
  embedded = false,
}: VideosHeaderProps) {
  const topStyle = embedded
    ? { marginTop: 24 }
    : { marginTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 24px)' };

  return (
    <div className="px-4 pb-3" style={topStyle}>
      {/* Search bar */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 w-full h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
        aria-label="Search videos"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Search videos…</span>
      </button>

      {/* Filter chips */}
      <div className="flex items-center justify-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map(({ id, label }) => {
          const isActive = activeFilter === id;
          return (
            <button
              key={id}
              onClick={() => onFilterChange(id)}
              className={`min-h-[36px] px-4 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

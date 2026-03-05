import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WatchFilter } from './hooks/useWatchShorts';

interface WatchHeaderProps {
  activeFilter: WatchFilter;
  onFilterChange: (filter: WatchFilter) => void;
  onSearchTap: () => void;
}

const FILTERS: { id: WatchFilter; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'latest', label: 'Latest' },
  { id: 'top', label: 'Top Rated' },
  { id: 'near', label: 'Near Me' },
];

export function WatchHeader({ activeFilter, onFilterChange, onSearchTap }: WatchHeaderProps) {
  return (
    <div
      className="sticky top-0 z-20 pb-3"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: '#0A0A0A',
      }}
    >
      {/* Title */}
      <h1 className="text-center text-white text-xl font-bold mt-2 mb-3">Watch</h1>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <button
          onClick={onSearchTap}
          className="w-full h-10 rounded-xl flex items-center gap-2.5 px-3.5 text-left"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <span className="text-sm text-white/30">Search shorts...</span>
        </button>
      </div>

      {/* Filter chips */}
      <div
        className="flex gap-2 px-4 overflow-x-auto no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={cn(
                "h-8 rounded-2xl px-3.5 text-[13px] font-medium whitespace-nowrap shrink-0",
                "active:scale-[0.96]",
              )}
              style={{
                background: isActive ? 'white' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#0A0A0A' : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? 600 : 500,
                transition: 'background 200ms ease, color 200ms ease',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Top100LeaderboardFilters {
  listSlug: 'all' | 'global' | 'gb-i' | 'usa' | 'europe';
  locationScope: 'worldwide' | 'my-country' | 'gb-i' | 'usa' | 'europe';
  timeRange: 'all_time' | 'year' | 'month' | 'week';
  sortBy?: 'official_rank' | 'member_rating' | 'most_played' | 'recently_popular';
}

interface Top100LeaderboardFilterBarProps {
  mode: 'players' | 'courses';
  value: Top100LeaderboardFilters;
  onChange: (next: Top100LeaderboardFilters) => void;
}

const TIME_RANGE_OPTIONS = [
  { value: 'all_time', label: 'All time' },
  { value: 'year', label: 'This year' },
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
] as const;

const LIST_OPTIONS = [
  { value: 'all', label: 'All lists' },
  { value: 'global', label: 'Global Top 100' },
  { value: 'gb-i', label: 'GB&I Top 100' },
  { value: 'usa', label: 'USA Top 100' },
  { value: 'europe', label: 'Europe Top 100' },
] as const;

const LOCATION_OPTIONS = [
  { value: 'worldwide', label: 'Worldwide' },
  { value: 'my-country', label: 'My country' },
  { value: 'gb-i', label: 'GB&I only' },
  { value: 'usa', label: 'USA only' },
  { value: 'europe', label: 'Europe only' },
] as const;

const SORT_OPTIONS = [
  { value: 'official_rank', label: 'Official ranking' },
  { value: 'member_rating', label: 'Member rating' },
  { value: 'most_played', label: 'Most played' },
  { value: 'recently_popular', label: 'Recently popular' },
] as const;

export function Top100LeaderboardFilterBar({
  mode,
  value,
  onChange,
}: Top100LeaderboardFilterBarProps) {
  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card/80 px-4 py-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      {/* Left block: list + region */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        {/* List selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Top 100 list
          </span>
          <select
            className="h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={value.listSlug}
            onChange={(e) =>
              onChange({ ...value, listSlug: e.target.value as Top100LeaderboardFilters['listSlug'] })
            }
          >
            {LIST_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Golfer/Course region selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {mode === 'courses' ? 'Showing course ratings from golfers in' : 'Showing golfers from'}
          </span>
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 h-9">
            <Globe2 className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-transparent text-sm focus:outline-none flex-1"
              value={value.locationScope}
              onChange={(e) =>
                onChange({
                  ...value,
                  locationScope: e.target.value as Top100LeaderboardFilters['locationScope'],
                })
              }
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort (courses mode only) */}
        {mode === 'courses' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Sort courses by
            </span>
            <select
              className="h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={value.sortBy ?? 'official_rank'}
              onChange={(e) =>
                onChange({
                  ...value,
                  sortBy: e.target.value as Top100LeaderboardFilters['sortBy'],
                })
              }
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right block: time range segmented control - centered */}
      <div className="inline-flex items-center justify-center rounded-full bg-muted/60 p-0.5">
        {TIME_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...value, timeRange: opt.value })}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs transition-colors',
              value.timeRange === opt.value
                ? 'bg-background shadow-sm font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

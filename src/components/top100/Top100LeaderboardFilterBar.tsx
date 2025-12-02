import React from 'react';
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
    <div className="w-full rounded-2xl border border-border/70 bg-card/80 px-3 py-3 md:px-4 md:py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left block: list + location */}
      <div className="flex flex-wrap items-center gap-2">
        {/* List selector */}
        <select
          className="text-xs rounded-lg border border-border/60 bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {/* Location selector */}
        <select
          className="text-xs rounded-lg border border-border/60 bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {/* Sort (courses mode only) */}
        {mode === 'courses' && (
          <select
            className="text-xs rounded-lg border border-border/60 bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        )}
      </div>

      {/* Right block: time range segmented control */}
      <div className="inline-flex rounded-full bg-muted/60 p-0.5">
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

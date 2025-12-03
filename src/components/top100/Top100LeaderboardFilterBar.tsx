import React from 'react';
import { Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSelect, AppSelectOption } from '@/components/ui/AppSelect';

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

const LIST_OPTIONS: AppSelectOption<Top100LeaderboardFilters['listSlug']>[] = [
  { value: 'all', label: 'All lists' },
  { value: 'global', label: 'Global Top 100' },
  { value: 'gb-i', label: 'GB&I Top 100' },
  { value: 'usa', label: 'USA Top 100' },
  { value: 'europe', label: 'Europe Top 100' },
];

const LOCATION_OPTIONS: AppSelectOption<Top100LeaderboardFilters['locationScope']>[] = [
  { value: 'worldwide', label: 'All regions (worldwide)' },
  { value: 'my-country', label: 'Players in my country' },
  { value: 'gb-i', label: 'GB&I players only' },
  { value: 'usa', label: 'USA players only' },
  { value: 'europe', label: 'Europe players only' },
];

const SORT_OPTIONS: AppSelectOption<NonNullable<Top100LeaderboardFilters['sortBy']>>[] = [
  { value: 'official_rank', label: 'Official ranking' },
  { value: 'member_rating', label: 'Community rating' },
  { value: 'most_played', label: 'Most played' },
  { value: 'recently_popular', label: 'Recently popular' },
];

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
          <AppSelect
            value={value.listSlug}
            onChange={(v) => onChange({ ...value, listSlug: v })}
            options={LIST_OPTIONS}
            ariaLabel="Filter by Top 100 list"
          />
        </div>

        {/* Golfer/Course region selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {mode === 'courses' ? 'Showing course ratings from golfers in' : 'Showing golfers from'}
          </span>
          <AppSelect
            value={value.locationScope}
            onChange={(v) => onChange({ ...value, locationScope: v })}
            options={LOCATION_OPTIONS}
            ariaLabel="Show golfers from"
            icon={<Globe2 className="w-4 h-4" />}
          />
        </div>

        {/* Sort (courses mode only) */}
        {mode === 'courses' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Sort courses by
            </span>
            <AppSelect
              value={value.sortBy ?? 'official_rank'}
              onChange={(v) => onChange({ ...value, sortBy: v })}
              options={SORT_OPTIONS}
              ariaLabel="Sort courses by"
            />
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

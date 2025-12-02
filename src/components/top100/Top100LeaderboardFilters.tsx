import React from 'react';
import { LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';

interface Top100LeaderboardFiltersProps {
  mode: 'players' | 'courses';
  scope: LeaderboardScope;
  timeRange: LeaderboardTimeRange;
  countryCode?: string | null;
  onChange: (updates: {
    scope?: LeaderboardScope;
    timeRange?: LeaderboardTimeRange;
    countryCode?: string | null;
  }) => void;
}

export function Top100LeaderboardFilters(props: Top100LeaderboardFiltersProps) {
  const { mode, scope, timeRange, countryCode, onChange } = props;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Region/List selector */}
      <select
        className="text-xs rounded-lg border border-border/60 bg-card px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={scope}
        onChange={(e) => onChange({ scope: e.target.value as LeaderboardScope })}
      >
        <option value="worldwide">All lists</option>
        <option value="global-top-100">Global Top 100</option>
        <option value="gb-i-top-100">GB&I Top 100</option>
        <option value="usa-top-100">USA Top 100</option>
        <option value="europe-top-100">Europe Top 100</option>
      </select>

      {/* Country filter - players mode only */}
      {mode === 'players' && (
        <select
          className="text-xs rounded-lg border border-border/60 bg-card px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={countryCode ?? 'all'}
          onChange={(e) =>
            onChange({ countryCode: e.target.value === 'all' ? null : e.target.value })
          }
        >
          <option value="all">All countries</option>
          <option value="GB">United Kingdom</option>
          <option value="US">United States</option>
          <option value="IE">Ireland</option>
          <option value="FR">France</option>
          <option value="ES">Spain</option>
          <option value="AU">Australia</option>
          <option value="CA">Canada</option>
        </select>
      )}

      {/* Timeframe selector */}
      <select
        className="text-xs rounded-lg border border-border/60 bg-card px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={timeRange}
        onChange={(e) => onChange({ timeRange: e.target.value as LeaderboardTimeRange })}
      >
        <option value="all_time">All time</option>
        <option value="this_year">This year</option>
        <option value="this_month">This month</option>
      </select>
    </div>
  );
}

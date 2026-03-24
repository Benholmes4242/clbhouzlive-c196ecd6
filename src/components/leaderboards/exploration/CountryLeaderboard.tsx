import { useMemo, useState } from 'react';
import CountryFlag from '@/components/ui/country-flag';
import type { ExplorationLeaderboardEntry } from '@/types/leaderboards';

type CountrySortMode = 'players' | 'courses';

interface CountryLeaderboardProps {
  entries: ExplorationLeaderboardEntry[];
  seasonColor?: string;
}

export function CountryLeaderboard({ entries }: CountryLeaderboardProps) {
  const [sortMode, setSortMode] = useState<CountrySortMode>('players');

  const countryStats = useMemo(() => {
    const map = new Map<string, { players: number; courses: number; topPlayer: string }>();

    entries.forEach(entry => {
      (entry.country_list ?? []).forEach(country => {
        const existing = map.get(country) ?? { players: 0, courses: 0, topPlayer: '' };
        map.set(country, {
          players: existing.players + 1,
          courses: existing.courses + (entry.courses_count ?? 0),
          topPlayer: existing.players === 0
            ? (entry.display_name ?? 'Golfer')
            : existing.topPlayer,
        });
      });
    });

    return Array.from(map.entries())
      .map(([country, stats]) => ({ country, ...stats }))
      .sort((a, b) => sortMode === 'players' ? b.players - a.players : b.courses - a.courses);
  }, [entries, sortMode]);

  if (countryStats.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Not enough data yet — explore more countries!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex justify-end mb-2">
        {(['players', 'courses'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className="capitalize"
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 6,
              backgroundColor: sortMode === mode ? 'hsl(var(--accent-amber) / 0.1)' : 'transparent',
              border: sortMode === mode
                ? '1px solid hsl(var(--accent-amber) / 0.3)'
                : '1px solid transparent',
              color: sortMode === mode ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))',
              transition: 'all 0.15s ease',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Country list card */}
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
          background: 'hsl(var(--card))',
        }}
      >
        <div style={{ padding: '10px 14px 8px' }}>
          <p className="text-muted-foreground uppercase" style={{ fontSize: 11, fontWeight: 700 }}>
            Countries · Most Explored
          </p>
        </div>

        {countryStats.map((stat, index) => {
          const rank = index + 1;
          const statValue = sortMode === 'players' ? stat.players : stat.courses;
          const statLabel = sortMode === 'players' ? 'PLAYERS' : 'COURSES';

          return (
            <div
              key={stat.country}
              className="flex items-center"
              style={{
                padding: '11px 14px',
                gap: 10,
                borderBottom: index < countryStats.length - 1
                  ? '1px solid hsl(var(--border) / 0.3)'
                  : 'none',
              }}
            >
              {/* Rank */}
              <span
                style={{
                  width: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: rank === 1 ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))',
                  flexShrink: 0,
                }}
              >
                {rank}
              </span>

              {/* Country info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CountryFlag country={stat.country} size="sm" />
                  <span className="text-foreground truncate" style={{ fontSize: 14, fontWeight: 600 }}>
                    {stat.country}
                  </span>
                </div>
                <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                  Top: {stat.topPlayer}
                </p>
              </div>

              {/* Stat */}
              <div className="text-right flex-shrink-0">
                <p style={{ fontSize: 15, fontWeight: 800, color: 'hsl(var(--accent-amber))' }}>
                  {statValue}
                </p>
                <p className="text-muted-foreground uppercase" style={{ fontSize: 9, opacity: 0.6 }}>
                  {statLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center mt-3" style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--accent-amber))' }}>
        Add a course to put your country on the map →
      </p>
    </div>
  );
}

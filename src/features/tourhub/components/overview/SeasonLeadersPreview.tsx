import { Link } from 'react-router-dom';
import { ArrowRight, Award, Target, Gauge, Trophy } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useMemo } from 'react';

interface LeaderCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  getValue: (stats: any) => number | null;
  format: (value: number) => string;
  sortOrder: 'desc' | 'asc';
}

const leaderCategories: LeaderCategory[] = [
  {
    key: 'events',
    label: 'Most Events',
    icon: <Award className="w-4 h-4 text-primary" />,
    getValue: (s) => s.events_played,
    format: (v) => `${v} events`,
    sortOrder: 'desc',
  },
  {
    key: 'cuts',
    label: 'Most Cuts Made',
    icon: <Target className="w-4 h-4 text-green-500" />,
    getValue: (s) => s.cuts_made,
    format: (v) => `${v} cuts`,
    sortOrder: 'desc',
  },
  {
    key: 'scoring',
    label: 'Best Scoring Avg',
    icon: <Gauge className="w-4 h-4 text-blue-500" />,
    getValue: (s) => s.raw_data?.statistics?.scoring_avg,
    format: (v) => v.toFixed(2),
    sortOrder: 'asc',
  },
  {
    key: 'world_rank',
    label: 'World Rank Leader',
    icon: <Trophy className="w-4 h-4 text-amber-500" />,
    getValue: (s) => s.raw_data?.statistics?.world_rank,
    format: (v) => `#${v}`,
    sortOrder: 'asc',
  },
];

export function SeasonLeadersPreview() {
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);

  const leaders = useMemo(() => {
    if (!playerStats) return [];

    return leaderCategories.map(category => {
      const sorted = [...playerStats]
        .filter(s => {
          const value = category.getValue(s);
          return value !== null && value !== undefined && s.player;
        })
        .sort((a, b) => {
          const aVal = category.getValue(a) || 0;
          const bVal = category.getValue(b) || 0;
          return category.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });

      const leader = sorted[0];
      if (!leader) return null;

      return {
        category,
        player: leader.player,
        playerId: leader.player_id,
        value: category.getValue(leader),
      };
    }).filter(Boolean);
  }, [playerStats]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-40 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!leaders.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Season Leaders</h3>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          All leaders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Leaders Grid */}
      <div className="grid grid-cols-2 gap-3">
        {leaders.map((item) => {
          if (!item) return null;
          const { category, player, playerId, value } = item;
          
          return (
            <Link
              key={category.key}
              to={`/tourhub/player/${playerId}`}
              className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                {category.icon}
                <span className="text-xs text-muted-foreground">{category.label}</span>
              </div>
              <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                {player?.full_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {value !== null && category.format(value)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, Gauge, Award, TrendingUp, Users, ArrowUpDown } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { cn } from '@/lib/utils';

interface LeaderCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  getValue: (stats: any) => number | null;
  format: (value: number) => string;
  sortOrder: 'desc' | 'asc';
}

const leaderCategories: LeaderCategory[] = [
  {
    key: 'events_played',
    label: 'Most Events Played',
    description: 'Players who have competed in the most tournaments',
    icon: <Award className="w-5 h-5 text-primary" />,
    getValue: (s) => s.events_played,
    format: (v) => `${v} events`,
    sortOrder: 'desc',
  },
  {
    key: 'cuts_made',
    label: 'Most Cuts Made',
    description: 'Players with the most weekends made',
    icon: <Target className="w-5 h-5 text-green-500" />,
    getValue: (s) => s.cuts_made,
    format: (v) => `${v} cuts`,
    sortOrder: 'desc',
  },
  {
    key: 'world_rank',
    label: 'World Ranking Leaders',
    description: 'Top players by official world golf ranking',
    icon: <Trophy className="w-5 h-5 text-amber-500" />,
    getValue: (s) => s.raw_data?.statistics?.world_rank,
    format: (v) => `#${v}`,
    sortOrder: 'asc',
  },
  {
    key: 'scoring_avg',
    label: 'Best Scoring Average',
    description: 'Lowest average strokes per round',
    icon: <Gauge className="w-5 h-5 text-blue-500" />,
    getValue: (s) => s.raw_data?.statistics?.scoring_avg,
    format: (v) => v.toFixed(3),
    sortOrder: 'asc',
  },
  {
    key: 'top_10',
    label: 'Most Top 10 Finishes',
    description: 'Players with the most top 10 finishes',
    icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
    getValue: (s) => s.raw_data?.statistics?.top_10,
    format: (v) => `${v} top 10s`,
    sortOrder: 'desc',
  },
  {
    key: 'earnings',
    label: 'Season Earnings',
    description: 'Total prize money earned',
    icon: <Award className="w-5 h-5 text-emerald-500" />,
    getValue: (s) => s.raw_data?.statistics?.earnings,
    format: (v) => `$${(v / 1_000_000).toFixed(2)}M`,
    sortOrder: 'desc',
  },
];

export function LeadersTab() {
  const [selectedCategory, setSelectedCategory] = useState(leaderCategories[0]);
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);

  // Get sorted players for selected category
  const rankedPlayers = useMemo(() => {
    if (!playerStats) return [];

    return [...playerStats]
      .filter(s => {
        const value = selectedCategory.getValue(s);
        return value !== null && value !== undefined && s.player;
      })
      .sort((a, b) => {
        const aVal = selectedCategory.getValue(a) || 0;
        const bVal = selectedCategory.getValue(b) || 0;
        return selectedCategory.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, 25);
  }, [playerStats, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-lg w-32 shrink-0" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>Season Leaders by Category</span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {leaderCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory.key === cat.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              )}
            >
              {cat.icon}
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">{cat.label.split(' ').slice(-1)[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Description */}
      <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
        {selectedCategory.icon}
        <div>
          <h3 className="font-medium text-foreground">{selectedCategory.label}</h3>
          <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
        </div>
      </div>

      {/* Leaderboard */}
      {rankedPlayers.length > 0 ? (
        <div className="space-y-2">
          {rankedPlayers.map((stat, index) => {
            const value = selectedCategory.getValue(stat);
            const isTopThree = index < 3;
            
            return (
              <Link
                key={stat.id}
                to={`/tourhub/player/${stat.player_id}`}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-all group",
                  isTopThree
                    ? 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 hover:border-primary/40'
                    : 'bg-card border border-border hover:border-primary/30 hover:bg-muted/30'
                )}
              >
                {/* Rank */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  index === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                  index === 1 ? 'bg-gray-400/20 text-gray-600 dark:text-gray-400' :
                  index === 2 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-600' :
                  'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {stat.player?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{stat.player?.country}</p>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground text-lg">
                    {value !== null ? selectedCategory.format(value) : '—'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <p className="text-muted-foreground">No data available for this category yet.</p>
        </div>
      )}

      {/* Info Note */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Season leaders are computed from available tournament data</p>
        <p className="mt-1">Official FedEx Cup standings will be available with live feeds</p>
      </div>
    </div>
  );
}

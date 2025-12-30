import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, User } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

type SortKey = 'fedex_rank' | 'events_played' | 'wins' | 'top_10s' | 'scoring_average' | 'driving_distance' | 'greens_in_reg' | 'putting_average';

const columns: { key: SortKey; label: string; format?: (v: number | null) => string }[] = [
  { key: 'fedex_rank', label: 'FedEx Rank' },
  { key: 'events_played', label: 'Events' },
  { key: 'wins', label: 'Wins' },
  { key: 'top_10s', label: 'Top 10s' },
  { key: 'scoring_average', label: 'Scoring Avg', format: (v) => v ? v.toFixed(2) : '-' },
  { key: 'driving_distance', label: 'Driving Dist', format: (v) => v ? `${v.toFixed(1)} yds` : '-' },
  { key: 'greens_in_reg', label: 'GIR %', format: (v) => v ? `${v.toFixed(1)}%` : '-' },
  { key: 'putting_average', label: 'Putting Avg', format: (v) => v ? v.toFixed(3) : '-' },
];

export function PlayerStatsTab() {
  const [sortKey, setSortKey] = useState<SortKey>('events_played');
  const [sortAsc, setSortAsc] = useState(false);
  
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);
  
  const sortedStats = useMemo(() => {
    if (!playerStats) return [];
    
    return [...playerStats].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      // Handle nulls - put them last
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      // For scoring/putting average, lower is better so reverse default
      const isLowerBetter = sortKey === 'scoring_average' || sortKey === 'putting_average';
      const direction = sortAsc ? 1 : -1;
      const compareDirection = isLowerBetter ? -direction : direction;
      
      return (aVal - bVal) * compareDirection;
    });
  }, [playerStats, sortKey, sortAsc]);
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-muted rounded-lg mb-2" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-lg mb-1" />
        ))}
      </div>
    );
  }
  
  if (!playerStats || playerStats.length === 0) {
    return <TourHubEmptyState variant="players" />;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground sticky left-0 bg-background z-10">
              Player
            </th>
            {columns.map((col) => (
              <th 
                key={col.key}
                className="text-right py-3 px-3 text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center justify-end gap-1">
                  {col.label}
                  <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === col.key ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedStats.slice(0, 100).map((stat, index) => (
            <tr 
              key={stat.id}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-4 sticky left-0 bg-background z-10">
                <Link 
                  to={`/tourhub/player/${stat.player_id}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <span className="w-6 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {stat.player?.photo_url ? (
                      <img 
                        src={stat.player.photo_url} 
                        alt={stat.player.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{stat.player?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{stat.player?.country}</p>
                  </div>
                </Link>
              </td>
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-3 text-right text-sm">
                  <span className={stat[col.key] ? 'text-foreground' : 'text-muted-foreground'}>
                    {col.format ? col.format(stat[col.key]) : (stat[col.key] ?? '-')}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedStats.length > 100 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Showing top 100 of {sortedStats.length} players.
        </p>
      )}
    </div>
  );
}

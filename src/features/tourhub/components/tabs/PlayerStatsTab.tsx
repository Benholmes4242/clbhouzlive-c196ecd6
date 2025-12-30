import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, User } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { cn } from '@/lib/utils';

type SortKey = 'fedex_rank' | 'events_played' | 'wins' | 'top_10s' | 'scoring_average' | 'driving_distance' | 'greens_in_reg' | 'putting_average';

const columns: { key: SortKey; label: string; shortLabel?: string; format?: (v: number | null) => string }[] = [
  { key: 'fedex_rank', label: 'FedEx Rank', shortLabel: 'Rank' },
  { key: 'events_played', label: 'Events', shortLabel: 'Events' },
  { key: 'wins', label: 'Wins', shortLabel: 'Wins' },
  { key: 'top_10s', label: 'Top 10s', shortLabel: 'T10' },
  { key: 'scoring_average', label: 'Scoring Avg', shortLabel: 'Avg', format: (v) => v ? v.toFixed(2) : '—' },
  { key: 'driving_distance', label: 'Driving Dist', shortLabel: 'Drive', format: (v) => v ? `${v.toFixed(1)}` : '—' },
  { key: 'greens_in_reg', label: 'GIR %', shortLabel: 'GIR', format: (v) => v ? `${v.toFixed(1)}%` : '—' },
  { key: 'putting_average', label: 'Putting Avg', shortLabel: 'Putt', format: (v) => v ? v.toFixed(3) : '—' },
];

export function PlayerStatsTab() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('events_played');
  const [sortAsc, setSortAsc] = useState(false);
  
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);
  
  const sortedStats = useMemo(() => {
    if (!playerStats) return [];
    
    return [...playerStats].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
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
  
  // Define which columns to hide on mobile
  const hiddenOnMobile = ['top_10s', 'scoring_average', 'driving_distance', 'greens_in_reg', 'putting_average'];
  
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[360px] sm:min-w-[520px] md:min-w-0">
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/80 backdrop-blur-sm">
            <th className="text-left py-3 px-3 text-sm font-semibold text-foreground rounded-l-lg">
              Player
            </th>
            {columns.map((col, i) => (
              <th 
                key={col.key}
                className={cn(
                  "text-right py-3 px-2 md:px-3 text-sm font-semibold cursor-pointer transition-colors hover:bg-muted",
                  i === columns.length - 1 && "rounded-r-lg",
                  hiddenOnMobile.includes(col.key) && "hidden md:table-cell"
                )}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="hidden lg:inline text-foreground">{col.label}</span>
                  <span className="lg:hidden text-foreground">{col.shortLabel || col.label}</span>
                  {sortKey === col.key && (
                    sortAsc 
                      ? <ChevronUp className="w-4 h-4 text-primary" />
                      : <ChevronDown className="w-4 h-4 text-primary" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedStats.slice(0, 100).map((stat, index) => (
            <tr 
              key={stat.id}
              className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/tourhub/player/${stat.player_id}`)}
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-medium text-muted-foreground shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {stat.player?.photo_url ? (
                      <img 
                        src={stat.player.photo_url} 
                        alt={stat.player.full_name}
                        className="w-8 h-8 object-cover"
                      />
                    ) : (
                      <User className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">{stat.player?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">{stat.player?.country}</p>
                  </div>
                </div>
              </td>
              {columns.map((col) => (
                <td 
                  key={col.key} 
                  className={cn(
                    "py-3 px-2 md:px-3 text-right text-sm",
                    hiddenOnMobile.includes(col.key) && "hidden md:table-cell"
                  )}
                >
                  <span className={stat[col.key] !== null && stat[col.key] !== undefined ? 'text-foreground' : 'text-muted-foreground'}>
                    {col.format ? col.format(stat[col.key]) : (stat[col.key] ?? '—')}
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

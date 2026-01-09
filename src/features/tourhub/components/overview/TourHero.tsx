import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { useMemo } from 'react';
import { Trophy, Zap } from 'lucide-react';

type SeasonStatus = 'live' | 'active' | 'upcoming' | 'completed';

export function TourHero() {
  const { data: season, isLoading: seasonLoading } = useTourSeason();
  const { data: tournaments } = useTourTournaments(season?.id);

  const seasonStatus = useMemo((): SeasonStatus => {
    if (!tournaments || tournaments.length === 0) return 'upcoming';
    
    const hasLive = tournaments.some(t => t.status === 'inprogress');
    if (hasLive) return 'live';
    
    const allClosed = tournaments.every(t => t.status === 'closed');
    if (allClosed) return 'completed';
    
    const hasCompleted = tournaments.some(t => t.status === 'closed');
    if (hasCompleted) return 'active';
    
    return 'upcoming';
  }, [tournaments]);

  if (seasonLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-28 bg-muted rounded-xl" />
      </div>
    );
  }

  const statusConfig: Record<SeasonStatus, { label: string; bg: string; text: string; icon?: React.ReactNode }> = {
    live: { 
      label: 'Live', 
      bg: 'bg-green-500/15', 
      text: 'text-green-600 dark:text-green-400',
      icon: <Zap className="w-3 h-3" />
    },
    active: { 
      label: 'In Season', 
      bg: 'bg-primary/10', 
      text: 'text-primary' 
    },
    upcoming: { 
      label: 'Upcoming', 
      bg: 'bg-amber-500/15', 
      text: 'text-amber-600 dark:text-amber-400' 
    },
    completed: { 
      label: 'Completed', 
      bg: 'bg-muted', 
      text: 'text-muted-foreground' 
    },
  };

  const config = statusConfig[seasonStatus];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {season?.tour_name || 'PGA Tour'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {season?.year || new Date().getFullYear()} Season
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.icon}
            {config.label}
          </div>
        </div>
      </div>
    </div>
  );
}

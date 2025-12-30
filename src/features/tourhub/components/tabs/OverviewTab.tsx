import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter, isBefore } from 'date-fns';
import { Calendar, Trophy, Users, TrendingUp, ArrowRight, MapPin } from 'lucide-react';
import { useTourSeason, useTourTournaments, useTourPlayerStatistics } from '../../hooks/useTourHubData';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    inprogress: 'bg-green-500/10 text-green-600 dark:text-green-400',
    created: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    closed: 'bg-muted text-muted-foreground',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[status] || colors.created}`}>
      {status === 'inprogress' ? 'In Progress' : status}
    </span>
  );
}

export function OverviewTab() {
  const { data: season, isLoading: seasonLoading } = useTourSeason();
  const { data: tournaments, isLoading: tournamentsLoading } = useTourTournaments(season?.id);
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  
  const isLoading = seasonLoading || tournamentsLoading || statsLoading;
  
  // Derive season status and key tournaments
  const { seasonStatus, nextTournament, recentTournament, upcomingCount, completedCount } = useMemo(() => {
    if (!tournaments || tournaments.length === 0) {
      return { seasonStatus: 'upcoming', nextTournament: null, recentTournament: null, upcomingCount: 0, completedCount: 0 };
    }
    
    const now = new Date();
    const upcoming = tournaments.filter(t => isAfter(new Date(t.start_date), now) || t.status === 'scheduled' || t.status === 'created');
    const completed = tournaments.filter(t => t.status === 'closed');
    const inProgress = tournaments.find(t => t.status === 'inprogress');
    
    // Next tournament is either in progress or first upcoming
    const nextTournament = inProgress || upcoming[0];
    const recentTournament = completed[completed.length - 1];
    
    let seasonStatus = 'upcoming';
    if (inProgress) {
      seasonStatus = 'in progress';
    } else if (completed.length > 0 && upcoming.length > 0) {
      seasonStatus = 'active';
    } else if (completed.length > 0 && upcoming.length === 0) {
      seasonStatus = 'completed';
    }
    
    return {
      seasonStatus,
      nextTournament,
      recentTournament,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
    };
  }, [tournaments]);
  
  // Top 5 players by events played (since FedEx data may be null)
  const topPlayers = useMemo(() => {
    if (!playerStats) return [];
    return playerStats
      .filter(s => s.player)
      .slice(0, 5);
  }, [playerStats]);
  
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Season Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{season?.tour_name || 'PGA Tour'}</h2>
            <p className="text-muted-foreground">{season?.name || `${new Date().getFullYear()} Season`}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
            {seasonStatus}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{tournaments?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{upcomingCount}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{playerStats?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Players</div>
          </div>
        </div>
      </div>
      
      {/* Next / Recent Tournament */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nextTournament && (
          <Link 
            to={`/tourhub/tournament/${nextTournament.id}`}
            className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {nextTournament.status === 'inprogress' ? 'Currently Playing' : 'Next Event'}
              </span>
              <StatusBadge status={nextTournament.status} />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
              {nextTournament.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-2">
              {format(new Date(nextTournament.start_date), 'MMM d')} – {format(new Date(nextTournament.end_date), 'd, yyyy')}
            </p>
            
            {(nextTournament.venue_name || nextTournament.venue_city) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {[nextTournament.venue_name, nextTournament.venue_city, nextTournament.venue_country].filter(Boolean).join(' • ')}
              </div>
            )}
            
            {nextTournament.purse && (
              <p className="mt-2 text-sm font-medium text-foreground">
                ${(nextTournament.purse / 1_000_000).toFixed(1)}M Purse
              </p>
            )}
          </Link>
        )}
        
        {recentTournament && (
          <Link 
            to={`/tourhub/tournament/${recentTournament.id}`}
            className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Most Recent</span>
              <StatusBadge status={recentTournament.status} />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
              {recentTournament.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-2">
              {format(new Date(recentTournament.start_date), 'MMM d')} – {format(new Date(recentTournament.end_date), 'd, yyyy')}
            </p>
            
            {recentTournament.defending_champion && (
              <p className="text-sm text-muted-foreground">
                Champion: <span className="text-foreground font-medium">{recentTournament.defending_champion}</span>
              </p>
            )}
          </Link>
        )}
      </div>
      
      {/* Top Players */}
      {topPlayers.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Top Players</h3>
            </div>
            <Link 
              to="/tourhub?tab=player-stats"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {topPlayers.map((stat, index) => (
              <Link
                key={stat.id}
                to={`/tourhub/player/${stat.player_id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{stat.player?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{stat.player?.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{stat.events_played || 0} events</p>
                  {stat.fedex_rank && (
                    <p className="text-xs text-muted-foreground">Rank #{stat.fedex_rank}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

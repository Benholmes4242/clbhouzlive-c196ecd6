import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { Calendar, Trophy, TrendingUp, ArrowRight, MapPin, Users } from 'lucide-react';
import { useTourSeason, useTourTournaments, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { TournamentCard } from '../TournamentCard';

function SeasonStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    'in progress': { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400' },
    'active': { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
    'upcoming': { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
    'completed': { bg: 'bg-muted', text: 'text-muted-foreground' },
  };
  
  const c = config[status] || config.active;
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${c.bg} ${c.text}`}>
      {status}
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
  
  // Top 5 players
  const topPlayers = useMemo(() => {
    if (!playerStats) return [];
    return playerStats.filter(s => s.player).slice(0, 5);
  }, [playerStats]);
  
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-muted rounded-xl" />
          <div className="h-44 bg-muted rounded-xl" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Season Summary Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{season?.tour_name || 'PGA Tour'}</h2>
            <p className="text-muted-foreground">{season?.name || `${new Date().getFullYear()} Season`}</p>
          </div>
          <SeasonStatusBadge status={seasonStatus} />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/40">
            <div className="text-2xl font-bold text-foreground">{tournaments?.length || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Events</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/40">
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Completed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/40">
            <div className="text-2xl font-bold text-foreground">{upcomingCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Remaining</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/40">
            <div className="text-2xl font-bold text-foreground">{playerStats?.length || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Players</div>
          </div>
        </div>
      </div>
      
      {/* Next + Most Recent Tournament */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nextTournament && (
          <Link 
            to={`/tourhub/tournament/${nextTournament.id}`}
            className="bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/40 hover:shadow-md group"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {nextTournament.status === 'inprogress' ? 'Currently Playing' : 'Next Event'}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
              {nextTournament.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-2">
              {format(new Date(nextTournament.start_date), 'MMM d')} – {format(new Date(nextTournament.end_date), 'd, yyyy')}
            </p>
            
            {(nextTournament.venue_name || nextTournament.venue_city) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {[nextTournament.venue_name, nextTournament.venue_city, nextTournament.venue_country].filter(Boolean).join(' • ')}
              </div>
            )}
            
            {nextTournament.purse && (
              <p className="mt-3 text-sm font-medium text-foreground">
                ${(nextTournament.purse / 1_000_000).toFixed(1)}M Purse
              </p>
            )}
          </Link>
        )}
        
        {recentTournament && (
          <Link 
            to={`/tourhub/tournament/${recentTournament.id}`}
            className="bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/40 hover:shadow-md group"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">Most Recent</span>
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
      
      {/* Top Players Snapshot */}
      {topPlayers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Top Players</h3>
            </div>
            <Link 
              to="/tourhub?tab=player-stats"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="space-y-2">
            {topPlayers.map((stat, index) => (
              <Link
                key={stat.id}
                to={`/tourhub/player/${stat.player_id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
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
      
      {topPlayers.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Top Players</h3>
          </div>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No player stats synced yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}

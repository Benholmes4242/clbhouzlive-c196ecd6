import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Trophy, Zap, Calendar } from 'lucide-react';
import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { useMemo } from 'react';
import type { TourTournament } from '../../hooks/useTourHubData';

export function RightNowCard() {
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

  const { featured, isLive } = useMemo(() => {
    if (!tournaments || tournaments.length === 0) {
      return { featured: null, isLive: false };
    }

    // Priority 1: Live tournament
    const live = tournaments.find(t => t.status === 'inprogress');
    if (live) {
      return { featured: live, isLive: true };
    }

    // Priority 2: Most recent completed tournament
    const completed = tournaments
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
    
    if (completed.length > 0) {
      return { featured: completed[0], isLive: false };
    }

    // Priority 3: Next upcoming
    const upcoming = tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    
    return { featured: upcoming[0] || null, isLive: false };
  }, [tournaments]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!featured) {
    return null;
  }

  const isUpcoming = featured.status === 'scheduled' || featured.status === 'created';
  const isCompleted = featured.status === 'closed';

  return (
    <Link
      to={`/tourhub/tournament/${featured.id}`}
      className="group block relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-muted/30 transition-all hover:border-primary/40 hover:shadow-lg"
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold animate-pulse">
            <Zap className="w-3 h-3" />
            LIVE
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          {isLive ? (
            <Zap className="w-4 h-4 text-green-500" />
          ) : isCompleted ? (
            <Trophy className="w-4 h-4 text-amber-500" />
          ) : (
            <Calendar className="w-4 h-4 text-primary" />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {isLive ? 'Right Now' : isCompleted ? 'Most Recent' : 'Coming Up'}
          </span>
        </div>

        {/* Tournament Name */}
        <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-2">
          {featured.name}
        </h2>

        {/* Dates */}
        <p className="text-sm text-muted-foreground mb-3">
          {format(new Date(featured.start_date), 'MMM d')} – {format(new Date(featured.end_date), 'd, yyyy')}
        </p>

        {/* Venue */}
        {(featured.venue_name || featured.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[featured.venue_name, featured.venue_city, featured.venue_country].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          {featured.purse && (
            <div>
              <span className="font-semibold text-foreground">
                ${(featured.purse / 1_000_000).toFixed(1)}M
              </span>
              <span className="text-muted-foreground ml-1">purse</span>
            </div>
          )}
          {featured.venue_par && (
            <div>
              <span className="font-semibold text-foreground">Par {featured.venue_par}</span>
            </div>
          )}
          {featured.venue_yardage && (
            <div>
              <span className="font-semibold text-foreground">{featured.venue_yardage.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">yds</span>
            </div>
          )}
        </div>

        {/* Defending Champion */}
        {featured.defending_champion && isCompleted && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm">
                <span className="text-muted-foreground">Champion: </span>
                <span className="font-medium text-foreground">{featured.defending_champion}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

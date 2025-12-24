import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Radio, Clock } from 'lucide-react';
import {
  TourHubShell,
  MiniLeaderboard,
  StatusChip,
  LastUpdatedPill,
  PremiumEmptyState,
  ErrorState,
  HeroSkeleton,
  EventCardSkeleton,
} from '../components';
import { useLiveEvents, useUpcomingEvents, useLeaderboard } from '../hooks';

function LiveEventBlock({ event }: { event: any }) {
  const { data: leaderboard } = useLeaderboard(event.tour, event.espn_event_id);
  
  const tourLabel = event.tour === 'pga' ? 'PGA Tour' : 
                    event.tour === 'lpga' ? 'LPGA Tour' :
                    event.tour === 'eur' ? 'DP World Tour' : 'Champions Tour';
  
  return (
    <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-meta text-text-tertiary uppercase tracking-wide font-medium">
              {tourLabel}
            </span>
            <StatusChip status="live" />
          </div>
          <Link 
            to={`/tourhub/event/${event.tour}/${event.espn_event_id}`}
            className="text-heading-md font-bold text-text-primary hover:text-primary-accent transition-colors"
          >
            {event.name}
          </Link>
          <p className="text-body-sm text-text-secondary mt-1">
            {format(new Date(event.start_date), 'MMM d')} – {format(new Date(event.end_date), 'd, yyyy')}
          </p>
        </div>
        {leaderboard?.fetched_at && (
          <LastUpdatedPill timestamp={leaderboard.fetched_at} />
        )}
      </div>
      
      <MiniLeaderboard 
        leaders={leaderboard?.leaders || []} 
        limit={10}
      />
      
      <Link
        to={`/tourhub/event/${event.tour}/${event.espn_event_id}`}
        className="mt-4 block w-full text-center py-2.5 rounded-sq-sm bg-surface-alt border border-border-subtle text-body-sm font-medium text-text-primary hover:bg-surface-input-hover transition-colors"
      >
        View Event
      </Link>
    </div>
  );
}

export function TourHubLivePage() {
  const { data: liveEvents, isLoading: liveLoading, error: liveError, refetch: refetchLive } = useLiveEvents();
  const { data: upcomingEvents, isLoading: upcomingLoading } = useUpcomingEvents(3);
  
  const hasLive = liveEvents && liveEvents.length > 0;
  
  if (liveError) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <ErrorState onRetry={() => refetchLive()} />
        </div>
      </TourHubShell>
    );
  }
  
  return (
    <TourHubShell>
      {/* Header */}
      <header className="pt-6 pb-6">
        <h1 className="text-display-lg font-bold text-text-primary flex items-center gap-3">
          <Radio className="w-8 h-8 text-primary-accent" />
          Live Now
        </h1>
        <p className="text-body-md text-text-secondary mt-1">
          Every tour. One live view.
        </p>
      </header>
      
      {/* Live Events */}
      {liveLoading ? (
        <div className="space-y-6">
          <HeroSkeleton />
          <HeroSkeleton />
        </div>
      ) : hasLive ? (
        <div className="space-y-6">
          {liveEvents.map(event => (
            <LiveEventBlock key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <PremiumEmptyState
            icon={Radio}
            title="No live events right now"
            description="Next tee times are already queued. Check back during tournament hours."
          />
          
          {/* Next Up */}
          {!upcomingLoading && upcomingEvents && upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-text-tertiary" />
                Next Up
              </h2>
              
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const tourLabel = event.tour === 'pga' ? 'PGA Tour' : 
                                    event.tour === 'lpga' ? 'LPGA Tour' :
                                    event.tour === 'eur' ? 'DP World Tour' : 'Champions Tour';
                  
                  return (
                    <Link
                      key={event.id}
                      to={`/tourhub/event/${event.tour}/${event.espn_event_id}`}
                      className="flex items-center justify-between p-4 bg-surface-card border border-border-subtle rounded-sq-md hover:bg-surface-alt transition-colors"
                    >
                      <div>
                        <span className="text-meta text-text-tertiary uppercase tracking-wide">
                          {tourLabel}
                        </span>
                        <h3 className="text-body-lg font-semibold text-text-primary">
                          {event.name}
                        </h3>
                        <p className="text-body-sm text-text-secondary">
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <StatusChip status="upcoming" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </TourHubShell>
  );
}

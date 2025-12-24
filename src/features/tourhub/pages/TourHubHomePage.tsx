import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Radio, Calendar, Trophy, ArrowRight } from 'lucide-react';
import {
  TourHubShell,
  TourSwitcherPills,
  EventCard,
  MiniLeaderboard,
  StatusChip,
  LastUpdatedPill,
  PremiumEmptyState,
  ErrorState,
  HeroSkeleton,
  EventCardSkeleton,
} from '../components';
import { useTourEvents, useLiveEvents, useLeaderboard, useUpcomingEvents } from '../hooks';
import { useTourSelection } from '../hooks/useTourSelection';

export function TourHubHomePage() {
  const { selectedTour, setSelectedTour } = useTourSelection();
  const { data: tourEvents, isLoading, error, refetch } = useTourEvents(selectedTour);
  const { data: liveEvents } = useLiveEvents();
  const { data: nextEvents } = useUpcomingEvents(5); // Fallback: next 5 events across all tours
  
  // Get hero event - live first, then next upcoming
  const heroEvent = useMemo(() => {
    if (liveEvents && liveEvents.length > 0) {
      // Prefer live event from selected tour
      const tourLive = liveEvents.find(e => e.tour === selectedTour);
      return tourLive || liveEvents[0];
    }
    // Otherwise first upcoming for selected tour
    return tourEvents?.find(e => e.status === 'upcoming') || tourEvents?.[0];
  }, [liveEvents, tourEvents, selectedTour]);
  
  // Leaderboard for hero event
  const { data: heroLeaderboard } = useLeaderboard(
    heroEvent?.tour || selectedTour,
    heroEvent?.espn_event_id || ''
  );
  
  // Filter events by status - "This Week" = events starting within 7 days
  const { thisWeek, completed, showNextEvents, nextEventsToShow } = useMemo(() => {
    if (!tourEvents) return { thisWeek: [], completed: [], showNextEvents: false, nextEventsToShow: [] };
    
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // This Week: events starting within 7 days
    const thisWeek = tourEvents.filter(e => 
      (e.status === 'upcoming' || e.status === 'live') &&
      new Date(e.start_date) <= oneWeekLater
    ).slice(0, 6);
    
    const completed = tourEvents
      .filter(e => e.status === 'complete')
      .slice(-6)
      .reverse();
    
    // If no events this week, show "Next Events" fallback
    const showNextEvents = thisWeek.length === 0;
    const nextEventsToShow = showNextEvents && nextEvents ? nextEvents.slice(0, 5) : [];
    
    return { thisWeek, completed, showNextEvents, nextEventsToShow };
  }, [tourEvents, nextEvents]);
  
  if (error) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <ErrorState onRetry={() => refetch()} />
        </div>
      </TourHubShell>
    );
  }
  
  return (
    <TourHubShell>
      {/* Header */}
      <header className="pt-6 pb-4">
        <h1 className="text-display-lg font-bold text-text-primary">Tour Hub</h1>
        <p className="text-body-md text-text-secondary mt-1">
          Leaderboards, schedules and rankings — built for golfers.
        </p>
      </header>
      
      {/* Tour Switcher */}
      <div className="mb-6">
        <TourSwitcherPills selectedTour={selectedTour} onSelect={setSelectedTour} />
      </div>
      
      {/* Hero Section */}
      <section className="mb-8">
        {isLoading ? (
          <HeroSkeleton />
        ) : heroEvent ? (
          <Link 
            to={`/tourhub/event/${heroEvent.tour}/${heroEvent.espn_event_id}`}
            className="block bg-surface-card border border-border-subtle rounded-sq-lg p-6 hover:bg-surface-alt/50 transition-colors group"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-meta text-text-tertiary uppercase tracking-wide font-medium">
                    {heroEvent.tour === 'pga' ? 'PGA Tour' : 
                     heroEvent.tour === 'lpga' ? 'LPGA Tour' :
                     heroEvent.tour === 'eur' ? 'DP World Tour' : 'Champions Tour'}
                  </span>
                  <StatusChip status={heroEvent.status as any} />
                </div>
                
                <h2 className="text-heading-lg font-bold text-text-primary mb-2 group-hover:text-primary-accent transition-colors">
                  {heroEvent.name}
                </h2>
                
                <p className="text-body-md text-text-secondary mb-1">
                  {format(new Date(heroEvent.start_date), 'MMM d')} – {format(new Date(heroEvent.end_date), 'd, yyyy')}
                </p>
                
                {(heroEvent.course_name || heroEvent.location) && (
                  <p className="text-body-sm text-text-tertiary">
                    {[heroEvent.course_name, heroEvent.location].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
              
              {/* Right: Mini Leaderboard */}
              <div className="w-full lg:w-80 relative">
                <MiniLeaderboard 
                  leaders={heroLeaderboard?.leaders || []} 
                  limit={5}
                  emptyMessage={heroLeaderboard?.message}
                />
                {heroLeaderboard?.fetched_at && (
                  <LastUpdatedPill 
                    timestamp={heroLeaderboard.fetched_at} 
                    className="absolute -top-2 -right-2"
                  />
                )}
              </div>
            </div>
          </Link>
        ) : (
          <PremiumEmptyState
            icon={Radio}
            title="No events scheduled"
            description="Check back soon for upcoming tournaments."
          />
        )}
      </section>
      
      {/* This Week / Next Events */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-text-tertiary" />
            {showNextEvents ? 'Next Events' : 'This Week'}
          </h2>
          <Link 
            to={`/tourhub/tour/${selectedTour}`}
            className="text-body-sm text-primary-accent hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : showNextEvents && nextEventsToShow.length > 0 ? (
          // Fallback: Next Events across all tours
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nextEventsToShow.map(event => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                tour={event.tour}
                status={event.status as any}
                startDate={event.start_date}
                endDate={event.end_date}
                courseName={event.course_name}
                location={event.location}
                espnEventId={event.espn_event_id}
              />
            ))}
          </div>
        ) : thisWeek.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {thisWeek.map(event => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                tour={event.tour}
                status={event.status as any}
                startDate={event.start_date}
                endDate={event.end_date}
                courseName={event.course_name}
                location={event.location}
                espnEventId={event.espn_event_id}
              />
            ))}
          </div>
        ) : (
          <PremiumEmptyState
            title="No upcoming events"
            description="New tournaments will appear here when scheduled."
          />
        )}
      </section>
      
      {/* Recently Completed */}
      <section className="mb-8">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-text-tertiary" />
          Recently Completed
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : completed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map(event => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                tour={event.tour}
                status={event.status as any}
                startDate={event.start_date}
                endDate={event.end_date}
                courseName={event.course_name}
                location={event.location}
                espnEventId={event.espn_event_id}
              />
            ))}
          </div>
        ) : (
          <PremiumEmptyState
            title="No completed events yet"
            description="Results will appear here after tournaments finish."
          />
        )}
      </section>
    </TourHubShell>
  );
}

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Radio, Calendar, Trophy } from 'lucide-react';
import {
  TourHubShell,
  EventCard,
  PremiumEmptyState,
  ErrorState,
  EventCardSkeleton,
} from '../components';
import { useTourEvents } from '../hooks';
import type { TourKey } from '../components/TourSwitcherPills';

const TOUR_INFO: Record<string, { name: string; fullName: string }> = {
  'pga': { name: 'PGA', fullName: 'PGA Tour' },
  'lpga': { name: 'LPGA', fullName: 'LPGA Tour' },
  'eur': { name: 'DP World', fullName: 'DP World Tour' },
  'champions-tour': { name: 'Champions', fullName: 'Champions Tour' },
};

export function TourHubTourPage() {
  const { tour } = useParams<{ tour: string }>();
  const tourKey = (tour || 'pga') as TourKey;
  const tourInfo = TOUR_INFO[tourKey] || TOUR_INFO.pga;
  
  const { data: events, isLoading, error, refetch } = useTourEvents(tourKey);
  
  const { live, upcoming, completed } = useMemo(() => {
    if (!events) return { live: [], upcoming: [], completed: [] };
    
    return {
      live: events.filter(e => e.status === 'live'),
      upcoming: events.filter(e => e.status === 'upcoming'),
      completed: events.filter(e => e.status === 'complete').reverse(),
    };
  }, [events]);
  
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
      {/* Back Link */}
      <div className="pt-4">
        <Link 
          to="/tourhub" 
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tour Hub
        </Link>
      </div>
      
      {/* Tour Header */}
      <header className="py-6">
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6">
          <h1 className="text-display-lg font-bold text-text-primary">
            {tourInfo.fullName}
          </h1>
          <p className="text-body-md text-text-secondary mt-1">
            Schedule • Live • Results
          </p>
        </div>
      </header>
      
      {/* Live Section */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-primary-accent" />
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map(event => (
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
        </section>
      )}
      
      {/* Upcoming Section */}
      <section className="mb-8">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-text-tertiary" />
          Upcoming
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(event => (
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
      
      {/* Completed Section */}
      <section className="mb-8">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-text-tertiary" />
          Completed
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : completed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

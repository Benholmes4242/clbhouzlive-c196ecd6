import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import {
  TourHubShell,
  EventCard,
  PremiumEmptyState,
  ErrorState,
  EventCardSkeleton,
} from '../components';
import { useTourEvents } from '../hooks';
import type { TourKey } from '../components/TourSwitcherPills';
import SearchOverlay from '@/components/shared/SearchOverlay';
import { useRecentSearches } from '@/hooks/useRecentSearches';

const TOUR_INFO: Record<string, { name: string; fullName: string }> = {
  'pga': { name: 'PGA', fullName: 'PGA Tour' },
  'lpga': { name: 'LPGA', fullName: 'LPGA Tour' },
  'eur': { name: 'DP World', fullName: 'DP World Tour' },
  'champions-tour': { name: 'Champions', fullName: 'Champions Tour' },
};

const STATUS_PILLS = ['All', 'Live', 'Upcoming', 'Completed'] as const;
type StatusFilter = typeof STATUS_PILLS[number];

const TRENDING = [
  'PGA Tour', 'DP World Tour', 'LIV Golf',
  'The Masters', 'US Open', 'The Open Championship',
  'Ryder Cup', 'PGA Championship',
];

export function TourHubTourPage() {
  const { tour } = useParams<{ tour: string }>();
  const tourKey = (tour || 'pga') as TourKey;
  const tourInfo = TOUR_INFO[tourKey] || TOUR_INFO.pga;
  
  const { data: events, isLoading, error, refetch } = useTourEvents(tourKey);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches('tour-events-recent-searches');
  
  const { live, upcoming, completed } = useMemo(() => {
    if (!events) return { live: [], upcoming: [], completed: [] };
    return {
      live: events.filter(e => e.status === 'live'),
      upcoming: events.filter(e => e.status === 'upcoming'),
      completed: events.filter(e => e.status === 'complete').reverse(),
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const byStatus = statusFilter === 'All'
      ? [...live, ...upcoming, ...completed]
      : statusFilter === 'Live' ? live
      : statusFilter === 'Upcoming' ? upcoming
      : completed;
    if (!searchQuery) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.course_name?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  }, [statusFilter, searchQuery, live, upcoming, completed]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.trim()) addSearch(q.trim());
  }, [addSearch]);
  
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

      {/* Sticky search + filter header */}
      <div
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 -mx-5 px-5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
      >
        <div className="pb-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Search tournaments...</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
          {STATUS_PILLS.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="shrink-0 min-h-[36px] px-4 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: statusFilter === status
                  ? 'hsl(var(--tab-sub-active))'
                  : 'hsl(var(--muted))',
                color: statusFilter === status
                  ? 'hsl(var(--tab-sub-active-foreground))'
                  : 'hsl(var(--muted-foreground))',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered events list */}
      <div className="py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map(event => (
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
            title={`No ${statusFilter === 'All' ? '' : statusFilter.toLowerCase() + ' '}events found`}
            description={searchQuery ? 'Try different search terms.' : 'Check back later for updates.'}
          />
        )}
      </div>

      {/* Search overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => { setIsSearchOpen(false); setSearchQuery(''); }}
        placeholder="Search tournaments..."
        onSearch={handleSearch}
        recentSearches={recentSearches}
        onClearRecent={clearAll}
        onRemoveRecent={removeSearch}
        trendingItems={TRENDING}
      >
        <div className="px-4 py-2">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-3xl">🔍</span>
              <p className="text-foreground text-sm font-medium">No tournaments found</p>
              <p className="text-muted-foreground text-xs">Try a different search term</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredEvents.map(event => (
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
          )}
        </div>
      </SearchOverlay>
    </TourHubShell>
  );
}

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, Calendar as CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import {
  TourHubShell,
  MiniLeaderboard,
  StatusChip,
  LastUpdatedPill,
  PremiumEmptyState,
  ErrorState,
  LeaderboardSkeleton,
} from '../components';
import { useLeaderboard, useTourEvents } from '../hooks';
import { cn } from '@/lib/utils';

type TabKey = 'leaderboard' | 'field' | 'info';

const TOUR_LABELS: Record<string, string> = {
  'pga': 'PGA Tour',
  'lpga': 'LPGA Tour',
  'eur': 'DP World Tour',
  'champions-tour': 'Champions Tour',
};

export function TourHubEventPage() {
  const { tour, eventId } = useParams<{ tour: string; eventId: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  const { data: events } = useTourEvents((tour || 'pga') as any);
  
  const hasValidParams = Boolean(tour) && Boolean(eventId) && eventId.length > 0;
  const { data: leaderboard, isLoading, error: leaderboardError, refetch } = useLeaderboard(
    hasValidParams ? tour : undefined,
    hasValidParams ? eventId : undefined
  );
  
  const event = useMemo(() => {
    return events?.find(e => e.espn_event_id === eventId);
  }, [events, eventId]);
  
  const tourLabel = TOUR_LABELS[tour || 'pga'] || tour;
  
  const displayLeaders = useMemo(() => {
    if (!leaderboard?.leaders) return [];
    return showFullLeaderboard ? leaderboard.leaders : leaderboard.leaders.slice(0, 10);
  }, [leaderboard, showFullLeaderboard]);
  
  if (!eventId) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <PremiumEmptyState
            title="Event not found"
            description="This event could not be loaded. Please go back and try again."
          />
        </div>
      </TourHubShell>
    );
  }
  
  return (
    <TourHubShell>
      {/* Back Link */}
      <div className="pt-4">
        <Link 
          to={`/tourhub/tour/${tour}`}
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {tourLabel}
        </Link>
      </div>
      {/* Combined Sticky Header + Tabs */}
      <div
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/50 -mx-5 px-5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
      >
        <div className="pt-2 pb-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-meta text-text-tertiary uppercase tracking-wide font-medium">
                  {tourLabel}
                </span>
                {event && <StatusChip status={event.status as any} />}
              </div>
              <h1 className="text-heading-lg font-bold text-text-primary truncate">
                {event?.name || 'Loading...'}
              </h1>
            </div>
            {leaderboard?.fetched_at && (
              <LastUpdatedPill timestamp={leaderboard.fetched_at} />
            )}
          </div>
        </div>
        <div className="flex items-stretch p-1 rounded-xl overflow-hidden bg-muted mb-3 mt-2">
          {(['leaderboard', 'field', 'info'] as TabKey[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold transition-all capitalize",
                "min-h-[44px]",
                activeTab === tab
                  ? "bg-foreground text-background shadow-sm m-1 rounded-lg border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'leaderboard' && (
        <div>
          {leaderboardError ? (
            <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6">
              <ErrorState 
                onRetry={() => refetch()} 
              />
            </div>
          ) : isLoading ? (
            <LeaderboardSkeleton rows={10} />
          ) : leaderboard?.leaders && leaderboard.leaders.length > 0 ? (
            <>
              <div className="bg-surface-alt border border-border-subtle rounded-sq-md overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_60px_50px_50px] gap-2 px-3 py-2 text-meta text-text-tertiary uppercase tracking-wide border-b border-border-subtle">
                  <span>Pos</span>
                  <span>Player</span>
                  <span className="text-right">Score</span>
                  <span className="text-right">Today</span>
                  <span className="text-right">Thru</span>
                </div>
                
                {displayLeaders.map((entry, idx) => (
                  <div
                    key={`${entry.position}-${entry.playerName}-${idx}`}
                    className={cn(
                      "grid grid-cols-[40px_1fr_60px_50px_50px] gap-2 px-3 py-2.5 text-body-sm",
                      idx % 2 === 0 ? "bg-surface-card" : "bg-surface-alt"
                    )}
                  >
                    <span className="font-semibold text-text-primary">{entry.position}</span>
                    {entry.athleteId ? (
                      <Link 
                        to={`/tourhub/player/${entry.athleteId}`}
                        className="text-text-primary hover:text-primary-accent truncate font-medium transition-colors"
                      >
                        {entry.playerName}
                      </Link>
                    ) : (
                      <span className="text-text-primary truncate">{entry.playerName}</span>
                    )}
                    <span className="text-right font-semibold text-text-primary">{entry.score}</span>
                    <span className="text-right text-text-secondary">{entry.today || '-'}</span>
                    <span className="text-right text-text-tertiary">{entry.thru || '-'}</span>
                  </div>
                ))}
              </div>
              
              {leaderboard.leaders.length > 10 && (
                <button
                  onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                  className="w-full mt-4 py-3 flex items-center justify-center gap-2 bg-surface-card border border-border-subtle rounded-sq-sm text-body-sm font-medium text-text-primary hover:bg-surface-alt transition-colors"
                >
                  {showFullLeaderboard ? (
                    <>Show Top 10 <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show Full Field ({leaderboard.leaders.length}) <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </>
          ) : (
            <PremiumEmptyState
              title="Leaderboard will appear when play begins"
              description="Check back during tournament hours for live scoring updates."
            />
          )}
        </div>
      )}
      
      {activeTab === 'field' && (
        <PremiumEmptyState
          title="Field will populate when event data becomes available"
          description="The full player field will be displayed here once the tournament details are finalized."
        />
      )}
      
      {activeTab === 'info' && event && (
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-text-tertiary mt-0.5" />
            <div>
              <p className="text-body-sm text-text-tertiary uppercase tracking-wide">Course</p>
              <p className="text-body-lg font-semibold text-text-primary">
                {event.course_name || 'TBD'}
              </p>
              {event.location && (
                <p className="text-body-sm text-text-secondary">{event.location}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-text-tertiary mt-0.5" />
            <div>
              <p className="text-body-sm text-text-tertiary uppercase tracking-wide">Dates</p>
              <p className="text-body-lg font-semibold text-text-primary">
                {format(new Date(event.start_date), 'MMMM d')} – {format(new Date(event.end_date), 'd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-text-tertiary mt-0.5" />
            <div>
              <p className="text-body-sm text-text-tertiary uppercase tracking-wide">Tour</p>
              <p className="text-body-lg font-semibold text-text-primary">
                {tourLabel}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'info' && !event && (
        <PremiumEmptyState
          title="Event information loading"
          description="Details will appear shortly."
        />
      )}
    </TourHubShell>
  );
}

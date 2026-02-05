/**
 * LiveRightNow - Multi-Tour Live Snapshot
 * Premium image-backed cards with horizontal scroll
 * Shows "No competitions live" with Up Next preview when no live tournaments
 * 
 * Polish spec: 12-point design system alignment
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { useUpcomingTournaments, TOUR_CONFIG } from '../../hooks/useOverviewData';
import { useVenueImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import '@/styles/hero-glass.css';

function getStartLabel(date: string): string {
  const startDate = new Date(date);
  if (isToday(startDate)) return 'Today';
  if (isTomorrow(startDate)) return 'Tomorrow';
  const days = differenceInDays(startDate, new Date());
  if (days <= 7) return `In ${days} day${days > 1 ? 's' : ''}`;
  return format(startDate, 'MMM d');
}

// Score color helper
function getScoreColor(scoreDisplay: string): string {
  if (scoreDisplay.startsWith('-')) return '#34C759';
  if (scoreDisplay.startsWith('+')) return '#FF3B30';
  return 'rgba(255, 255, 255, 0.7)';
}

/**
 * Individual Live Tournament Card with venue image fetching
 */
function LiveTournamentCard({ 
  tournament, 
  index 
}: { 
  tournament: LiveTournamentWithLeader; 
  index: number;
}) {
  const navigate = useNavigate();
  
  // Use the smart venue image hook for each card
  const { data: venueImage, isLoading: imageLoading } = useVenueImage(tournament.venueName, tournament.venueCity);
  
  // Use real image or fallback
  const hasRealImage = !!venueImage?.imageUrl;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="live-card-v2 text-left cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: 0.1 + (index * 0.1), 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
      }}
    >
      {/* Image Area - 140px height with protective gradient */}
      <div className="live-card-image-area">
        {imageLoading ? (
          <div className="live-card-shimmer-v2" />
        ) : hasRealImage ? (
          <img
            src={venueImage.imageUrl}
            alt={tournament.venueName || tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Styled gradient fallback - better than flat teal */
          <div 
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #1a2e1a 0%, #0d3b26 50%, #1a3a2a 100%)'
            }}
          />
        )}
        
        {/* Protective gradient overlay - always present */}
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '60%',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%)'
          }}
        />
        
        {/* Tour Badge - top left */}
        <div className="live-card-tour-badge">
          <img
            src={getTourLogo(tournament.tourSlug)}
            alt=""
            className="max-h-[14px] w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* LIVE Badge - top right, uniform treatment */}
        <div className="live-card-live-badge-v2">
          <span className="live-dot-small" />
          <span className="live-badge-text">LIVE</span>
        </div>
      </div>

      {/* Body Content - flex layout with score on right */}
      <div className="live-card-body">
        <div className="live-card-info">
          {/* Tournament name - single line truncated */}
          <h3 className="live-card-name">
            {tournament.name}
          </h3>
          
          {/* Leader name */}
          {tournament.leader ? (
            <span className="live-card-leader-name">
              {tournament.leader.name}
            </span>
          ) : (
            <span className="live-card-starting-soon">
              Starting Soon
            </span>
          )}
        </div>
        
        {/* Score - right side */}
        {tournament.leader && (
          <span 
            className="live-card-score-v2"
            style={{ color: getScoreColor(tournament.leader.scoreDisplay) }}
          >
            {tournament.leader.scoreDisplay}
          </span>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Up Next Preview Card - shown when no live tournaments
 */
function UpNextCard({ tournament }: { tournament: { id: string; name: string; startDate: string; venueCity: string | null; tourSlug: string } }) {
  const navigate = useNavigate();
  const tourConfig = TOUR_CONFIG[tournament.tourSlug as keyof typeof TOUR_CONFIG] || TOUR_CONFIG.pga;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm w-full text-left"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
    >
      {/* Tour Logo */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
        <img 
          src={getTourLogo(tournament.tourSlug as any)} 
          alt={tourConfig.name}
          className="h-6 w-auto"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Tournament Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 truncate">
          {tournament.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">
            {getStartLabel(tournament.startDate)}
            {tournament.venueCity && ` · ${tournament.venueCity}`}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </motion.button>
  );
}

/**
 * Empty State Component
 */
function NoLiveEventsState() {
  const { data: upcomingTournaments, isLoading } = useUpcomingTournaments(14);
  const nextTournament = upcomingTournaments?.[0];

  return (
    <section className="live-section-container">
      {/* Header */}
      <div className="live-section-header">
        <span className="w-2 h-2 bg-slate-300 rounded-full" />
        <h2 className="text-[13px] font-bold tracking-[1.5px] uppercase text-slate-900">
          Live Right Now
        </h2>
      </div>

      {/* Empty State Card */}
      <div className="px-4">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-sm text-slate-500 mb-3">
            No competitions live right now
          </p>
          
          {/* Up Next */}
          {isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : nextTournament ? (
            <div>
              <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">
                Up Next
              </p>
              <UpNextCard 
                tournament={{
                  id: nextTournament.id,
                  name: nextTournament.name,
                  startDate: nextTournament.startDate,
                  venueCity: nextTournament.venueCity,
                  tourSlug: nextTournament.tourSlug,
                }}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Check back soon for upcoming events
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function LiveRightNow() {
  const { data: liveTournaments, isLoading } = useLiveRightNow();

  // Show empty state with "Up Next" when no live tournaments
  if (!isLoading && (!liveTournaments || liveTournaments.length === 0)) {
    return <NoLiveEventsState />;
  }

  if (isLoading) {
    return (
      <section className="live-section-container">
        <div className="live-section-header">
          <span className="live-header-dot" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="live-scroll-container">
          {[1, 2].map(i => (
            <div key={i} className="live-card-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="live-section-container">
      {/* Header - with breathing room */}
      <div className="live-section-header">
        <span className="live-header-dot" />
        <h2 className="live-header-text">
          Live Right Now
        </h2>
      </div>

      {/* Scroll Container with fade hint */}
      <div className="live-scroll-wrapper">
        <div className="live-scroll-container">
          {liveTournaments!.map((tournament, idx) => (
            <LiveTournamentCard 
              key={tournament.id} 
              tournament={tournament} 
              index={idx} 
            />
          ))}
        </div>
        {/* Right edge fade hint */}
        <div className="live-scroll-fade" />
      </div>
    </section>
  );
}
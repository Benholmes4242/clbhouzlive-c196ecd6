/**
 * LiveRightNow - Multi-Tour Live Snapshot
 * Premium light-mode cards with horizontal scroll
 * Shows "No competitions live" with Up Next preview when no live tournaments
 * 
 * Polish spec: 12-point light-mode design system
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { useUpcomingTournaments, TOUR_CONFIG } from '../../hooks/useOverviewData';
import { useVenueImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';
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

// Score color helper - PGA Tour convention: under par = red
function getScoreColor(scoreDisplay: string): string {
  if (scoreDisplay.startsWith('-')) return '#FF3B30'; // Red = under par (PGA Tour standard)
  if (scoreDisplay.startsWith('+')) return '#111827'; // Neutral dark for over par
  return 'rgba(0, 0, 0, 0.4)';
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
      className="w-[280px] flex-shrink-0 rounded-2xl overflow-hidden text-left cursor-pointer transition-all duration-300 bg-card border border-border"
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        scrollSnapAlign: 'start',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: 0.1 + (index * 0.1), 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ 
        y: -2,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image Area - 140px height with protective gradient */}
      <div className="relative h-[140px] w-full overflow-hidden">
        {imageLoading ? (
          <div 
            className="w-full h-full animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
              backgroundSize: '200% 100%',
            }}
          />
        ) : hasRealImage ? (
          <img
            src={venueImage.imageUrl}
            alt={tournament.venueName || tournament.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          /* Styled gradient fallback */
          <div 
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #2D5A3D 0%, #1A4D2E 50%, #2D5A3D 100%)'
            }}
          />
        )}
        
        {/* Protective gradient overlay - matches hero legibility gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%), linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)'
          }}
        />
        
        {/* Tour Badge - top left (text label) */}
        <div 
          className="absolute top-2.5 left-2.5 px-[7px] py-[3px] rounded-[5px] flex items-center"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <span 
            className="uppercase font-bold"
            style={{ 
              fontSize: '9px', 
              letterSpacing: '0.6px', 
              color: 'rgba(255, 255, 255, 0.85)' 
            }}
          >
            {tournament.tourSlug === 'pga' ? 'PGA' : 
             tournament.tourSlug === 'liv' ? 'LIV' : 
             tournament.tourSlug === 'euro' ? 'DP WORLD' : 
             tournament.tourSlug === 'lpga' ? 'LPGA' : 
             tournament.tourSlug === 'champ' ? 'CHAMPIONS' : 
             'PGA DEV'}
           </span>
        </div>
        
        {/* LIVE Badge - top right, dark glass pill */}
        <div 
          className="absolute top-2.5 right-2.5 px-[10px] py-[4px] rounded-[8px] flex items-center gap-[5px]"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <span 
            className="w-[5px] h-[5px] rounded-full animate-live-pulse"
            style={{ background: '#FF3B30' }}
          />
          <span 
            className="uppercase font-bold"
            style={{ 
              fontSize: '10px',
              letterSpacing: '0.8px',
              color: '#FF3B30',
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Body Content - flex layout with score on right */}
      <div className="p-3.5 flex items-end justify-between">
        <div className="flex-1 min-w-0">
          {/* Tournament name - single line truncated */}
          <h3 
            className="text-[15px] font-bold mb-[3px] truncate text-foreground"
            style={{ letterSpacing: '-0.2px' }}
          >
            {tournament.name}
          </h3>
          
          {/* Leader name */}
          {tournament.leader ? (
            <span className="text-[12.5px] font-normal truncate block text-muted-foreground">
              {tournament.leader.name}
            </span>
          ) : (
            <span className="text-[12.5px] italic truncate block text-muted-foreground/60">
              Starting Soon
            </span>
          )}
        </div>
        
        {/* Score - right side */}
        {tournament.leader && (
          <span 
            className="flex-shrink-0 ml-3 font-mono text-2xl font-bold leading-none"
            style={{ 
              color: getScoreColor(tournament.leader.scoreDisplay),
              letterSpacing: '-1px',
            }}
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
      className="flex items-center gap-3 p-3 rounded-xl w-full text-left bg-card border border-border"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
    >
      {/* Tour Logo */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: '#F8F9FA' }}
      >
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
        <h4 className="text-sm font-semibold truncate text-foreground">
          {tournament.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground">
            {getStartLabel(tournament.startDate)}
            {tournament.venueCity && ` · ${tournament.venueCity}`}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/60" />
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
    <section className="pt-7 px-4 bg-background">
      {/* Header — FIX 2: Design system section label */}
      <div className="flex items-center gap-2 mb-4">
        <span 
          className="w-2 h-2 rounded-full"
          style={{ background: 'rgba(0, 0, 0, 0.2)' }}
        />
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Live Right Now
        </h2>
      </div>

      {/* Empty State Card */}
      <div className="rounded-2xl p-4 bg-card border border-border"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <p className="text-sm mb-3 text-muted-foreground">
          No competitions live right now
        </p>
        
        {/* Up Next */}
        {isLoading ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : nextTournament ? (
          <div>
            <p className="text-xs font-semibold uppercase mb-2 text-foreground"
              style={{ letterSpacing: '0.5px' }}
            >
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
          <p className="text-xs text-muted-foreground/60">
            Check back soon for upcoming events
          </p>
        )}
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
      <section className="pt-7 px-4 bg-background">
        <div className="flex items-center gap-2 mb-4">
          <span 
            className="w-2 h-2 rounded-full animate-live-pulse"
            style={{ 
              background: '#FF3B30',
              boxShadow: '0 0 10px rgba(255, 59, 48, 0.35)',
            }}
          />
          <Skeleton className="h-4 w-28" />
        </div>
        <div 
          className="flex gap-3 overflow-x-auto pb-2"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {[1, 2].map(i => (
            <div 
              key={i} 
              className="w-[280px] flex-shrink-0 rounded-2xl overflow-hidden bg-card border border-border"
            >
              <div 
                className="h-[140px] w-full animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
                  backgroundSize: '200% 100%',
                }}
              />
              <div className="p-3.5">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section 
      className="pt-7 bg-background"
      style={{ marginBottom: '24px' }}
    >
      {/* Header — FIX 2: Design system section label */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <span 
          className="w-2 h-2 rounded-full animate-live-pulse"
          style={{ 
            background: '#FF3B30',
            boxShadow: '0 0 10px rgba(255, 59, 48, 0.35)',
          }}
        />
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Live Right Now
        </h2>
      </div>

      {/* Scroll Container with fade hint */}
      <div className="relative">
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '16px',
            scrollPaddingRight: '16px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Left inset */}
          <div className="w-4 flex-shrink-0" aria-hidden />

          {liveTournaments!.map((tournament, idx) => (
            <LiveTournamentCard
              key={tournament.id}
              tournament={tournament}
              index={idx}
            />
          ))}

          {/* Right inset */}
          <div className="w-4 flex-shrink-0" aria-hidden />
        </div>

        {/* Right edge fade hint */}
        <div
          className="absolute top-0 right-0 bottom-0 pointer-events-none z-10"
          style={{
            width: '16px',
            background:
              'linear-gradient(to left, rgba(248, 250, 252, 0.20) 0%, transparent 100%)',
          }}
        />
      </div>
    </section>
  );
}

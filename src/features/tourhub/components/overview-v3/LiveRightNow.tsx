/**
 * LiveRightNow - Multi-Tour Live Snapshot
 * Premium light-mode cards with horizontal scroll
 * Shows "No competitions live" with Up Next preview when no live tournaments
 * 
 * Polish spec: 12-point light-mode design system
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { useVenueImage } from '../../hooks/useVenueImage';
import '@/styles/hero-glass.css';

// Score color helper - unified palette
function getScoreColor(scoreDisplay: string): string {
  if (scoreDisplay.startsWith('-')) return '#E09F3E'; // Amber/gold = under par
  if (scoreDisplay.startsWith('+')) return '#D62828'; // Red = over par
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
        
        {/* Tour badge removed from live cards */}
        
        {/* LIVE Badge - top right, dark glass pill with amber */}
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
            style={{ background: '#22C55E' }}
          />
          <span 
            className="uppercase font-bold"
            style={{ 
              fontSize: '10px',
              letterSpacing: '0.8px',
              color: '#22C55E',
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
            className="text-[17px] font-semibold mb-[3px] truncate text-foreground"
            style={{ letterSpacing: '-0.2px' }}
          >
            {tournament.name}
          </h3>
          
          {/* Leader name */}
          {tournament.leader ? (
            <span className="text-[14px] font-normal truncate block text-muted-foreground">
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


export function LiveRightNow() {
  const { data: liveTournaments, isLoading } = useLiveRightNow();

  // Hide the entire section when loading or no live tournaments
  if (isLoading || !liveTournaments || liveTournaments.length === 0) {
    return null;
  }

  return (
    <section className="bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <span 
          className="w-2 h-2 rounded-full animate-live-pulse"
          style={{ 
            background: '#22C55E',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)',
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

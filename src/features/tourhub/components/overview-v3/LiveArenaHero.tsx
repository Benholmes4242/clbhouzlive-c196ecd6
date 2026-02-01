/**
 * LiveArenaHero - Upgraded Hero with Volatility & Chase Pack
 * 
 * Features:
 * - Full-bleed background with Ken Burns animation
 * - Liquid glass card with leader + chase pack
 * - Volatility meter showing score compression
 * - Momentum tags ('Tight Race', 'Final Round', etc.)
 * - Auto-carousel for multiple live tournaments
 */

import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Activity, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveArena, type LiveArenaTournament, type LiveArenaPlayer } from '../../hooks/useLiveArena';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import '@/styles/hero-glass.css';

// TOUR_CONFIG for styling
const TOUR_CONFIG: Record<string, { name: string; color: string }> = {
  pga: { name: 'PGA Tour', color: 'text-blue-400' },
  euro: { name: 'DP World Tour', color: 'text-yellow-400' },
  liv: { name: 'LIV Golf', color: 'text-red-400' },
  lpga: { name: 'LPGA Tour', color: 'text-pink-400' },
};

/**
 * Format purse amount
 */
function formatPurse(purse: number | null): string {
  if (!purse) return '';
  if (purse >= 1000000) {
    return `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `$${(purse / 1000).toFixed(0)}K`;
}

/**
 * Get score color class
 */
function getScoreClass(score: number): string {
  if (score < 0) return 'text-green-400';
  if (score > 0) return 'text-red-400';
  return 'text-white';
}

/**
 * Volatility Meter Component
 */
const VolatilityMeter = memo(({ volatility }: { volatility: number }) => {
  // Color based on volatility level
  const getColor = () => {
    if (volatility >= 70) return 'from-red-500 to-orange-500';
    if (volatility >= 40) return 'from-amber-500 to-yellow-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="flex items-center gap-2">
      <Activity className="w-3.5 h-3.5 text-white/60" />
      <div className="w-20 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${volatility}%` }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] text-white/60 font-medium">
        {volatility >= 70 ? 'HIGH' : volatility >= 40 ? 'MED' : 'LOW'}
      </span>
    </div>
  );
});

VolatilityMeter.displayName = 'VolatilityMeter';

/**
 * Momentum Tag Component
 */
const MomentumTag = memo(({ tag }: { tag: string }) => {
  const getTagStyle = () => {
    switch (tag) {
      case 'Tight Race':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Runaway Leader':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Final Round':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Moving Day':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Playoff Potential':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-medium border",
      getTagStyle()
    )}>
      {tag}
    </span>
  );
});

MomentumTag.displayName = 'MomentumTag';

/**
 * Chase Pack Player Pill
 */
const ChasePackPlayer = memo(({ player }: { player: LiveArenaPlayer }) => {
  const photoUrl = resolvePhotoUrl(player.player.photoUrl);
  
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0">
      {/* Mini Avatar */}
      <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20">
        {photoUrl ? (
          <img 
            src={photoUrl}
            alt={player.player.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-[8px] font-medium">
            {player.player.firstName[0]}{player.player.lastName[0]}
          </div>
        )}
      </div>
      <span className="text-white text-[11px] font-medium whitespace-nowrap">
        {player.player.lastName}
      </span>
      <span className={cn("text-[11px] font-semibold", getScoreClass(player.score))}>
        {player.scoreDisplay}
      </span>
    </div>
  );
});

ChasePackPlayer.displayName = 'ChasePackPlayer';

/**
 * Live Arena Slide Component
 */
interface LiveArenaSlideProps {
  tournament: LiveArenaTournament;
  isActive: boolean;
  totalSlides: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

function LiveArenaSlide({ 
  tournament, 
  isActive, 
  totalSlides, 
  currentIndex, 
  onDotClick 
}: LiveArenaSlideProps) {
  const tourConfig = TOUR_CONFIG[tournament.tourSlug] || TOUR_CONFIG.pga;
  
  // Fetch real venue image
  const { data: venueImage } = useVenueImage(tournament.venueName || '', tournament.venueCity || '');
  
  const backgroundImage = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueImage?.imageUrl;

  // Gradient fallback colors
  const gradients = [
    'from-emerald-800 via-green-700 to-emerald-900',
    'from-amber-700 via-yellow-600 to-amber-800',
    'from-teal-800 via-emerald-700 to-cyan-900',
  ];
  const bgGradient = gradients[tournament.name.length % gradients.length];

  const leaderPhotoUrl = tournament.leader ? resolvePhotoUrl(tournament.leader.player.photoUrl) : null;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Background with Ken Burns */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1 }}
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        {hasRealImage ? (
          <img
            src={backgroundImage}
            alt={tournament.venueName || tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={cn("absolute inset-0 w-full h-full bg-gradient-to-br", bgGradient)} />
        )}
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      
      {/* Glass Card - Liquid Glass Effect */}
      <div 
        className="absolute left-4 right-4 p-5 rounded-3xl"
        style={{ 
          bottom: '38px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '0.5px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 0 0 0.5px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* Row 1: LIVE Badge + Tour Logo + Round */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300 text-xs font-semibold">LIVE</span>
            </div>
            {tournament.currentRound && (
              <span className="text-white/60 text-xs">
                Round {tournament.currentRound}
              </span>
            )}
          </div>
          <img 
            src={getTourLogo(tournament.tourSlug)} 
            alt={tourConfig.name}
            className="h-8 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>

        {/* Row 2: Tournament Name + Venue */}
        <h2 className="text-white text-lg font-semibold leading-tight mb-1">
          {tournament.name}
        </h2>
        <p className="text-white/70 text-sm mb-3">
          {tournament.venueName}
          {tournament.venueCity && ` · ${tournament.venueCity}`}
        </p>

        {/* Row 3: Leader Card */}
        {tournament.leader && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm mb-3">
            {/* Leader Photo with Gold Ring for #1 */}
            <div className="w-14 h-14 rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent overflow-hidden bg-white/20 flex-shrink-0">
              {leaderPhotoUrl ? (
                <img 
                  src={leaderPhotoUrl}
                  alt={tournament.leader.player.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-sm font-medium">
                  {tournament.leader.player.firstName[0]}{tournament.leader.player.lastName[0]}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">
                  {tournament.leader.player.fullName}
                </span>
                {tournament.leader.player.country && (
                  <span className="text-white/50 text-xs uppercase">
                    {tournament.leader.player.country.slice(0, 3)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-2xl font-bold", getScoreClass(tournament.leader.score))}>
                  {tournament.leader.scoreDisplay}
                </span>
                {tournament.leader.thru && (
                  <span className="text-white/50 text-sm">
                    thru {tournament.leader.thru}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Row 4: Chase Pack */}
        {tournament.chasePack.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3 text-white/50" />
              <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
                Chase Pack
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {tournament.chasePack.map((player) => (
                <ChasePackPlayer key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Row 5: Momentum Tags + Volatility */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tournament.momentumTags.slice(0, 2).map((tag) => (
              <MomentumTag key={tag} tag={tag} />
            ))}
          </div>
          <VolatilityMeter volatility={tournament.volatilityIndex} />
        </div>

        {/* Row 6: Meta */}
        <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mb-3">
          {[
            tournament.purse && formatPurse(tournament.purse),
            tournament.venuePar && `PAR ${tournament.venuePar}`,
            tournament.venueYardage && `${tournament.venueYardage.toLocaleString()} YDS`
          ].filter(Boolean).join(' · ')}
        </p>

        {/* Row 7: CTA */}
        <Link to={`/tourhub/tournament/${tournament.id}`} className="block">
          <button className="w-full py-3.5 rounded-2xl bg-white text-slate-900 font-semibold text-sm
                           flex items-center justify-center gap-2
                           hover:bg-white/90 active:scale-[0.98] transition-all duration-200">
            <span>View Tournament</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>

        {/* Row 8: Carousel Dots */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onDotClick(index);
                }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? "w-6 h-1.5 bg-white/80" 
                    : "w-1.5 h-1.5 bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Scroll Indicator
 */
function ScrollIndicator() {
  const handleClick = () => {
    document.getElementById('content-below-hero')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <button
      onClick={handleClick}
      className="absolute left-1/2 -translate-x-1/2 z-20"
      style={{ bottom: '10px' }}
    >
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-7 h-7 text-white/40" strokeWidth={1.5} />
      </motion.div>
    </button>
  );
}

/**
 * Main LiveArenaHero Component
 */
export function LiveArenaHero() {
  const { data: liveTournaments, isLoading, error } = useLiveArena();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (!liveTournaments || liveTournaments.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % liveTournaments.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [liveTournaments?.length, isPaused]);

  // Reset index when slides change
  useEffect(() => {
    if (liveTournaments && currentIndex >= liveTournaments.length) {
      setCurrentIndex(0);
    }
  }, [liveTournaments?.length, currentIndex]);

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-slate-900 animate-pulse">
        <div 
          className="absolute left-4 right-4 p-5 rounded-3xl"
          style={{ 
            bottom: '38px',
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="h-4 w-20 bg-white/10 rounded mb-4" />
          <div className="h-8 w-56 bg-white/10 rounded mb-2" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) {
    // Fallback to empty state or delegate to HeroCarousel
    return null;
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="sync">
        {liveTournaments.map((tournament, index) => (
          <LiveArenaSlide
            key={tournament.id}
            tournament={tournament}
            isActive={index === currentIndex}
            totalSlides={liveTournaments.length}
            currentIndex={currentIndex}
            onDotClick={setCurrentIndex}
          />
        ))}
      </AnimatePresence>

      {/* Bouncing Chevron */}
      <ScrollIndicator />
    </div>
  );
}

/**
 * HeroCarousel - Full-Screen Cinematic Experience
 * Full viewport hero with Ken Burns, tour logos, dots at top, bouncing chevron
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useLiveTournaments, 
  useUpcomingTournaments, 
  useTournamentLeader,
  TOUR_CONFIG,
  type TourTournament 
} from '../../hooks/useOverviewData';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';

interface CarouselSlide {
  tournament: TourTournament;
  type: 'live' | 'upcoming';
}

function formatPurse(purse: number | null): string {
  if (!purse) return '';
  if (purse >= 1000000) {
    return `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `$${(purse / 1000).toFixed(0)}K`;
}

function getStartLabel(date: string): string {
  const startDate = new Date(date);
  if (isToday(startDate)) return 'Today';
  if (isTomorrow(startDate)) return 'Tomorrow';
  const days = differenceInDays(startDate, new Date());
  if (days <= 7) return `In ${days} days`;
  return format(startDate, 'MMM d');
}

// Individual slide component with venue image
function HeroSlide({ slide, isActive }: { slide: CarouselSlide; isActive: boolean }) {
  const { tournament, type } = slide;
  const tourConfig = TOUR_CONFIG[tournament.tourSlug] || TOUR_CONFIG.pga;
  
  // Fetch real venue image
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  
  // Fetch leader for live tournaments
  const { data: leader } = useTournamentLeader(type === 'live' ? tournament.id : undefined);

  // Use real image or fallback
  const backgroundImage = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueImage?.imageUrl;

  // Gradient for text readability
  const gradients = [
    'from-emerald-900 via-emerald-800 to-slate-900',
    'from-blue-900 via-indigo-800 to-slate-900',
    'from-amber-900 via-orange-800 to-slate-900',
    'from-purple-900 via-violet-800 to-slate-900',
  ];
  const bgGradient = gradients[tournament.name.length % gradients.length];

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
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        {hasRealImage ? (
          <img
            src={backgroundImage}
            alt={tournament.venueName || tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br", bgGradient)}>
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Gradient overlays - subtle, for text readability only */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content - Centered vertically with flex */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-24 safe-bottom">
        {/* Tour Logo + Status Row */}
        <div className="flex items-center gap-3 mb-4">
        {/* Tour Logo - Clean, no background */}
          <img 
            src={getTourLogo(tournament.tourSlug)} 
            alt={tourConfig.name}
            className="h-8 w-auto object-contain drop-shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          {/* Separator */}
          <div className="w-px h-4 bg-white/30" />
          
          {/* Status - Clean, minimal */}
          {type === 'live' ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-white/90">LIVE</span>
            </div>
          ) : (
            <span className="text-sm text-white/70">
              {getStartLabel(tournament.startDate)}
            </span>
          )}
        </div>

        {/* Tournament Name */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight max-w-lg">
          {tournament.name}
        </h2>
        
        {/* Venue */}
        <p className="text-base text-white/70 mb-4">
          {tournament.venueName}
          {tournament.venueCity && ` · ${tournament.venueCity}`}
        </p>

        {/* Leader Strip - Subtle frosted glass, single line */}
        {type === 'live' && leader && (
          <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl mb-4 max-w-fit">
            <span className="text-base">🥇</span>
            <span className="font-semibold text-white">
              {leader.player.firstName[0]}. {leader.player.lastName}
            </span>
            <span className="font-bold text-emerald-400">
              {leader.scoreDisplay}
            </span>
            {leader.thru && (
              <>
                <span className="text-white/40">·</span>
                <span className="text-white/70">Thru {leader.thru}</span>
              </>
            )}
          </div>
        )}

        {/* Meta info - Cleaner */}
        <div className="flex items-center gap-3 text-sm text-white/50 mb-5">
          {tournament.purse && (
            <span>{formatPurse(tournament.purse)}</span>
          )}
          {tournament.venuePar && (
            <>
              <span className="text-white/30">·</span>
              <span>Par {tournament.venuePar}</span>
            </>
          )}
          {tournament.venueYardage && (
            <>
              <span className="text-white/30">·</span>
              <span>{tournament.venueYardage.toLocaleString()} yds</span>
            </>
          )}
        </div>

        {/* CTA */}
        <Link to={`/tourhub/tournament/${tournament.id}`}>
          <motion.button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Tournament
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

// Scroll indicator chevron component
function ScrollIndicator() {
  const handleClick = () => {
    document.getElementById('content-below-hero')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <motion.button
      onClick={handleClick}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full border border-white/20 shadow-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      animate={{ 
        y: [0, 6, 0],
      }}
      transition={{
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <ChevronDown className="w-5 h-5 text-white" />
    </motion.button>
  );
}

export function HeroCarousel() {
  const { data: liveTournaments, isLoading: liveLoading } = useLiveTournaments();
  const { data: upcomingTournaments, isLoading: upcomingLoading } = useUpcomingTournaments(7);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Build slides array (live first, then upcoming)
  const slides: CarouselSlide[] = [
    ...(liveTournaments || []).map(t => ({ tournament: t, type: 'live' as const })),
    ...(upcomingTournaments || []).slice(0, 3).map(t => ({ tournament: t, type: 'upcoming' as const })),
  ].slice(0, 5);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Reset index when slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const isLoading = liveLoading || upcomingLoading;

  if (isLoading) {
    return (
      <div 
        className="relative w-full bg-slate-900 animate-pulse"
        style={{ 
          height: 'calc(100dvh - 80px)', // Full viewport minus bottom nav only - hero flows under header
          minHeight: '400px',
        }}
      >
        <div className="absolute bottom-24 left-6 right-6">
          <div className="h-6 w-24 bg-white/10 rounded mb-4" />
          <div className="h-10 w-64 bg-white/10 rounded mb-2" />
          <div className="h-5 w-48 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div 
        className="relative w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center"
        style={{ 
          height: 'calc(100dvh - 80px)', // Full viewport minus bottom nav only
          minHeight: '400px',
        }}
      >
        <div className="text-center text-white/60 pt-16">
          <p className="text-lg mb-2">No active tournaments</p>
          <p className="text-sm">Check back soon for upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ 
        height: 'calc(100dvh - 80px)', // Full viewport minus bottom nav only - hero flows under header
        minHeight: '400px',
        touchAction: 'pan-y',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="sync">
        {slides.map((slide, index) => (
          <HeroSlide
            key={slide.tournament.id}
            slide={slide}
            isActive={index === currentIndex}
          />
        ))}
      </AnimatePresence>

      {/* Pagination Dots - Below header area */}
      {slides.length > 1 && (
        <div className="absolute top-16 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 bg-white" 
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}

      {/* Bouncing Chevron - Bottom of hero */}
      <ScrollIndicator />
    </div>
  );
}

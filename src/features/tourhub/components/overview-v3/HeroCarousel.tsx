/**
 * HeroCarousel - Apple Glass Design
 * Full viewport hero with premium frosted glass card
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
import '@/styles/hero-glass.css';

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

function getScoreClass(score: number): string {
  if (score < 0) return 'score-under-par';
  if (score > 0) return 'score-over-par';
  return 'score-even-par';
}

function formatScore(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
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

  const isLive = type === 'live';
  const isUpcoming = type === 'upcoming';

  // Parse leader score for color coding
  const leaderScore = leader?.scoreDisplay 
    ? parseInt(leader.scoreDisplay.replace(/[^-0-9]/g, '') || '0', 10)
    : 0;

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

      {/* Legibility Gradient Overlay */}
      <div className="hero-legibility" />
      
      {/* Top gradient for header readability */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 z-5"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)'
        }}
      />

      {/* Glass Card - Bottom positioned */}
      <div 
        className="glass-card absolute left-4 right-4 sm:right-auto sm:left-6 sm:w-[min(360px,calc(100%-48px))] p-4"
        style={{ bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Tour Logo + Status Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Tour Logo */}
          <img 
            src={getTourLogo(tournament.tourSlug)} 
            alt={tourConfig.name}
            className="h-6 w-auto object-contain drop-shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          {/* Separator */}
          <div className="w-px h-3 bg-white/30" />
          
          {/* Status Badge */}
          {isLive ? (
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <span className="text-white/90 text-sm font-semibold tracking-wide">LIVE</span>
            </div>
          ) : isUpcoming ? (
            <span className="text-white/70 text-sm font-medium">
              {getStartLabel(tournament.startDate)}
            </span>
          ) : (
            <span className="text-white/70 text-sm font-medium">COMPLETED</span>
          )}
        </div>
        
        {/* Tournament Title */}
        <h2 className="text-white text-2xl font-semibold leading-tight">
          {tournament.name}
        </h2>
        
        {/* Venue & Location */}
        <p className="text-white/80 text-[15px] mt-1">
          {tournament.venueName}
          {tournament.venueCity && ` · ${tournament.venueCity}`}
        </p>
        
        {/* Leader Capsule (only show if live/completed with leader data) */}
        {isLive && leader && (
          <div className="glass-pill mt-4 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-lg">🥇</span>
              <span className="font-medium">
                {leader.player.firstName[0]}. {leader.player.lastName}
              </span>
            </div>
            <span className={cn("font-semibold text-lg", getScoreClass(leaderScore))}>
              {leader.scoreDisplay}
            </span>
          </div>
        )}
        
        {/* Meta Row */}
        <div className="mt-3 text-white/60 text-[13px] font-medium tracking-[0.08em] uppercase">
          {[
            tournament.purse && formatPurse(tournament.purse),
            tournament.venuePar && `PAR ${tournament.venuePar}`,
            tournament.venueYardage && `${tournament.venueYardage.toLocaleString()} YDS`
          ].filter(Boolean).join(' · ')}
        </div>
        
        {/* CTA Button */}
        <Link to={`/tourhub/tournament/${tournament.id}`} className="block mt-4">
          <button className="hero-cta w-full flex items-center justify-center gap-2 text-[15px]">
            <span>View Tournament</span>
            <ChevronRight className="w-4 h-4" />
          </button>
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
    <button
      onClick={handleClick}
      className="absolute left-1/2 -translate-x-1/2 z-20 chevron-hint"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      <ChevronDown className="w-8 h-8 text-white/55" strokeWidth={1.5} />
    </button>
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

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 6000);

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
          height: 'calc(100dvh - 80px)',
          marginTop: '-55px',
          minHeight: '400px',
        }}
      >
        <div 
          className="absolute left-4 right-4 sm:right-auto sm:w-[360px] p-4 glass-card"
          style={{ bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="h-4 w-20 bg-white/10 rounded mb-4" />
          <div className="h-8 w-56 bg-white/10 rounded mb-2" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div 
        className="relative w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center"
        style={{ 
          height: 'calc(100dvh - 80px)',
          marginTop: '-55px',
          minHeight: '400px',
        }}
      >
        <div className="text-center text-white/60">
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
        height: 'calc(100dvh - 80px)',
        marginTop: '-55px',
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

      {/* Pagination Dots with backing strip */}
      {slides.length > 1 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{ top: 'calc(55px + env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="dots-backing flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? "w-6 bg-white" 
                    : "w-1.5 bg-white/45"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bouncing Chevron */}
      <ScrollIndicator />
    </div>
  );
}

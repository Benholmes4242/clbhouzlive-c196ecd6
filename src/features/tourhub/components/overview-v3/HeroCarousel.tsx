/**
 * HeroCarousel - Full-Bleed Immersive Hero
 * Image extends to absolute top of viewport (behind iOS status bar)
 * Glass card and content respect safe-area-inset-top
 * 
 * Display logic (per tour):
 * - Priority 1: LIVE (inprogress) - takes precedence
 * - Priority 2: COMPLETED (closed/complete, last 7 days) with winner
 * - Priority 3: UPCOMING (scheduled/created) with countdown
 * 
 * Slide order: LIVE (by tour priority) > COMPLETED (by end_date DESC) > UPCOMING (by start_date ASC)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Trophy, Menu } from 'lucide-react';
import { openTourNav } from '../../contexts/TourNavContext';
import { cn } from '@/lib/utils';
import { 
  useHeroCarouselData,
  type HeroSlide as CarouselSlide,
  type HeroTournament,
} from '../../hooks/useHeroCarouselData';
import { useTournamentTopLeaders, TOUR_CONFIG, type LeaderEntry } from '../../hooks/useOverviewData';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import '@/styles/hero-glass.css';

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
  if (score < 0) return 'text-green-400';
  if (score > 0) return 'text-red-400';
  return 'text-white';
}

// Skeleton rows for loading state
function LeaderboardSkeleton() {
  return (
    <div className="mt-2 space-y-[3px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between py-[3px]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-white/10 rounded animate-pulse" />
            <div className="w-24 h-3 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="w-6 h-3 bg-white/10 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Mini leaderboard row for live tournaments
interface LeaderboardRowProps {
  leader: LeaderEntry;
}

function MiniLeaderboardRow({ leader }: LeaderboardRowProps) {
  const abbreviatedName = `${leader.player.firstName[0]}. ${leader.player.lastName}`;
  
  return (
    <div className="flex items-center justify-between py-[3px]">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-white/60 text-[11px] w-4 flex-shrink-0 text-center">
          {leader.position}
        </span>
        <span className="text-white text-xs font-medium truncate">
          {abbreviatedName}
        </span>
      </div>
      <span className={cn("text-xs font-semibold flex-shrink-0 ml-2", getScoreClass(leader.scoreToPar))}>
        {leader.scoreDisplay}
      </span>
    </div>
  );
}

// Individual slide component with venue image
interface HeroSlideProps {
  slide: CarouselSlide;
  isActive: boolean;
  totalSlides: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

function HeroSlide({ slide, isActive, totalSlides, currentIndex, onDotClick }: HeroSlideProps) {
  const { tournament, type } = slide;
  const tourConfig = TOUR_CONFIG[tournament.tourSlug] || TOUR_CONFIG.pga;
  
  // Fetch real venue image
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  
  const isLive = type === 'live';
  const isCompleted = type === 'completed';
  const isUpcoming = type === 'upcoming';
  
  // Fetch top 5 leaders for live tournaments only
  const { data: leaders = [], isLoading: leadersLoading } = useTournamentTopLeaders(
    isLive ? tournament.id : null
  );

  // Use real image or fallback
  const backgroundImage = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueImage?.imageUrl;

  // Warm, golf-feeling gradients for venues without images
  const gradients = [
    'from-emerald-800 via-green-700 to-emerald-900',      // Classic fairway green
    'from-amber-700 via-yellow-600 to-amber-800',         // Golden hour sunset
    'from-teal-800 via-emerald-700 to-cyan-900',          // Links course morning
    'from-green-800 via-lime-700 to-emerald-900',         // Spring meadow
  ];
  const bgGradient = gradients[tournament.name.length % gradients.length];

  // Winner info for completed tournaments (now always available on HeroTournament)
  const winnerInfo = isCompleted && tournament.winnerName ? tournament : null;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Background with Ken Burns - fills ENTIRE container including safe area */}
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
          <div className={cn("absolute inset-0 w-full h-full bg-gradient-to-br", bgGradient)}>
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Legibility Gradient Overlay - only for venues without real images */}
      {!hasRealImage && <div className="hero-legibility" />}
      
      {/* Top gradient for header readability */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 z-5"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)'
        }}
      />

      {/* Glass Card - Bottom Left */}
      <div 
        className="glass-card absolute left-4 p-2.5"
        style={{ 
          bottom: '38px',
          width: 'min(238px, calc(100% - 32px))',
        }}
      >
        {/* Row 1: Status | Tour Logo (right-aligned) */}
        <div className="flex items-center justify-between mb-2">
          {/* Status Badge - left */}
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="live-dot" />
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-sm font-semibold">FINISHED</span>
            </div>
          ) : isUpcoming ? (
            <span className="text-white text-sm font-medium">
              {getStartLabel(tournament.startDate)}
            </span>
          ) : (
            <span className="text-white text-sm font-medium">COMPLETED</span>
          )}
          
          {/* Tour Logo - right (sizes vary by tour) */}
          <img 
            src={getTourLogo(tournament.tourSlug)} 
            alt={tourConfig.name}
            className={cn(
              "w-auto object-contain",
              tournament.tourSlug === 'liv' ? "h-11" :
              tournament.tourSlug === 'pga' ? "h-8" :
              tournament.tourSlug === 'euro' ? "h-11" :
              tournament.tourSlug === 'pgad' ? "h-14" :
              tournament.tourSlug === 'lpga' ? "h-10" :
              "h-9"
            )}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Row 2: Tournament Name */}
        <h2 className="text-white text-[16px] font-semibold leading-tight">
          {tournament.name}
        </h2>
        
        {/* Row 3: Venue */}
        <p className="text-white text-[11px] mt-0.5">
          {tournament.venueName}
          {tournament.venueCity && ` · ${tournament.venueCity}`}
        </p>
        
        {/* ─── LIVE CARD LAYOUT ─── */}
        {isLive && (
          <>
            {/* Meta line (moved up for live) */}
            <p className="mt-1.5 text-white text-[10px] font-medium tracking-wider uppercase">
              {[
                tournament.purse && formatPurse(tournament.purse),
                tournament.venuePar && `PAR ${tournament.venuePar}`,
                tournament.venueYardage && `${tournament.venueYardage.toLocaleString()} YDS`
              ].filter(Boolean).join(' · ')}
            </p>
            
            {/* Mini Leaderboard or Loading/Starting Soon */}
            {leadersLoading ? (
              <LeaderboardSkeleton />
            ) : leaders.length > 0 ? (
              <div 
                className="mt-2 px-2.5 py-1.5 rounded-[14px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                {leaders.map((leader) => (
                  <MiniLeaderboardRow key={`${leader.position}-${leader.player.id}`} leader={leader} />
                ))}
              </div>
            ) : (
              <div 
                className="mt-2 px-3 py-1.5 rounded-[12px] inline-flex items-center"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-white/80 text-xs font-medium italic">
                  Starting Soon
                </span>
              </div>
            )}
            
            {/* See All CTA for live */}
            <Link 
              to={`/tourhub/tournament/${tournament.id}`} 
              className="flex items-center justify-center gap-0.5 py-1.5 mt-2 text-white/70 text-xs font-medium hover:text-white/90 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </>
        )}
        
        {/* ─── COMPLETED CARD LAYOUT (unchanged) ─── */}
        {isCompleted && (
          <>
            {/* Winner Pill */}
            {winnerInfo?.winnerName && (
              <div 
                className="mt-2 px-2 py-1.5 rounded-[12px] inline-flex items-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {(() => {
                  const photoUrl = resolvePhotoUrl(winnerInfo.winnerPhotoUrl, winnerInfo.winnerPgaTourId);
                  return photoUrl ? (
                    <div 
                      className="w-5 h-5 flex-shrink-0 overflow-hidden bg-white/20"
                      style={{ borderRadius: '34%' }}
                    >
                      <img 
                        src={photoUrl}
                        alt={winnerInfo.winnerName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null;
                })()}
                <span className="text-amber-100 text-xs font-medium">
                  {winnerInfo.winnerName}
                  {winnerInfo.winnerScore && (
                    <span className="text-amber-300 ml-1">({winnerInfo.winnerScore})</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Meta */}
            <p className="mt-1.5 text-white text-[10px] font-medium tracking-wider uppercase">
              {[
                tournament.purse && formatPurse(tournament.purse),
                tournament.venuePar && `PAR ${tournament.venuePar}`,
                tournament.venueYardage && `${tournament.venueYardage.toLocaleString()} YDS`
              ].filter(Boolean).join(' · ')}
            </p>
            
            {/* CTA */}
            <Link to={`/tourhub/tournament/${tournament.id}`} className="inline-block mt-2">
              <button className="hero-cta px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <span>View Tournament</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          </>
        )}
        
        {/* ─── UPCOMING CARD LAYOUT (unchanged) ─── */}
        {isUpcoming && (
          <>
            {/* Meta */}
            <p className="mt-1.5 text-white text-[10px] font-medium tracking-wider uppercase">
              {[
                tournament.purse && formatPurse(tournament.purse),
                tournament.venuePar && `PAR ${tournament.venuePar}`,
                tournament.venueYardage && `${tournament.venueYardage.toLocaleString()} YDS`
              ].filter(Boolean).join(' · ')}
            </p>
            
            {/* CTA */}
            <Link to={`/tourhub/tournament/${tournament.id}`} className="inline-block mt-2">
              <button className="hero-cta px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <span>View Tournament</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          </>
        )}
        
        {/* Row 7: Carousel Dots - Inside card, below CTA */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
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
                    ? "w-4 h-1 bg-white/80" 
                    : "w-1 h-1 bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Scroll indicator chevron component - positioned below the glass card
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
      style={{ bottom: '10px' }}
    >
      <ChevronDown className="w-7 h-7 text-white/40" strokeWidth={1.5} />
    </button>
  );
}

interface HeroCarouselProps {
  /** If true, hero bleeds behind header; if false (default), only bleeds behind safe area */
  hasHeader?: boolean;
}

export function HeroCarousel({ hasHeader = false }: HeroCarouselProps) {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Icon position: for pages with header, add header height offset
  const iconTop = hasHeader 
    ? 'calc(env(safe-area-inset-top, 0px) + 55px + 8px)'
    : 'calc(env(safe-area-inset-top, 0px) + 8px)';

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

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-slate-900 animate-pulse">
        <div 
          className="absolute left-4 right-4 sm:right-auto sm:w-[360px] p-4 glass-card"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
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
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-lg mb-2">No active tournaments</p>
          <p className="text-sm">Check back soon for upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Menu Icon - left side, opens tour nav overlay */}
      <button 
        className="absolute left-4 z-20 p-2 -m-2"
        style={{ top: iconTop }}
        onClick={openTourNav}
        aria-label="Open tour menu"
      >
        <Menu className="w-6 h-6 text-white/70" strokeWidth={1.5} />
      </button>

      <AnimatePresence mode="sync">
        {slides.map((slide, index) => (
          <HeroSlide
            key={slide.tournament.id}
            slide={slide}
            isActive={index === currentIndex}
            totalSlides={slides.length}
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

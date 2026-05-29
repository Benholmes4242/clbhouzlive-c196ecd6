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

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tournamentRoute } from '../../routes';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import {
  useHeroCarouselData,
  type HeroSlide as CarouselSlide,
} from '../../hooks/useHeroCarouselData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { useLeaderboardRealtime } from '../../hooks/useLeaderboardRealtime';
import { ExpandedLeaderboardError, ExpandedLeaderboardEmpty } from './ExpandedLeaderboard';

import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import livUpcomingHero from '@/assets/liv-upcoming-hero.webp';
import tpcSanAntonioUpcoming from '@/assets/tpc-san-antonio-upcoming.webp';
import shadowCreekUpcoming from '@/assets/shadow-creek-upcoming.jpg';
import lakewoodNationalUpcoming from '@/assets/lakewood-national-upcoming.jpg';
import volvoChinaOpenUpcoming from '@/assets/tours/volvo-china-open-upcoming.jpg';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
// formatPurse/PlayerAvatar/UpcomingCountdown no longer used here — moved into EditorialUpcomingHero
import { HybridHero, HybridHeroSkeleton } from './HybridHero';
import { cn } from '@/lib/utils';
import '@/styles/hero-glass.css';
import { EchoContextualButton } from '@/components/echo/EchoContextualButton';

function getTourDisplayName(tourSlug: string): string {
  const names: Record<string, string> = {
    pga: 'PGA TOUR',
    liv: 'LIV GOLF',
    euro: 'DP WORLD',
    lpga: 'LPGA',
    champ: 'CHAMPIONS',
    pgad: 'KORN FERRY',
  };
  return names[tourSlug] ?? tourSlug.toUpperCase();
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
interface HeroSlideProps {
  slide: CarouselSlide;
  isActive: boolean;
  totalSlides: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  leadersWinnersMap?: Map<string, import('../../hooks/useTournamentLeadersWinners').TournamentLeaderWinner>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onInteraction: () => void;
  onCardTouchStart: (e: React.TouchEvent) => void;
  onCardTouchMove: (e: React.TouchEvent) => void;
  onCardTouchEnd: (e: React.TouchEvent) => void;
  /** Pass 5: forwarded to HybridHero for the tour switcher overlay. */
  activeTournamentId?: string | null;
  onTourSelect?: (tournamentId: string) => void;
}

function getDefendingChampionSubtext(tournament: {
  isMajor: boolean;
  isSignature: boolean;
  tourSlug: string;
  venueName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  purse: number | null;
}): string {
  const { isMajor, isSignature, tourSlug, venueName, venueCity, venueCountry, purse } = tournament;
  if (isMajor && venueName) return `Last won here at ${venueName}`;
  if (isSignature && purse) {
    const purseM = (purse / 1_000_000).toFixed(0);
    return `Defending a $${purseM}M signature event`;
  }
  if (venueCity) return `Last claimed the title in ${venueCity}`;
  if (venueCountry) return `Last won here in ${venueCountry}`;
  const tourFallbacks: Record<string, string> = {
    pga: 'The reigning PGA Tour champion',
    lpga: 'The reigning LPGA Tour champion',
    liv: 'The reigning LIV Golf champion',
    euro: 'The reigning DP World Tour champion',
    pgad: 'The reigning Korn Ferry champion',
    champ: 'The reigning Champions Tour champion',
  };
  return tourFallbacks[tourSlug] ?? 'The defending champion';
}

function HeroSlide({ slide, isActive, totalSlides, currentIndex, onDotClick, leadersWinnersMap, isExpanded, onToggleExpand, onInteraction, onCardTouchStart, onCardTouchMove, onCardTouchEnd, activeTournamentId, onTourSelect }: HeroSlideProps) {
  const { tournament, type } = slide;
  const navigate = useNavigate();
  
  
  // Fetch real venue image
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  
  const isLive = type === 'live';
  const isCompleted = type === 'completed';
  const isUpcoming = type === 'upcoming';
  
  // Podium data for completed slides — finisher list passed to EditorialResultsHero
  const podiumData = isCompleted ? leadersWinnersMap?.get(tournament.id) : undefined;
  const allFetchedData = podiumData?.allFetched ?? podiumData?.topFinishers ?? [];

  // Hero rows are passive in the new HybridHero design (HYBRID_HERO_IMPLEMENTATION_BRIEF §15).
  // PlayerScorecardCard / scorecard-tap flow has been removed.

  // Full leaderboard — drives EditorialLiveHero
  const { data: fullLeaderboard = [], isLoading: isLoadingFull, isError: isFullError, refetch: refetchFull } = useTourLeaderboard(
    isLive ? tournament.id : ''
  );

  // Realtime updates — keep editorial live hero fresh
  useLeaderboardRealtime(isLive ? tournament.id : null);

  // Body scroll lock when expanded (upcoming-only modal pattern)
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  // Back button handling when expanded
  useEffect(() => {
    if (!isExpanded) return;
    window.history.pushState({ expandedLeaderboard: true }, '');
    const handlePopState = () => {
      onToggleExpand();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isExpanded, onToggleExpand]);

  // (scorecard tap flow removed — rows are passive in HybridHero)

  // Venue-specific hero image overrides (upcoming + live)
  const venueOverride = (isUpcoming || isLive) ? (
    tournament.tourSlug === 'liv' ? livUpcomingHero
    : tournament.venueName?.toLowerCase().includes('tpc san antonio') ? tpcSanAntonioUpcoming
    : tournament.venueName?.toLowerCase().includes('shadow creek') ? shadowCreekUpcoming
    : tournament.venueName?.toLowerCase().includes('lakewood national') ? lakewoodNationalUpcoming
    : tournament.name?.toLowerCase().includes('volvo china open') ? volvoChinaOpenUpcoming
    : null
  ) : null;
  const backgroundImage = venueOverride || venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueOverride || !!venueImage?.imageUrl;

   // Tour-branded gradients for venues without images
  const tourFallbacks: Record<string, string> = {
    pga: 'from-blue-900 via-blue-800 to-slate-900',
    liv: 'from-slate-900 via-green-900 to-slate-950',
    euro: 'from-indigo-900 via-purple-900 to-slate-900',
    lpga: 'from-pink-900 via-rose-800 to-slate-900',
    champ: 'from-amber-900 via-yellow-800 to-amber-950',
    pgad: 'from-emerald-900 via-green-800 to-teal-900',
  };
  const bgGradient = tourFallbacks[tournament.tourSlug] || 'from-emerald-800 via-green-700 to-emerald-900';

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
        initial={{ scale: 1.03, opacity: 0 }}
        animate={{ 
          scale: isActive ? 1 : 1.03, 
          opacity: isActive ? 1 : 0 
        }}
        transition={{ 
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 5, ease: 'linear' }
        }}
      >
        {hasRealImage && !isLive && !isCompleted ? (
          <img
            src={backgroundImage}
            alt={tournament.venueName || tournament.name}
            className="absolute inset-0 w-full h-full object-cover hero-course-image"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: isLive || isCompleted
                ? '#141d2e'
                : undefined,
            }}
          >
            {!isLive && !isCompleted && (
              <div className={cn("absolute inset-0 w-full h-full bg-gradient-to-br", bgGradient)} />
            )}
          </div>
        )}
      </motion.div>


      {/* Legibility gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-5"
        style={{
          background: isLive || isCompleted
            ? 'none'
            : isUpcoming
            ? `linear-gradient(180deg,
                rgba(20,29,46,0.55) 0%,
                rgba(20,29,46,0.25) 15%,
                rgba(20,29,46,0.10) 30%,
                rgba(20,29,46,0.60) 55%,
                rgba(20,29,46,0.93) 72%,
                rgba(20,29,46,0.95) 82%)`
            : `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%),
               linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)`,
        }}
      />

      {/* Extra top scrim for upcoming — darkens header area independently */}
      {isUpcoming && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 6,
            background: `linear-gradient(180deg,
              rgba(20,29,46,0.75) 0%,
              rgba(20,29,46,0.50) 15%,
              rgba(20,29,46,0.20) 35%,
              transparent 50%)`,
          }}
        />
      )}

      {isExpanded && !isLive && !isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => onToggleExpand()}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
            background: 'rgba(0, 0, 0, 0.3)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Glass Card - Bottom Left — canonical Creator Capsule glass + animation spec */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            layout
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onTouchStart={(e) => { onCardTouchStart(e); }}
            onTouchMove={(e) => { onCardTouchMove(e); }}
            onTouchEnd={(e) => { onCardTouchEnd(e); }}
            style={(isLive || isUpcoming || isCompleted) ? {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 0,
              background: 'transparent',
              border: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              boxShadow: 'none',
              padding: 0,
              overflow: 'hidden',
              zIndex: 20,
              pointerEvents: 'auto' as const,
              display: 'flex',
              flexDirection: 'column' as const,
            } : {
              position: 'absolute',
              bottom: isExpanded ? 16 : 90,
              left: isExpanded ? 12 : 16,
              ...(isExpanded
                ? { right: 12, top: 'calc(env(safe-area-inset-top, 20px) + 120px)' }
                : {
                    maxWidth: 'min(350px, calc(100% - 32px))',
                  }
              ),
              minWidth: isExpanded ? undefined : '280px',
              borderRadius: isExpanded ? 16 : 12,
              background: isExpanded ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.35)',
              backdropFilter: isExpanded ? 'blur(24px)' : 'blur(20px)',
              WebkitBackdropFilter: isExpanded ? 'blur(24px)' : 'blur(20px)',
              boxShadow: isExpanded ? '0 8px 32px rgba(0, 0, 0, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.25)',
              padding: isExpanded ? '20px 0 8px 0' : '20px 20px 14px 20px',
              border: tournament.isMajor
                ? '1px solid rgba(250, 204, 21, 0.35)'
                : tournament.isSignature
                ? '1px solid rgba(16, 185, 129, 0.25)'
                : '1px solid rgba(255, 255, 255, 0.10)',
              overflow: 'hidden',
              zIndex: isExpanded ? 20 : 10,
              pointerEvents: 'auto' as const,
              display: isExpanded ? 'flex' : 'block',
              flexDirection: isExpanded ? 'column' as const : undefined,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >

            {/* ─── Upcoming renders its own editorial hero (no chrome). ─── */}

            {/* ─── State-specific content — each section uses Capsule spring easing ─── */}
            <AnimatePresence mode="popLayout">

              {/* HYBRID HERO — single component handles live / completed / upcoming */}
              <motion.div
                key="hybrid-hero-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                style={{ overflow: 'hidden', flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' as const }}
              >
                {(isLive || isCompleted) && isLoadingFull && fullLeaderboard.length === 0 ? (
                  <HybridHeroSkeleton />
                ) : (
                  <HybridHero
                    slide={slide}
                    activeTournamentId={activeTournamentId ?? null}
                    onSelectTour={onTourSelect ?? (() => {})}
                  />

                )}
              </motion.div>

            </AnimatePresence>

            {/* Dots moved outside glass card */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ScrollIndicator removed - no longer needed

interface HeroCarouselProps {
  /** If true, hero bleeds behind header; if false (default), only bleeds behind safe area */
  hasHeader?: boolean;
  /** Called when scorecard open/close state changes */
  onScorecardStateChange?: (isOpen: boolean) => void;
  /**
   * Carousel mode:
   * - 'overview' filters out upcoming slides (IntelligenceHero's UpcomingState handles upcoming inline)
   * - 'schedule' (default) renders live + completed + upcoming
   */
  mode?: 'overview' | 'schedule';
  /**
   * Phase A — externally-driven active tournament id.
   * When provided, the carousel syncs its internal currentIndex to the matching slide.
   * Optional — when omitted, the carousel manages its own active slide internally (Schedule behavior preserved).
   */
  activeTournamentId?: string | null;
  /** Called when the carousel's internal currentIndex advances (auto-rotate or swipe). */
  onActiveChange?: (tournamentId: string) => void;
  /** When false, auto-rotation is disabled entirely. Default true. */
  autoRotate?: boolean;
  /** Pass 5: tour switcher tap handler — forwarded to HybridHero. */
  onTourSelect?: (tournamentId: string) => void;
}

export function HeroCarousel({
  hasHeader = false,
  onScorecardStateChange,
  mode = 'schedule',
  activeTournamentId,
  onActiveChange,
  autoRotate = true,
  onTourSelect,
}: HeroCarouselProps) {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  const rawSlides = Array.isArray(slides) ? slides : [];
  // Referentially stable: only rebuild when slide ids / mode actually change.
  const slideSignature = rawSlides.map((s) => `${s.type}:${s.tournament.id}`).join('|');
  const safeSlides = React.useMemo(
    () => (mode === 'overview' ? rawSlides.filter((s) => s.type !== 'upcoming') : rawSlides),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slideSignature, mode],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [autoAdvanceKey, setAutoAdvanceKey] = useState(0);
  const resetAutoAdvance = () => setAutoAdvanceKey(k => k + 1);
  const [isExpanded, setIsExpanded] = useState(false);
  const lastEmittedRef = React.useRef<string | null>(null);

  // Phase A — sync external activeTournamentId → internal currentIndex (one-way, parent-driven).
  useEffect(() => {
    if (!activeTournamentId || safeSlides.length === 0) return;
    const idx = safeSlides.findIndex(s => s.tournament.id === activeTournamentId);
    if (idx < 0) {
      lastEmittedRef.current = activeTournamentId; // no slide for this id; don't echo
      return;
    }
    if (idx !== currentIndex) {
      lastEmittedRef.current = activeTournamentId; // parent-driven; don't echo back
      setCurrentIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTournamentId, safeSlides]);

  // Phase A — emit currentIndex changes upward (so the Ticker's "NOW SHOWING" follows auto-rotate / swipe).
  // lastEmittedRef prevents the parent↔child echo loop: we only emit an id we have not
  // already emitted, and never re-emit the value the parent just handed us back.
  useEffect(() => {
    if (!onActiveChange) return;
    const slide = safeSlides[currentIndex];
    if (!slide) return;
    const id = slide.tournament.id;
    if (id === lastEmittedRef.current) return; // already emitted this one
    if (id === activeTournamentId) {            // parent already in sync; just record it
      lastEmittedRef.current = id;
      return;
    }
    lastEmittedRef.current = id;
    onActiveChange(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, safeSlides, activeTournamentId, onActiveChange]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Wire up top-3 podium data for completed slides
  const completedIds = safeSlides
    .filter(s => s.type === 'completed')
    .map(s => s.tournament.id);
  const liveIds = safeSlides
    .filter(s => s.type === 'live')
    .map(s => s.tournament.id);
  const { data: leadersWinnersMap } = useTournamentLeadersWinners([...completedIds, ...liveIds]);
  
  // Touch swipe state
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = React.useRef<number>(0);
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScorecardOpenRef = React.useRef(false);
  // (Phase A: railRef removed alongside the deleted pill rail)

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
  }, []);

  // Clean up resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Auto-rotation removed (May 2026). Slides change ONLY via user swipe, dot tap,
  // or the parent tour-switcher. isPaused / autoAdvanceKey / scheduleResume remain
  // as inert bookkeeping for the swipe handlers and never drive an auto-advance.

  // Pause auto-advance when app is backgrounded
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setTimeout(() => setIsPaused(false), 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Preload current slide's winner avatar into browser cache
  useEffect(() => {
    const slide = safeSlides[currentIndex];
    if (slide?.type === 'completed') {
      const winners = leadersWinnersMap?.get(slide.tournament.id);
      const winner = winners?.topFinishers?.find(w => w.position === 1);
      if (winner) {
        const url = getPlayerHeadshotUrl(
          winner.fullName || `${winner.firstName} ${winner.lastName}`,
          slide.tournament.tourSlug || 'pga'
        );
        if (url) {
          const img = new Image();
          img.src = url;
        }
      }
    }
  }, [currentIndex, safeSlides, leadersWinnersMap]);

  // Reset index when slides change
  useEffect(() => {
    if (currentIndex >= safeSlides.length) {
      setCurrentIndex(0);
    }
  }, [safeSlides.length, currentIndex]);

  // (Phase A: pill-rail auto-scroll effect removed alongside the deleted rail)

  // Auto-collapse if slide index changes
  const prevIndexRef = React.useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex && isExpanded) {
      setIsExpanded(false);
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex, isExpanded]);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    touchMoveRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    touchMoveRef.current = e.touches[0].clientX - touchStartRef.current.x;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      scheduleResume();
      return;
    }
    const deltaX = touchMoveRef.current;
    const deltaY = Math.abs(
      (e.changedTouches[0]?.clientY ?? 0) - touchStartRef.current.y
    );
    const elapsed = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;
    touchMoveRef.current = 0;

    // Tap detection: minimal movement + short duration → let browser handle as click
    if (Math.abs(deltaX) < 10 && deltaY < 10 && elapsed < 300) {
      scheduleResume();
      return;
    }

    const threshold = 50;
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
      if (deltaX < -threshold && currentIndex < safeSlides.length - 1) {
        setCurrentIndex(prev => prev + 1);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        setIsPaused(false);
        resetAutoAdvance();
      } else if (deltaX > threshold && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        setIsPaused(false);
        resetAutoAdvance();
      }
    }

    scheduleResume();
  };

  if (isLoading || safeSlides.length === 0) {
    return (
      <div className="relative w-full h-full bg-slate-900 animate-pulse overflow-hidden" />
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      <AnimatePresence mode="sync">
        {safeSlides.map((slide, index) => (
          <HeroSlide
            key={slide.tournament.id}
            slide={slide}
            isActive={index === currentIndex}
            totalSlides={safeSlides.length}
            currentIndex={currentIndex}
            onDotClick={(i: number) => { setCurrentIndex(i); resetAutoAdvance(); }}
            leadersWinnersMap={leadersWinnersMap}
            isExpanded={index === currentIndex && (slide.type === 'live' ? true : isExpanded)}
            onToggleExpand={handleToggleExpand}
            onInteraction={() => {
              setIsPaused(true);
              scheduleResume();
            }}
            onCardTouchStart={handleTouchStart}
            onCardTouchMove={handleTouchMove}
            onCardTouchEnd={handleTouchEnd}
            activeTournamentId={activeTournamentId}
            onTourSelect={onTourSelect}
          />
        ))}
      </AnimatePresence>

      {/*
       * Phase A — TOUR PILL RAIL DELETED.
       * The Hero's bottom mini-card switcher row was retired in favor of the
       * AllToursTicker, which now serves as the canonical Hero switcher on the
       * Overview page (live tournaments only — completed surfaces handled by
       * Tournament Results, upcoming inline within IntelligenceHero, and the
       * full schedule via ComingUpCalendar).
       */}
    </div>
  );
}

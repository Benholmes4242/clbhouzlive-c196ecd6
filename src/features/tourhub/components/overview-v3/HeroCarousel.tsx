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
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';
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
import { PlayerScorecardCard } from '@/components/tourhub/PlayerScorecardCard';

import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import livUpcomingHero from '@/assets/liv-upcoming-hero.webp';
import tpcSanAntonioUpcoming from '@/assets/tpc-san-antonio-upcoming.webp';
import shadowCreekUpcoming from '@/assets/shadow-creek-upcoming.jpg';
import lakewoodNationalUpcoming from '@/assets/lakewood-national-upcoming.jpg';
import volvoChinaOpenUpcoming from '@/assets/tours/volvo-china-open-upcoming.jpg';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { formatPurse, PlayerAvatar, UpcomingCountdown } from '../shared/TourHeroHelpers';
import { EditorialLiveHero, LiveHeroSkeleton } from './EditorialLiveHero';
import { EditorialResultsHero } from './EditorialResultsHero';
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
  onScorecardOpen?: () => void;
  onScorecardClose?: () => void;
  onCardTouchStart: (e: React.TouchEvent) => void;
  onCardTouchMove: (e: React.TouchEvent) => void;
  onCardTouchEnd: (e: React.TouchEvent) => void;
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

function HeroSlide({ slide, isActive, totalSlides, currentIndex, onDotClick, leadersWinnersMap, isExpanded, onToggleExpand, onInteraction, onScorecardOpen, onScorecardClose, onCardTouchStart, onCardTouchMove, onCardTouchEnd }: HeroSlideProps) {
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

  // Scorecard state — player tapped in expanded leaderboard
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const handleScorecardTap = useCallback((player: PlayerInfo) => {
    setSelectedPlayer(player);
    onScorecardOpen?.();
  }, [onScorecardOpen]);
  const handleBackToLeaderboard = useCallback(() => {
    setSelectedPlayer(null);
    onScorecardClose?.();
  }, [onScorecardClose]);

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

  // Clear selected player when glass card collapses
  useEffect(() => {
    if (!isExpanded) setSelectedPlayer(null);
  }, [isExpanded]);

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
                    maxHeight: 'calc(100% - max(env(safe-area-inset-top, 47px), 47px) - 110px)',
                    overflowY: 'auto' as const,
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

            {/* ─── Tournament header — UPCOMING only. Live + Completed render their own caption strip inside the editorial hero. ─── */}
            {!selectedPlayer && isUpcoming && (
              <>
                <div style={{
                  flexShrink: 0,
                  // Header sits below status bar + global header. Tighter on short screens.
                  paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + clamp(36px, 8vh, 65px))',
                }}>
                  <div style={{ padding: '0 16px' }}>
                    {/* ZONE A — Tour + Dates row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'clamp(6px, 1.2vh, 10px)', borderBottom: '1px solid rgba(255,255,255,0.18)', marginBottom: 'clamp(8px, 1.6vh, 12px)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 900, color: '#000', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                          {getTourDisplayName(tournament.tourSlug)}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                          Upcoming
                        </span>
                      </div>
                      {tournament.startDate && tournament.endDate && (
                        <div style={{ textAlign: 'right' as const }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                            {new Date(tournament.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {new Date(tournament.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#F7931E', marginTop: 1 }}>
                            {getStartLabel(tournament.startDate)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ZONE B — Tournament name + venue (fluid by viewport height) */}
                    <Link {...(() => { const t = tournamentRoute(tournament.id, { kind: 'overview' }); return { to: t.to, state: t.state }; })()} className="block active:opacity-70 transition-opacity">
                      <h2 style={{
                        fontSize: 'clamp(26px, 4.8vh, 40px)', fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.03em', lineHeight: 0.95, margin: 0, marginBottom: 'clamp(6px, 1.2vh, 10px)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {tournament.name}
                      </h2>
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/tourhub/courses?q=${encodeURIComponent(tournament.venueName || '')}`); }}
                      className="active:opacity-70 transition-opacity cursor-pointer"
                      style={{ fontSize: 'clamp(13px, 1.8vh, 15px)', fontWeight: 600, color: '#fff', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
                    >
                      {tournament.venueName}{tournament.venueCity ? ` · ${tournament.venueCity}` : ''}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ─── State-specific content — each section uses Capsule spring easing ─── */}
            <AnimatePresence mode="popLayout">

              {/* LIVE LAYOUT — EditorialLiveHero is the only render. No collapsed fork. */}
              {isLive && (
                <motion.div
                  key="live-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  style={{ overflow: 'hidden', flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' as const }}
                >
                  <AnimatePresence mode="wait">
                    {selectedPlayer ? (
                      <motion.div
                        key="scorecard"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                      >
                        <PlayerScorecardCard
                          player={selectedPlayer}
                          tournamentId={tournament.id}
                          tournamentName={tournament.name}
                          courseName={tournament.venueName || ''}
                          onBack={handleBackToLeaderboard}
                          onClose={handleBackToLeaderboard}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="leaderboard"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                      >
                        {isLoadingFull ? (
                          <LiveHeroSkeleton />
                        ) : isFullError ? (
                          <ExpandedLeaderboardError onRetry={() => refetchFull()} />
                        ) : fullLeaderboard.length === 0 ? (
                          <ExpandedLeaderboardEmpty />
                        ) : (
                          <EditorialLiveHero
                            tournament={{
                              id: tournament.id,
                              name: tournament.name,
                              tourSlug: tournament.tourSlug,
                              venueName: tournament.venueName,
                              venueCity: tournament.venueCity,
                              startDate: tournament.startDate,
                            }}
                            leaderboard={fullLeaderboard as any[]}
                            currentRound={(() => {
                              const first = (fullLeaderboard as any[])[0];
                              if (!first) return 1;
                              const last = [4, 3, 2, 1].find(n => first[`round_${n}`] !== null) ?? 0;
                              return last === 0 ? 1 : Math.min(last + 1, 4);
                            })()}
                            onPlayerTap={(entry) => {
                              const player = entry.player;
                              if (!player) return;
                              const fullName = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim();
                              const tourCode = player.tour_codes?.[0] ?? tournament.tourSlug ?? 'pga';
                              handleScorecardTap({
                                id: player.id,
                                srId: player.sr_id || '',
                                name: fullName,
                                firstName: player.first_name,
                                lastName: player.last_name,
                                photoUrl: getPlayerHeadshotUrl(fullName, tourCode, player.headshot_override) || undefined,
                                countryCode: player.country || undefined,
                                position: entry.position,
                                totalScore: entry.score ?? 0,
                                thru: entry.thru === 18 ? 'F' : `${entry.thru ?? '—'}`,
                                currentRound: entry.thru === 18 ? Math.min((entry.last_completed_round ?? 0) + 1, 4) : 4,
                              });
                            }}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* COMPLETED LAYOUT — full-bleed dark, matching live aesthetic */}
              {isCompleted && (
                <motion.div
                  key="completed-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  style={{ overflow: 'hidden', flex: 1, height: '100%', display: 'flex', flexDirection: 'column' as const, minHeight: 0 }}
                >
                {selectedPlayer ? (
                  <motion.div
                    key="completed-scorecard"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                  >
                    <PlayerScorecardCard
                      player={selectedPlayer}
                      tournamentId={tournament.id}
                      tournamentName={tournament.name}
                      courseName={tournament.venueName || ''}
                      isCompleted={true}
                      onBack={handleBackToLeaderboard}
                      onClose={() => {
                        setSelectedPlayer(null);
                      }}
                    />
                  </motion.div>
                ) : (
                  <EditorialResultsHero
                    tournament={{
                      id: tournament.id,
                      name: tournament.name,
                      tourSlug: tournament.tourSlug,
                      venueName: tournament.venueName,
                      venueCity: tournament.venueCity,
                    }}
                    finishers={allFetchedData}
                    onPlayerTap={handleScorecardTap}
                  />
                )}
                </motion.div>
              )}

              {/* UPCOMING LAYOUT */}
              {isUpcoming && (
                <motion.div
                  key="upcoming-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  style={{ overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' as const }}
                >
                  {/* Main content — grows to fill, scales fluidly with viewport height */}
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'flex-end', padding: '0 18px', gap: 'clamp(6px, 1.2vh, 10px)' }}>
                  {/* ── COURSE FACT CHIPS ── */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 'clamp(4px, 0.8vh, 6px)' }}>
                    {[
                      tournament.purse      && { value: formatPurse(tournament.purse),                          label: 'Purse'  },
                      tournament.venuePar   && { value: `Par ${tournament.venuePar}`,                           label: 'Course' },
                      tournament.venueYardage && { value: `${tournament.venueYardage.toLocaleString()}y`,        label: 'Yards'  },
                    ].filter(Boolean).map((chip: any) => (
                      <div key={chip.label} style={{
                        flex: 1, textAlign: 'center',
                        padding: 'clamp(5px, 1vh, 8px) 4px clamp(4px, 0.8vh, 6px)',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <div style={{ fontSize: 'clamp(12px, 1.7vh, 14px)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                          {chip.value}
                        </div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>
                          {chip.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── LIVE COUNTDOWN ── */}
                  <div>
                    <UpcomingCountdown startDate={tournament.startDate} />
                  </div>

                  {/* ── DEFENDING CHAMPION PANEL ── */}
                  {tournament.defendingChampion && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1], delay: 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 12,
                        padding: 'clamp(7px, 1.2vh, 10px) 12px',
                      }}
                    >
                      {/* Avatar */}
                      <PlayerAvatar displayName={tournament.defendingChampion} photoUrl={tournament.defendingChampionPhotoUrl} tourCode={tournament.tourSlug} size={40} frosted />
                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(250,204,21,0.65)', display: 'block' }}>
                          🏆 Defending Champion
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', display: 'block', marginTop: 1 }}>
                          {tournament.defendingChampion}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 1 }}>
                          {tournament.championNarrative || getDefendingChampionSubtext(tournament)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Echo — tour hub contextual */}
                  <div style={{ paddingBottom: 'clamp(2px, 0.6vh, 8px)' }}>
                    <EchoContextualButton
                      prompt={
                        isLive
                          ? `It's ${new Date().getFullYear()} and ${tournament.name} is live right now at ${tournament.venueName || 'the course'}${tournament.venueCity ? ` in ${tournament.venueCity}` : ''}. Search for the latest live leaderboard and tell me who is leading, who is making a move, and what the key storylines are today.`
                          : isCompleted
                          ? `Search for the ${new Date().getFullYear()} ${tournament.name} result${tournament.venueName ? ` at ${tournament.venueName}` : ''}${tournament.winnerName ? `. The winner was ${tournament.winnerName}${tournament.winnerScore ? ` with a score of ${tournament.winnerScore}` : ''}` : ''}. Tell me what happened, how the winner played, what the key moments were, and what this result means for their season.`
                          : `Preview the ${new Date().getFullYear()} ${tournament.name}${tournament.venueName ? ` at ${tournament.venueName}` : ''}${tournament.venueCity ? ` in ${tournament.venueCity}` : ''}${tournament.purse ? `. Purse is $${((tournament.purse) / 1_000_000).toFixed(1)}M` : ''}${tournament.venuePar ? `. Par ${tournament.venuePar}` : ''}${tournament.defendingChampion ? `. Defending champion is ${tournament.defendingChampion}` : ''}. Search for the latest news, tell me who the favourites are, what type of player wins here, and what to watch this week.`
                      }
                      label={
                        isLive ? 'Ask Echo for live intel'
                        : isCompleted ? 'Ask Echo about the result'
                        : 'Ask Echo to preview this event'
                      }
                      sublabel={
                        isLive ? 'Leaderboard insight · who to watch'
                        : isCompleted ? 'Winner story · key moments'
                        : 'Favourites · course intel · storylines'
                      }
                      source={`tour_hub_${isLive ? 'live' : isCompleted ? 'completed' : 'upcoming'}`}
                    />
                  </div>

                  </div>
                  {/* ── FOOTER — View Tournament pill only, right-aligned. paddingBottom reserves space for absolute pill rail (~80px) ── */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 18px 90px' }}>
                    <Link
                      {...(() => { const t = tournamentRoute(tournament.id, { kind: 'overview' }); return { to: t.to, state: t.state }; })()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(255,255,255,0.09)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 20, padding: '7px 14px',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                        textDecoration: 'none',
                      }}
                      className="active:opacity-70 transition-opacity"
                    >
                      View Tournament
                      <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.6)' }} />
                    </Link>
                  </div>
                </motion.div>
              )}

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
}

export function HeroCarousel({
  hasHeader = false,
  onScorecardStateChange,
  mode = 'schedule',
  activeTournamentId,
  onActiveChange,
  autoRotate = true,
}: HeroCarouselProps) {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  const rawSlides = Array.isArray(slides) ? slides : [];
  const safeSlides = mode === 'overview'
    ? rawSlides.filter((s) => s.type !== 'upcoming')
    : rawSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [autoAdvanceKey, setAutoAdvanceKey] = useState(0);
  const resetAutoAdvance = () => setAutoAdvanceKey(k => k + 1);
  const [isExpanded, setIsExpanded] = useState(false);

  // Phase A — sync external activeTournamentId → internal currentIndex (one-way, parent-driven)
  useEffect(() => {
    if (!activeTournamentId || safeSlides.length === 0) return;
    const idx = safeSlides.findIndex(s => s.tournament.id === activeTournamentId);
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTournamentId, safeSlides.length]);

  // Phase A — emit currentIndex changes upward (so the Ticker's "NOW SHOWING" follows auto-rotate / swipe)
  useEffect(() => {
    if (!onActiveChange) return;
    const slide = safeSlides[currentIndex];
    if (slide && slide.tournament.id !== activeTournamentId) {
      onActiveChange(slide.tournament.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, safeSlides.length]);

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

  // Auto-advance every 12 seconds, resets on user interaction.
  // Phase A — `autoRotate` prop allows the parent (OverviewPageV3) to terminally pause
  // rotation when the user explicitly picks a tournament from the Ticker.
  useEffect(() => {
    if (!autoRotate || safeSlides.length <= 1 || isPaused || isExpanded) return;

    const interval = setInterval(() => {
      if (isScorecardOpenRef.current) return;
      setCurrentIndex(prev => (prev + 1) % safeSlides.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [safeSlides.length, isPaused, isExpanded, autoAdvanceKey, autoRotate]);

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
            onScorecardOpen={() => {
              isScorecardOpenRef.current = true;
              setIsPaused(true);
              if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
              onScorecardStateChange?.(true);
            }}
            onScorecardClose={() => {
              isScorecardOpenRef.current = false;
              scheduleResume();
              onScorecardStateChange?.(false);
            }}
            onCardTouchStart={handleTouchStart}
            onCardTouchMove={handleTouchMove}
            onCardTouchEnd={handleTouchEnd}
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

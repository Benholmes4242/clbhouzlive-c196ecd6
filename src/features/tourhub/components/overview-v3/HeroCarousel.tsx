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

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trophy, Menu } from 'lucide-react';
import { openTourNav } from '../../contexts/TourNavContext';
import { cn } from '@/lib/utils';
import { 
  useHeroCarouselData,
  type HeroSlide as CarouselSlide,
  type HeroTournament,
} from '../../hooks/useHeroCarouselData';
import { useTournamentTopLeaders, TOUR_CONFIG, type LeaderEntry } from '../../hooks/useOverviewData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';

import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { formatThruDisplay } from '../../utils/formatThruDisplay';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { getScoreColor, getFinishedScoreColor, formatPurse, PlayerAvatar, PodiumRunnerRow, buildPodiumRows, WinnerStatsPanel } from '../shared/TourHeroHelpers';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import '@/styles/hero-glass.css';

function getStartLabel(date: string): string {
  const startDate = new Date(date);
  if (isToday(startDate)) return 'Today';
  if (isTomorrow(startDate)) return 'Tomorrow';
  const days = differenceInDays(startDate, new Date());
  if (days <= 7) return `In ${days} days`;
  return format(startDate, 'MMM d');
}

function getScoreClass(score: number): string {
  if (score < 0) return 'score-under';
  if (score > 0) return 'score-over';
  return 'score-even';
}

// Skeleton rows for loading state
function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-container mt-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="leaderboard-row flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 bg-white/10 rounded animate-pulse" />
            <div className="w-24 h-3 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="w-8 h-3 bg-white/10 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Mini leaderboard row for live tournaments
interface LeaderboardRowProps {
  leader: LeaderEntry;
  isFirst: boolean;
  index: number;
  isActive: boolean;
  isLeader: boolean;
  hasTiedLeaders: boolean;
  showTieBefore: boolean;
  scoreFlash?: 'birdie' | 'bogey' | null;
  positionDelta?: number;
}

function MiniLeaderboardRow({ leader, isFirst, index, isActive, isLeader, hasTiedLeaders, showTieBefore, scoreFlash, positionDelta = 0 }: LeaderboardRowProps) {
  const navigate = useNavigate();
  const abbreviatedName = `${leader.player.firstName[0]}. ${leader.player.lastName}`;
  const photoUrl = resolvePhotoUrl(leader.player.photoUrl ?? null, leader.player.pgaTourId);
  const initials = `${leader.player.firstName[0]}${leader.player.lastName[0]}`.toUpperCase();
  
  const handlePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tourhub/player/${leader.player.id}`);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.35, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "leaderboard-row flex items-center justify-between",
          !isFirst && !showTieBefore && "border-t border-white/[0.04]",
          isLeader && "leader-row-highlight"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="leaderboard-position flex-shrink-0">
            {leader.position}
          </span>
          {/* Player headshot + name — tappable to profile */}
          <button
            onClick={handlePlayerTap}
            className="flex items-center gap-2 min-w-0 active:opacity-70 transition-opacity"
          >
            <div
              className="overflow-hidden flex-shrink-0 border border-white/10"
              style={{
                width: '32px',
                height: '33px',
                borderRadius: '34%',
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={abbreviatedName}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/60 text-[10px] font-semibold">{initials}</div>
              )}
            </div>
            <span className={cn("leaderboard-name truncate", isFirst && "font-bold")}>
              {abbreviatedName}
            </span>
          </button>
        </div>
        {/* Thru indicator */}
        <span className="leaderboard-thru flex-shrink-0">
          {formatThruDisplay(leader.thru, leader.round_1, leader.round_2, leader.round_3, leader.round_4, leader.status, leader.thruUpdatedAt, leader.tournamentTimezone)}
        </span>
        <span className={cn(
          "leaderboard-score flex-shrink-0",
          getScoreClass(leader.scoreToPar),
          scoreFlash === 'birdie' && 'score-flash-birdie',
          scoreFlash === 'bogey' && 'score-flash-bogey',
        )}>
          {leader.scoreDisplay}
        </span>
        {positionDelta > 0 && (
          <span className="movement-up">▲{positionDelta}</span>
        )}
        {positionDelta < 0 && (
          <span className="movement-down">▼{Math.abs(positionDelta)}</span>
        )}
      </motion.div>
    </>
  );
}

// Individual slide component with venue image
interface HeroSlideProps {
  slide: CarouselSlide;
  isActive: boolean;
  totalSlides: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  leadersWinnersMap?: Map<string, import('../../hooks/useTournamentLeadersWinners').TournamentLeaderWinner>;
}

// Card animation variants — matches CreatorCapsule entrance/exit
const cardVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

function HeroSlide({ slide, isActive, totalSlides, currentIndex, onDotClick, leadersWinnersMap }: HeroSlideProps) {
  const { tournament, type } = slide;
  const navigate = useNavigate();
  const tourConfig = TOUR_CONFIG[tournament.tourSlug] || TOUR_CONFIG.pga;
  
  // Fetch real venue image
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  
  const isLive = type === 'live';
  const isCompleted = type === 'completed';
  const isUpcoming = type === 'upcoming';
  
  // Podium data for completed slides — position-based rows
  const podiumData = isCompleted ? leadersWinnersMap?.get(tournament.id) : undefined;
  const allFetchedData = podiumData?.allFetched ?? podiumData?.topFinishers ?? [];
  const podiumRows = buildPodiumRows(allFetchedData);
  const winnerRow = podiumRows[0];
  const runnerRows = podiumRows.slice(1);
  const podiumWinner = winnerRow?.players[0];

  const winningMargin = (() => {
    if (!winnerRow || podiumRows.length < 2) return null;
    if (winnerRow.isTied) return 'Co-winners';
    const row2 = podiumRows[1];
    if (winnerRow.sharedScore === null || row2.sharedScore === null) return null;
    const margin = row2.sharedScore - winnerRow.sharedScore;
    if (margin === 0) return 'Won in playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  const handlePlayerTap = (playerId: string | null | undefined) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

  // Fetch top 5 leaders for live tournaments only
  const { data: leaders = [], isLoading: leadersLoading } = useTournamentTopLeaders(
    isLive ? tournament.id : null
  );

  // Phase 3+4: Track previous leaders for score change & movement animations
  const prevLeadersRef = useRef<LeaderEntry[]>([]);
  const [scoreFlashes, setScoreFlashes] = useState<Record<string, 'birdie' | 'bogey'>>({});
  const [positionDeltas, setPositionDeltas] = useState<Record<string, number>>({});

  useEffect(() => {
    if (leaders.length === 0) return;
    const prev = prevLeadersRef.current;
    if (prev.length > 0) {
      const newFlashes: Record<string, 'birdie' | 'bogey'> = {};
      const newDeltas: Record<string, number> = {};
      for (const leader of leaders) {
        const prevEntry = prev.find(p => p.player.id === leader.player.id);
        if (prevEntry) {
          if (leader.scoreToPar < prevEntry.scoreToPar) newFlashes[leader.player.id] = 'birdie';
          else if (leader.scoreToPar > prevEntry.scoreToPar) newFlashes[leader.player.id] = 'bogey';
          if (leader.position !== prevEntry.position) {
            newDeltas[leader.player.id] = prevEntry.position - leader.position; // positive = moved up
          }
        }
      }
      if (Object.keys(newFlashes).length > 0) {
        setScoreFlashes(newFlashes);
        setTimeout(() => setScoreFlashes({}), 600);
      }
      if (Object.keys(newDeltas).length > 0) {
        setPositionDeltas(newDeltas);
        setTimeout(() => setPositionDeltas({}), 3000);
      }
    }
    prevLeadersRef.current = leaders;
  }, [leaders]);


  const backgroundImage = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueImage?.imageUrl;

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

  // Winner info for completed tournaments
  const winnerInfo = isCompleted && tournament.winnerName ? tournament : null;

  // Winner scorecard + season stats — only fetched for completed slides
  const { data: winnerStats } = useWinnerScorecardStats(
    isCompleted ? tournament.id : undefined,
    isCompleted ? podiumWinner?.playerId : undefined
  );
  const { data: winnerSeasonStats } = useWinnerSeasonStats(
    isCompleted ? podiumWinner?.playerId : undefined
  );

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

      {/* Legibility gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-5"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%),
            linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)
          `,
        }}
      />

      {/* Glass Card - Bottom Left — canonical Creator Capsule glass + animation spec */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            style={{ 
              position: 'absolute',
              bottom: '20px',
              left: '16px',
              top: 'auto',
              minWidth: '280px',
              maxWidth: 'min(350px, calc(100% - 32px))',
              padding: '20px 20px 14px 20px',
              // Glass spec — matches CreatorCapsule exactly
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* ─── COMPLETED: tournament name goes straight to top ─── */}
            {isCompleted ? (
              <>
                <Link to={`/tourhub/tournament/${tournament.id}`} className="block active:opacity-70 transition-opacity">
                  <h2 className="hero-tournament-name">{tournament.name}</h2>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/tourhub/courses?q=${encodeURIComponent(tournament.venueName || '')}`;
                  }}
                  className="hero-venue block active:opacity-70 transition-opacity cursor-pointer"
                >
                  {tournament.venueName}
                  {tournament.venueCity && ` · ${tournament.venueCity}`}
                </button>
              </>
            ) : (
              <>
                {/* Row 1: Status | Tour Badge (right-aligned) — live + upcoming only */}
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  {isLive ? (
                    <div className="flex items-center gap-1.5">
                      <span className="live-dot" />
                      <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#22C55E' }}>LIVE</span>
                    </div>
                  ) : isUpcoming ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const }}>
                      {getStartLabel(tournament.startDate)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'white' }}>COMPLETED</span>
                  )}
                  <div className="tour-badge">
                    <span>
                      {tournament.tourSlug === 'pga' ? 'PGA TOUR' :
                       tournament.tourSlug === 'liv' ? 'LIV GOLF' :
                       tournament.tourSlug === 'euro' ? 'DP WORLD' :
                       tournament.tourSlug === 'lpga' ? 'LPGA' :
                       tournament.tourSlug === 'champ' ? 'CHAMPIONS' :
                       'KORN FERRY'}
                    </span>
                  </div>
                </div>
                <Link to={`/tourhub/tournament/${tournament.id}`} className="block active:opacity-70 transition-opacity">
                  <h2 className="hero-tournament-name">{tournament.name}</h2>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/tourhub/courses?q=${encodeURIComponent(tournament.venueName || '')}`;
                  }}
                  className="hero-venue block active:opacity-70 transition-opacity cursor-pointer"
                >
                  {tournament.venueName}
                  {tournament.venueCity && ` · ${tournament.venueCity}`}
                </button>
              </>
            )}

            {/* ─── State-specific content — each section uses Capsule spring easing ─── */}
            <AnimatePresence mode="popLayout">

              {/* LIVE LAYOUT */}
              {isLive && (
                <motion.div
                  key="live-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Round progress */}
                  <p className="hero-meta">
                    {(() => {
                      const start = new Date(tournament.startDate);
                      const now = new Date();
                      const dayIndex = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                      const totalRounds = 4;
                      const currentRound = Math.min(dayIndex + 1, totalRounds);
                      return currentRound >= totalRounds ? 'Final Round' : `Round ${currentRound} of ${totalRounds}`;
                    })()}
                  </p>

                  {/* Mini Leaderboard */}
                  <AnimatePresence mode="wait">
                    {leadersLoading ? (
                      <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <LeaderboardSkeleton />
                      </motion.div>
                    ) : leaders.length > 0 ? (
                      <motion.div
                        key="leaders"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                        className="leaderboard-container"
                      >
                        {(() => {
                          const tiedLeaderCount = leaders.filter(l => l.position === 1).length;
                          const hasTiedLeaders = tiedLeaderCount > 1;
                          return leaders.map((leader, idx) => (
                            <MiniLeaderboardRow
                              key={`row-${leader.position}-${leader.player.id}`}
                              leader={leader}
                              isFirst={idx === 0}
                              index={idx}
                              isActive={isActive}
                              isLeader={leader.position === 1}
                              hasTiedLeaders={hasTiedLeaders}
                              showTieBefore={hasTiedLeaders && leader.position === 1 && idx > 0}
                              scoreFlash={scoreFlashes[leader.player.id] || null}
                              positionDelta={positionDeltas[leader.player.id] || 0}
                            />
                          ));
                        })()}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="starting-soon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ marginBottom: '4px' }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                          Starting Soon
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Link to={`/tourhub/tournament/${tournament.id}`} className="hero-text-cta w-full">
                    <span>See All</span>
                    <ChevronRight className="w-4 h-4 cta-chevron" />
                  </Link>
                </motion.div>
              )}

              {/* COMPLETED LAYOUT — winner spotlight */}
              {isCompleted && (
                <motion.div
                  key="completed-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Winner section */}
                  <div style={{ marginTop: 14, minHeight: 52 }}>
                    <AnimatePresence mode="wait">
                      {podiumWinner ? (
                        <motion.div
                          key="podium-winner"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                          {/* 60px photo */}
                          <button onClick={handlePlayerTap(podiumWinner.playerId)} className="transition-opacity active:opacity-70" style={{ flexShrink: 0 }}>
                            <PlayerAvatar photoUrl={podiumWinner.photoUrl} pgaTourId={podiumWinner.pgaTourId} displayName={podiumWinner.displayName} size={60} />
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Name + score */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                              <button onClick={handlePlayerTap(podiumWinner.playerId)} className="transition-opacity active:opacity-70" style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>
                                {podiumWinner.displayName}
                              </button>
                              <span style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace", fontSize: '17px', fontWeight: 700, color: getFinishedScoreColor(podiumWinner.score), flexShrink: 0 }}>
                                {podiumWinner.displayScore}
                              </span>
                            </div>
                            {/* Winning margin */}
                            {winningMargin && (
                              <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.50)', marginTop: 2, display: 'block' }}>
                                {winningMargin}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ) : winnerInfo?.winnerName ? (
                        <motion.div
                          key="fallback-winner"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                          <PlayerAvatar photoUrl={resolvePhotoUrl(winnerInfo.winnerPhotoUrl, winnerInfo.winnerPgaTourId)} displayName={winnerInfo.winnerName} size={60} />
                          <div>
                            <span style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', display: 'block' }}>{winnerInfo.winnerName}</span>
                            {winnerInfo.winnerScore && (
                              <span style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace", fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                {winnerInfo.winnerScore}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="winner-skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)', width: 200 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stats panel — tournament chips + season averages chips */}
                  <WinnerStatsPanel
                    tournamentStats={winnerStats}
                    seasonStats={winnerSeasonStats}
                  />

                  {/* Runners-up */}
                  <AnimatePresence mode="wait">
                    {runnerRows.length > 0 ? (
                      <motion.div
                        key="runners"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1], delay: 0.06 }}
                        style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}
                      >
                        {runnerRows.map(row => (
                          <PodiumRunnerRow key={row.position} row={row} onPlayerTap={handlePlayerTap} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="runners-skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}
                      >
                        <div style={{ height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
                        <div style={{ height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer: tour badge left, View Results right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <div className="tour-badge">
                      <span>
                        {tournament.tourSlug === 'pga' ? 'PGA TOUR' :
                         tournament.tourSlug === 'liv' ? 'LIV GOLF' :
                         tournament.tourSlug === 'euro' ? 'DP WORLD' :
                         tournament.tourSlug === 'lpga' ? 'LPGA' :
                         tournament.tourSlug === 'champ' ? 'CHAMPIONS' :
                         'KORN FERRY'}
                      </span>
                    </div>
                    <Link to={`/tourhub/tournament/${tournament.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
                      View Results
                      <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </Link>
                  </div>
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
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px', marginTop: '8px' }}>
                    {[
                      tournament.purse && formatPurse(tournament.purse),
                      tournament.venuePar && `PAR ${tournament.venuePar}`,
                      tournament.venueYardage && `${tournament.venueYardage.toLocaleString()} YDS`
                    ].filter(Boolean).join(' · ')}
                  </p>

                  {tournament.defendingChampion && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1], delay: 0.05 }}
                      className="flex items-center gap-2"
                      style={{ marginBottom: '12px' }}
                    >
                      <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        Defending: <span style={{ fontWeight: 700, color: 'white' }}>{tournament.defendingChampion}</span>
                      </span>
                    </motion.div>
                  )}

                  <Link to={`/tourhub/tournament/${tournament.id}`} className="hero-text-cta w-full">
                    <span>View Tournament</span>
                    <ChevronRight className="w-4 h-4 cta-chevron" />
                  </Link>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Carousel Dots - Inside card, below CTA */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-center" style={{ gap: '6px', marginTop: '8px' }}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDotClick(index);
                    }}
                    className={index === currentIndex ? "hero-dot-active" : "hero-dot-inactive"}
                  />
                ))}
              </div>
            )}
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
}

export function HeroCarousel({ hasHeader = false }: HeroCarouselProps) {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Wire up top-3 podium data for completed slides
  const completedIds = slides
    .filter(s => s.type === 'completed')
    .map(s => s.tournament.id);
  const { data: leadersWinnersMap } = useTournamentLeadersWinners(completedIds);
  
  // Touch swipe state
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = React.useRef<number>(0);

  // Auto-advance every 8 seconds (spec: 8s idle, 5s resume after touch)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Reset index when slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

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
    if (!touchStartRef.current) return;
    const deltaX = touchMoveRef.current;
    const deltaY = Math.abs(
      (e.changedTouches[0]?.clientY ?? 0) - touchStartRef.current.y
    );
    const threshold = 50;

    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
      if (deltaX < -threshold && currentIndex < slides.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (deltaX > threshold && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }

    touchStartRef.current = null;
    touchMoveRef.current = 0;
    
    setTimeout(() => setIsPaused(false), 5000);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-slate-900 animate-pulse">
        <div 
          className="absolute left-4 right-4 sm:right-auto sm:w-[360px] p-5 glass-card"
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button 
        className="absolute z-20 flex items-center justify-center"
        style={{ top: '56px', left: '16px', width: '44px', height: '44px' }}
        onClick={openTourNav}
        aria-label="Open tour menu"
      >
        <Menu 
          className="w-[22px] h-[22px]" 
          strokeWidth={2}
          style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5))' }}
        />
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
            leadersWinnersMap={leadersWinnersMap}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
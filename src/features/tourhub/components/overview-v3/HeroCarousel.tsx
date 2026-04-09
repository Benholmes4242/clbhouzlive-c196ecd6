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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';
import { 
  useHeroCarouselData,
  type HeroSlide as CarouselSlide,
  type HeroTournament,
} from '../../hooks/useHeroCarouselData';
import { useTournamentTopLeaders, type LeaderEntry } from '../../hooks/useOverviewData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { useLeaderboardRealtime } from '../../hooks/useLeaderboardRealtime';
import { ExpandedLeaderboardList, ExpandedLeaderboardSkeleton, ExpandedLeaderboardError, ExpandedLeaderboardEmpty } from './ExpandedLeaderboard';
import { PlayerScorecardCard } from '@/components/tourhub/PlayerScorecardCard';

import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import livUpcomingHero from '@/assets/liv-upcoming-hero.webp';
import tpcSanAntonioUpcoming from '@/assets/tpc-san-antonio-upcoming.webp';
import shadowCreekUpcoming from '@/assets/shadow-creek-upcoming.jpg';
import lakewoodNationalUpcoming from '@/assets/lakewood-national-upcoming.jpg';
import volvoChinaOpenUpcoming from '@/assets/tours/volvo-china-open-upcoming.jpg';
import { getTourLogo } from '../../utils/tourLogos';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import { formatThruDisplay } from '../../utils/formatThruDisplay';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { getScoreColor, getFinishedScoreColor, formatPurse, PlayerAvatar, PodiumRunnerRow, buildPodiumRows, WinnerStatsPanel, getCurrentRoundLabel as getCurrentRoundLabelShared, UpcomingCountdown } from '../shared/TourHeroHelpers';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { useLeaderScorecardStats, type LeaderStats } from '../../hooks/useLeaderScorecardStats';
import { useLeaderHoleScores } from '../../hooks/useLeaderHoleScores';
import { HoleStripWithSparkline } from './HoleStripWithSparkline';
import { RoundHistoryPills } from './RoundHistoryPills';
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

const COUNTRY_TO_FLAG: Record<string, string> = {
  'UNITED STATES': '🇺🇸', 'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'NORTHERN IRELAND': '🇬🇧',
  'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'IRELAND': '🇮🇪',
  'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦', 'JAPAN': '🇯🇵', 'SOUTH AFRICA': '🇿🇦',
  'SPAIN': '🇪🇸', 'GERMANY': '🇩🇪', 'FRANCE': '🇫🇷', 'SWEDEN': '🇸🇪',
  'NORWAY': '🇳🇴', 'DENMARK': '🇩🇰', 'SOUTH KOREA': '🇰🇷', 'CHINA': '🇨🇳',
  'THAILAND': '🇹🇭', 'NEW ZEALAND': '🇳🇿', 'ARGENTINA': '🇦🇷', 'COLOMBIA': '🇨🇴',
  'CHILE': '🇨🇱', 'ITALY': '🇮🇹', 'BELGIUM': '🇧🇪', 'AUSTRIA': '🇦🇹',
  'SWITZERLAND': '🇨🇭', 'NETHERLANDS': '🇳🇱', 'CZECH REPUBLIC': '🇨🇿', 'ZIMBABWE': '🇿🇼',
  'INDIA': '🇮🇳', 'FINLAND': '🇫🇮', 'CHINESE TAIPEI': '🇹🇼', 'VENEZUELA': '🇻🇪',
  'MEXICO': '🇲🇽', 'BRAZIL': '🇧🇷', 'PARAGUAY': '🇵🇾', 'PHILIPPINES': '🇵🇭',
  'MALAYSIA': '🇲🇾', 'SINGAPORE': '🇸🇬', 'NAMIBIA': '🇳🇦', 'PORTUGAL': '🇵🇹',
  'POLAND': '🇵🇱', 'GREECE': '🇬🇷', 'TURKEY': '🇹🇷', 'FIJI': '🇫🇯',
  'TRINIDAD AND TOBAGO': '🇹🇹', 'JAMAICA': '🇯🇲', 'BAHAMAS': '🇧🇸',
};

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

// Use shared getCurrentRoundLabel, adapting LeaderEntry[] to the expected interface
function getCurrentRoundLabel(leaders: LeaderEntry[], startDate: string): string {
  if (leaders.length > 0) {
    return getCurrentRoundLabelShared(leaders[0], startDate, leaders[0].thru);
  }
  return getCurrentRoundLabelShared(null, startDate);
}

// ── Live tie-condensing logic ──
interface LiveLeaderboardRow {
  position: number;
  players: LeaderEntry[];
  isTied: boolean;
}

function buildLiveLeaderboardRows(
  leaders: LeaderEntry[],
  maxRows: number = 4
): LiveLeaderboardRow[] {
  if (!leaders?.length) return [];
  
  const positionMap = new Map<number, LeaderEntry[]>();
  for (const leader of leaders) {
    const pos = leader.position;
    if (!positionMap.has(pos)) positionMap.set(pos, []);
    positionMap.get(pos)!.push(leader);
  }
  
  const sortedPositions = [...positionMap.keys()].sort((a, b) => a - b);
  const rows: LiveLeaderboardRow[] = [];
  for (const pos of sortedPositions) {
    if (rows.length >= maxRows) break;
    const players = positionMap.get(pos)!;
    rows.push({ position: pos, players, isTied: players.length > 1 });
  }
  return rows;
}

/** Tiny stateful avatar — renders inline PlayerSilhouette on 404 */
function MiniAvatar({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  const [err, setErr] = useState(false);
  // Reset error state when src changes (e.g. slide transition or data update)
  useEffect(() => { setErr(false); }, [src]);
  const h = Math.round(size * 1.03);
  return (
    <div
      className="overflow-hidden flex-shrink-0"
      style={{ width: size, height: h, borderRadius: '34%', border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)' }}
    >
      {err ? (
        <PlayerSilhouette size={size} />
      ) : (
        <img src={src} alt={alt} className="w-full h-full object-cover object-top" onError={() => setErr(true)} />
      )}
    </div>
  );
}

/** Leader hero strip — sticky above scrollable leaderboard in expanded live state */
function LeaderHeroStrip({
  leaderEntry,
  tourSlug,
  leaderStats,
  tournamentId,
  currentRound,
}: {
  leaderEntry: any;
  tourSlug: string;
  leaderStats: LeaderStats | null | undefined;
  tournamentId: string;
  currentRound: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  const derivedRound = [4,3,2,1].find(n =>
    leaderEntry[`round_${n}`] !== null
  ) ?? currentRound;

  const playerId = leaderEntry?.player_id ?? leaderEntry?.player?.id ?? null;
  const { data: holeScores = [] } = useLeaderHoleScores(tournamentId, playerId, derivedRound);

  const p = leaderEntry.player;
  if (!p) return null;

  const flagEmoji = COUNTRY_TO_FLAG[(p.country ?? '').toUpperCase()] ?? '';

  const fullName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
  const effectiveTourCode = p.tour_codes?.[0] ?? tourSlug ?? 'pga';
  const photoUrl = getPlayerHeadshotUrl(fullName, effectiveTourCode, p.headshot_override);
  const score = leaderEntry.score ?? 0;
  const scoreDisplay = score === 0 ? 'E' : score > 0 ? `+${score}` : `${score}`;
  const scoreColor = score < 0 ? '#F7931E' : score > 0 ? '#EF4444' : 'rgba(255,255,255,0.55)';

  const thruRaw = leaderEntry.thru;
  const thruDisplay = leaderEntry.status === 'cut' ? 'CUT'
    : leaderEntry.status === 'wd' ? 'WD'
    : thruRaw === 18 ? 'F'
    : thruRaw === 0 || thruRaw == null ? '-'
    : `${thruRaw}`;

  // Calculate today's score-to-par (round_N stores raw strokes, not to-par)
  const prevRoundsScore = [1,2,3,4]
    .filter(n => n < derivedRound)
    .reduce((sum, n) => sum + ((leaderEntry[`round_${n}`] as number | null) ?? 0), 0);
  // For R1, total score IS today's score; for R2+, subtract previous rounds' contribution
  // But since round_N is strokes and score is to-par, we need par info
  // Simpler: if only R1 played, today = score. If R2+, we can't derive today from strokes alone
  // without par. Use score directly for R1, and for R2+ check if score changes are trackable.
  // Actually: score = total_to_par. If we knew per-round par we could calc. 
  // Best approach: today = score (total to par) when R1, otherwise null (hide pill) unless we get per-round to-par data.
  // For now, show today only for R1 where today === total score.
  const todayScore = derivedRound === 1 ? score : null;
  const todayDisplay = todayScore === null ? null
    : todayScore === 0 ? 'E'
    : todayScore > 0 ? `+${todayScore}`
    : `${todayScore}`;
  const todayColor = todayScore === null ? 'rgba(255,255,255,0.55)'
    : todayScore < 0 ? '#F7931E'
    : todayScore > 0 ? '#EF4444'
    : 'rgba(255,255,255,0.55)';

  return (
    <div style={{ padding: '0 16px', flexShrink: 0 }}>
      {/* ── Leader card ── */}
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: 14, padding: '12px 14px', marginBottom: 10,
      }}>
        {/* Identity row — left/right split */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginBottom: holeScores.length > 0 ? 12 : 0,
        }}>
          {/* Left — avatar + name + thru */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 38, height: 40, borderRadius: '34%',
              border: '1.5px solid rgba(255,255,255,0.20)',
              background: 'rgba(255,255,255,0.07)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {photoUrl && !imgErr ? (
                <img src={photoUrl} alt="" onError={() => setImgErr(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <PlayerSilhouette size={24} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>
                🥇 Leader{flagEmoji ? ` · ${flagEmoji}` : ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fullName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                {thruDisplay !== '-' && thruDisplay !== 'F' && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>
                  {thruDisplay === 'F' ? 'Finished' : thruDisplay === '-' ? 'Starting soon' : `Thru ${thruDisplay}`}
                  {` · Round ${derivedRound}`}
                </span>
              </div>
            </div>
          </div>

          {/* Right — big total score + today pill + round pills */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
            <span style={{
              fontSize: 44, fontWeight: 800, lineHeight: 1,
              color: scoreColor,
              textShadow: score < 0 ? '0 0 16px rgba(247,147,30,0.35)' : score > 0 ? '0 0 16px rgba(239,68,68,0.35)' : 'none',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px',
            }}>
              {scoreDisplay}
            </span>

            {todayDisplay !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: todayScore! < 0 ? 'rgba(247,147,30,0.10)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${todayScore! < 0 ? 'rgba(247,147,30,0.20)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '2px 9px',
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.5px' }}>TODAY</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: todayColor, fontVariantNumeric: 'tabular-nums' }}>{todayDisplay}</span>
              </div>
            )}

            <div style={{ alignSelf: 'stretch' }}>
              <RoundHistoryPills
                round1={leaderEntry.round_1}
                round2={leaderEntry.round_2}
                round3={leaderEntry.round_3}
                round4={leaderEntry.round_4}
                currentRound={derivedRound}
              />
            </div>
          </div>
        </div>

        {/* Hole dots + sparkline — inside the card */}
        {holeScores.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
            <HoleStripWithSparkline
              holes={holeScores}
              totalHoles={18}
              label={`R${derivedRound} · Hole by hole`}
            />
          </div>
        )}
      </div>

    </div>
  );
}


interface LeaderboardRowProps {
  leader: LeaderEntry;
  isFirst: boolean;
  index: number;
  isActive: boolean;
  isLeader: boolean;
  scoreFlash?: 'birdie' | 'bogey' | null;
  positionDelta?: number;
  tournamentTourSlug?: string;
}

function MiniLeaderboardRow({ leader, isFirst, index, isActive, isLeader, scoreFlash, positionDelta = 0, tournamentTourSlug }: LeaderboardRowProps) {
  const abbreviatedName = `${leader.player.firstName[0]}. ${leader.player.lastName}`;
  const effectiveTourCode = leader.player.tourCode ?? tournamentTourSlug ?? 'pga';
  const photoUrl = getPlayerHeadshotUrl(leader.player.fullName, effectiveTourCode, leader.player.headshotOverride);
  
  const thruDisplay = formatThruDisplay(leader.thru, leader.round_1, leader.round_2, leader.round_3, leader.round_4, leader.status, leader.thruUpdatedAt, leader.tournamentTimezone);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "leaderboard-row flex items-center justify-between",
        isLeader && "leader-row-highlight"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="leaderboard-position flex-shrink-0">
          {leader.position}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <MiniAvatar src={photoUrl} alt={abbreviatedName} size={32} />
          <span className={cn("leaderboard-name truncate", isFirst && "font-bold")}>
            {abbreviatedName}
            {thruDisplay && (
              <span className="leaderboard-thru-inline">{thruDisplay}</span>
            )}
          </span>
        </div>
      </div>
      <span className={cn(
        "leaderboard-score flex-shrink-0 pr-2",
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
  );
}

// Condensed tie row for live leaderboard
function CondensedTieRow({ row, index, isActive, tournamentTourSlug }: { row: LiveLeaderboardRow; index: number; isActive: boolean; tournamentTourSlug?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="leaderboard-row flex items-center justify-between"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="leaderboard-position flex-shrink-0">
          T{row.position}
        </span>
        {/* Stacked avatars */}
        <div className="flex items-center flex-shrink-0">
          {row.players.slice(0, 4).map((player, i) => {
            const effectiveTourCode = player.player.tourCode ?? tournamentTourSlug ?? 'pga';
            const photoUrl = getPlayerHeadshotUrl(player.player.fullName, effectiveTourCode, player.player.headshotOverride);
            const initials = `${player.player.firstName[0]}${player.player.lastName[0]}`.toUpperCase();
            return (
              <div
                key={player.player.id}
                style={{
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: 4 - i,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <MiniAvatar src={photoUrl} alt="" size={28} />
              </div>
            );
          })}
          {row.players.length > 4 && (
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: 22, height: 22, borderRadius: '34%', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)', marginLeft: -6, position: 'relative', zIndex: 0, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}
            >
              +{row.players.length - 4}
            </div>
          )}
        </div>
        <span className="text-[11px] text-white/50 font-medium truncate">
          {row.players.length}-way tie
        </span>
      </div>
      <span className="leaderboard-score flex-shrink-0 pr-2">
        {row.players[0].scoreDisplay}
      </span>
    </motion.div>
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
    if (margin === 0) return 'Won in Playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  const handlePlayerTapNav = (playerId: string | null | undefined) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

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

  // Fetch top 5 leaders for live tournaments only
  const { data: leaders = [], isLoading: leadersLoading } = useTournamentTopLeaders(
    isLive ? tournament.id : null
  );

  // Full leaderboard — only fetched when expanded
  const { data: fullLeaderboard = [], isLoading: isLoadingFull, isError: isFullError, refetch: refetchFull } = useTourLeaderboard(
    isLive ? tournament.id : ''
  );
  
  // Realtime updates — always subscribe when live so collapsed hero stays fresh
  useLeaderboardRealtime(isLive ? tournament.id : null);

  // Body scroll lock when expanded
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

  // Touch isolation for expanded scroll area
  const handleExpandedTouch = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    onInteraction();
  }, [onInteraction]);

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
          const delta = prevEntry.position - leader.position;
          if (delta !== 0) {
            newDeltas[leader.player.id] = delta;
          }
        }
      }
      if (Object.keys(newFlashes).length > 0) {
        setScoreFlashes(newFlashes);
        setTimeout(() => setScoreFlashes({}), 600);
      }
      if (Object.keys(newDeltas).length > 0) {
        setPositionDeltas(newDeltas);
        setTimeout(() => setPositionDeltas({}), 8000);
      }
    }
    prevLeadersRef.current = leaders;
  }, [leaders, tournament.id]);

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

  // Leader scorecard stats — for the sticky leader strip in expanded live state
  const leaderId = isLive && fullLeaderboard.length > 0
    ? (fullLeaderboard[0] as any)?.player_id ?? null
    : null;
  const { data: leaderStats } = useLeaderScorecardStats(
    isLive ? tournament.id : null,
    leaderId
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
        {hasRealImage && !isLive ? (
          <img
            src={backgroundImage}
            alt={tournament.venueName || tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: isLive
                ? `radial-gradient(ellipse 120% 55% at 50% 25%, #2d5a1e 0%, #1a3a0e 45%, #0a1a05 100%)`
                : undefined,
            }}
          >
            {!isLive && (
              <div className={cn("absolute inset-0 w-full h-full bg-gradient-to-br", bgGradient)} />
            )}
          </div>
        )}
      </motion.div>

      {/* Sky tint overlay for live */}
      {isLive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
          background: 'linear-gradient(180deg, #4a7ab5 0%, #2a5a8e 35%, transparent 100%)',
          opacity: 0.55,
          pointerEvents: 'none',
          zIndex: 1,
        }}/>
      )}

      {/* Legibility gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-5"
        style={{
          background: isLive
            ? `linear-gradient(180deg,
                rgba(0,0,0,0.55) 0%,
                rgba(0,0,0,0.30) 20%,
                rgba(0,0,0,0.70) 45%,
                rgba(0,0,0,0.92) 65%,
                rgba(0,0,0,0.97) 100%)`
            : `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%),
               linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)`,
        }}
      />

      {/* Backdrop overlay when expanded — tap to collapse */}
      {isExpanded && !isLive && (
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
            style={isLive ? {
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
              bottom: isExpanded ? 16 : 20,
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
            {/* Safe area spacer */}
            {isLive && (
              <div style={{
                height: 'max(env(safe-area-inset-top, 0px), 47px)',
                flexShrink: 0,
              }} />
            )}

            {/* ─── Tournament header — hidden when scorecard is open ─── */}
            {!selectedPlayer && (
              isCompleted ? (
                <>
                  <div style={{ padding: isExpanded ? '0 20px' : undefined }}>
                    {/* Tournament name + FINAL badge + tour badge — right-aligned column */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/tourhub/tournament/${tournament.id}`} className="block active:opacity-70 transition-opacity">
                          <h2 className="hero-tournament-name" style={{ fontSize: '18px' }}>{tournament.name}</h2>
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/tourhub/courses?q=${encodeURIComponent(tournament.venueName || '')}`); }}
                          className="hero-venue block active:opacity-70 transition-opacity cursor-pointer"
                        >
                          {tournament.venueName}{tournament.venueCity && ` · ${tournament.venueCity}`}
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.55)',
                          background: 'rgba(255,255,255,0.10)',
                          border: '1px solid rgba(255,255,255,0.14)',
                          borderRadius: 20, padding: '2px 9px',
                        }}>
                          FINAL
                        </span>
                        {!tournament.isMajor && (
                        <div className="tour-badge" style={{ fontSize: 9, padding: '2px 8px' }}>
                          <span>{getTourDisplayName(tournament.tourSlug)}</span>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : isLive ? (
                /* ── Compact topbar — burger + title + tour badge ── */
                <div style={{
                  flexShrink: 0,
                  paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 10, padding: '0 16px', height: 52,
                  }}>
                    {/* Burger */}
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 3.5, cursor: 'pointer',
                      }}
                    >
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 13, height: 1.5, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }} />
                      ))}
                    </button>

                    {/* Title block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                        <span className="live-dot" style={{ width: 7, height: 7 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', letterSpacing: 1 }}>
                          LIVE · {getCurrentRoundLabel(leaders, tournament.startDate)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 17, fontWeight: 800, color: '#fff',
                        letterSpacing: -0.3, lineHeight: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {tournament.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                        {tournament.venueName}{tournament.venueCity ? ` · ${tournament.venueCity}` : ''}
                      </div>
                    </div>

                    {/* Tour badge */}
                    <div style={{
                      flexShrink: 0,
                      background: 'rgba(0,0,0,0.30)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 16, padding: '4px 10px',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>
                        {getTourDisplayName(tournament.tourSlug)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upcoming header */
                <>
                <div style={{ padding: isExpanded ? '0 20px' : undefined }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const }}>
                          Upcoming
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        {!tournament.isMajor && (
                        <div className="tour-badge">
                          <span>
                            {getTourDisplayName(tournament.tourSlug)}
                          </span>
                        </div>
                        )}
                          {tournament.startDate && tournament.endDate && (
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
                              {new Date(tournament.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {' – '}
                              {new Date(tournament.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link to={`/tourhub/tournament/${tournament.id}`} className="block active:opacity-70 transition-opacity">
                      <h2 className="hero-tournament-name">{tournament.name}</h2>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tourhub/courses?q=${encodeURIComponent(tournament.venueName || '')}`);
                      }}
                      className="hero-venue block active:opacity-70 transition-opacity cursor-pointer"
                    >
                      {tournament.venueName}
                      {tournament.venueCity && ` · ${tournament.venueCity}`}
                    </button>
                  </div>
                </>
              )
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
                  style={{ overflow: isExpanded ? 'visible' : 'hidden', flex: isExpanded ? 1 : undefined, minHeight: isExpanded ? 0 : undefined, display: isExpanded ? 'flex' : undefined, flexDirection: isExpanded ? 'column' as const : undefined }}
                >

                  {/* Expanded: Full Leaderboard or Scorecard */}
                  {isExpanded ? (
                    <AnimatePresence mode="wait">
                      {selectedPlayer ? (
                        <PlayerScorecardCard
                          key="scorecard"
                          player={selectedPlayer}
                          tournamentId={tournament.id}
                          tournamentName={tournament.name}
                          courseName={tournament.venueName || ''}
                          onBack={handleBackToLeaderboard}
                          onClose={() => {
                            setSelectedPlayer(null);
                            onToggleExpand();
                          }}
                        />
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
                            <ExpandedLeaderboardSkeleton />
                          ) : isFullError ? (
                            <ExpandedLeaderboardError onRetry={() => refetchFull()} />
                          ) : fullLeaderboard.length === 0 ? (
                            <ExpandedLeaderboardEmpty />
                          ) : (
                            <>
                              {/* Leader hero strip — sticky above scrollable list */}
                              {(() => {
                                const leaderEntry = (fullLeaderboard as any[]).find(e => e.position === 1);
                                if (!leaderEntry) return null;
                                const currentRound = [4,3,2,1].find(n => leaderEntry[`round_${n}`] !== null) ?? 1;
                                return (
                                  <LeaderHeroStrip
                                    leaderEntry={leaderEntry}
                                    tourSlug={tournament.tourSlug}
                                    leaderStats={leaderStats}
                                    tournamentId={tournament.id}
                                    currentRound={currentRound}
                                  />
                                );
                              })()}
                              <ExpandedLeaderboardList
                                entries={fullLeaderboard}
                                tourCode={tournament.tourSlug}
                                onTouchStart={handleExpandedTouch}
                                onTouchMove={handleExpandedTouch}
                                onTouchEnd={handleExpandedTouch}
                                onPlayerTap={handleScorecardTap}
                              />
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : (
                    <>
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
                              const rows = buildLiveLeaderboardRows(leaders, 4);
                              let rowIndex = 0;
                              return rows.map((row, rIdx) => {
                                const isFirst = rIdx === 0;

                                // Tied at #1 — show each individually with leader highlight
                                if (row.isTied && isFirst) {
                                  return row.players.slice(0, 2).map((player, i) => {
                                    const idx = rowIndex++;
                                    return (
                                      <MiniLeaderboardRow
                                        key={`row-${player.position}-${player.player.id}`}
                                        leader={player}
                                        isFirst={idx === 0}
                                        index={idx}
                                        isActive={isActive}
                                        isLeader={true}
                                        scoreFlash={scoreFlashes[player.player.id] || null}
                                        positionDelta={positionDeltas[player.player.id] || 0}
                                        tournamentTourSlug={tournament.tourSlug}
                                      />
                                    );
                                  });
                                }

                                // Tied chasers — condensed row
                                if (row.isTied && !isFirst) {
                                  const idx = rowIndex++;
                                  return <CondensedTieRow key={`tie-${row.position}`} row={row} index={idx} isActive={isActive} tournamentTourSlug={tournament.tourSlug} />;
                                }

                                // Single player row
                                const idx = rowIndex++;
                                return (
                                  <MiniLeaderboardRow
                                    key={`row-${row.players[0].position}-${row.players[0].player.id}`}
                                    leader={row.players[0]}
                                    isFirst={idx === 0}
                                    index={idx}
                                    isActive={isActive}
                                    isLeader={row.players[0].position === 1}
                                    scoreFlash={scoreFlashes[row.players[0].player.id] || null}
                                    positionDelta={positionDeltas[row.players[0].player.id] || 0}
                                    tournamentTourSlug={tournament.tourSlug}
                                  />
                                );
                              });
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

                      {!isExpanded && (
                        <Link to={`/tourhub/tournament/${tournament.id}`} className="hero-text-cta">
                          <span>See All</span>
                          <ChevronRight className="w-4 h-4 cta-chevron" />
                        </Link>
                      )}
                    </>
                  )}
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

                  {/* ── WINNER GLASS PANEL ── */}
                  <div style={{ marginTop: 6 }}>
                    <AnimatePresence mode="wait">
                      {podiumWinner ? (
                        <motion.div
                          key="podium-winner"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: 12,
                            padding: '10px 12px',
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Avatar — clean, no overlay */}
                            <button onClick={handlePlayerTapNav(podiumWinner.playerId)} className="transition-opacity active:opacity-70" style={{ flexShrink: 0 }}>
                              <PlayerAvatar
                                displayName={podiumWinner.displayName}
                                fullName={podiumWinner.fullName}
                                headshotOverride={podiumWinner.headshotOverride}
                                tourCode={tournament.tourSlug}
                                size={44}
                                frosted
                              />
                            </button>
                            {/* Name + margin */}
                            <div>
                              <button
                                onClick={handlePlayerTapNav(podiumWinner.playerId)}
                                className="transition-opacity active:opacity-70"
                                style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', display: 'block', textAlign: 'left' }}
                              >
                                {podiumWinner.displayName}
                              </button>
                              {winningMargin && (
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', marginTop: 2, display: 'block' }}>
                                  {winningMargin}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Trophy + Score together */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 22 }}>🏆</span>
                            <span style={{
                              fontFamily: "'JetBrains Mono','SF Mono',monospace",
                              fontSize: 26, fontWeight: 900,
                              color: podiumWinner.score < 0 ? '#4ade80' : podiumWinner.score === 0 ? 'rgba(255,255,255,0.75)' : '#f87171',
                              letterSpacing: '-0.04em',
                            }}>
                              {podiumWinner.displayScore}
                            </span>
                          </div>
                        </motion.div>
                      ) : winnerInfo?.winnerName ? (
                        <motion.div
                          key="fallback-winner"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: 12, padding: '10px 12px', marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PlayerAvatar displayName={winnerInfo.winnerName} photoUrl={winnerInfo.winnerPhotoUrl} tourCode={winnerInfo.tourSlug || 'pga'} size={44} frosted />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{winnerInfo.winnerName}</span>
                          </div>
                          {winnerInfo.winnerScore && (
                            <span style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace", fontSize: 22, fontWeight: 800, color: '#4ade80' }}>
                              {winnerInfo.winnerScore}
                            </span>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="winner-skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── STAT CHIPS — consistent with live leader strip ── */}
                  {winnerStats && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.08 }}
                      style={{ display: 'flex', gap: 4, marginBottom: 8 }}
                    >
                      {[
                        { v: winnerStats.eagles,       label: 'Eagles',  color: '#F59E0B' },
                        { v: winnerStats.birdies,      label: 'Birdies', color: '#4ade80' },
                        { v: winnerStats.pars,         label: 'Pars',    color: 'rgba(255,255,255,0.65)' },
                        { v: winnerStats.bogeys,       label: 'Bogeys',  color: '#F97316' },
                        winnerStats.doubleBogeys > 0 && { v: winnerStats.doubleBogeys, label: 'Doubles', color: '#f87171' },
                      ].filter(Boolean).map((stat: any) => (
                        <div key={stat.label} style={{
                          flex: 1, textAlign: 'center',
                          padding: '6px 2px 4px',
                          borderRadius: 7,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.v}</div>
                          <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>{stat.label}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* ── PODIUM SECTION ── */}
                  <AnimatePresence mode="wait">
                    {runnerRows.length > 0 ? (
                      <motion.div
                        key="runners"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1], delay: 0.06 }}
                      >
                        {/* Podium divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
                          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Podium</span>
                          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {runnerRows.map(row => (
                            <PodiumRunnerRow key={row.position} row={row} tourCode={tournament.tourSlug} onPlayerTap={handlePlayerTapNav} />
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="runners-skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                      >
                        <div style={{ height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
                        <div style={{ height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── FOOTER — meta + View Results pill ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 10, paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Final leaderboard
                      </span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                        {tournament.venueName || 'Tournament complete'}
                      </span>
                    </div>
                    <Link
                      to={`/tourhub/tournament/${tournament.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.13)',
                        borderRadius: 20,
                        padding: '5px 11px',
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                        textDecoration: 'none',
                      }}
                      className="active:opacity-70 transition-opacity"
                    >
                      View Results
                      <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.6)' }} />
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
                  {/* ── COURSE FACT CHIPS ── */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 10 }}>
                    {[
                      tournament.purse      && { value: formatPurse(tournament.purse),                          label: 'Purse'  },
                      tournament.venuePar   && { value: `Par ${tournament.venuePar}`,                           label: 'Course' },
                      tournament.venueYardage && { value: `${tournament.venueYardage.toLocaleString()}y`,        label: 'Yards'  },
                    ].filter(Boolean).map((chip: any) => (
                      <div key={chip.label} style={{
                        flex: 1, textAlign: 'center',
                        padding: '8px 4px 6px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                          {chip.value}
                        </div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>
                          {chip.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── LIVE COUNTDOWN ── */}
                  <UpcomingCountdown startDate={tournament.startDate} />

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
                        padding: '10px 12px',
                        marginTop: 8, marginBottom: 10,
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
                  <div style={{ padding: '0 0 10px' }}>
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

                  {/* ── FOOTER — View Tournament pill ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 4, paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Tournament info
                      </span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                        {tournament.venueName || 'Stroke play · 72 holes'}
                      </span>
                    </div>
                    <Link
                      to={`/tourhub/tournament/${tournament.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.13)',
                        borderRadius: 20,
                        padding: '5px 11px',
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
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
}

export function HeroCarousel({ hasHeader = false }: HeroCarouselProps) {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  const safeSlides = Array.isArray(slides) ? slides : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Wire up top-3 podium data for completed slides
  const completedIds = safeSlides
    .filter(s => s.type === 'completed')
    .map(s => s.tournament.id);
  const { data: leadersWinnersMap } = useTournamentLeadersWinners(completedIds);
  
  // Touch swipe state
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = React.useRef<number>(0);
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScorecardOpenRef = React.useRef(false);

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

  // Auto-advance every 8 seconds (spec: 8s idle, 5s resume after touch)
  useEffect(() => {
    if (safeSlides.length <= 1 || isPaused || isExpanded) return;
    
    const interval = setInterval(() => {
      if (isScorecardOpenRef.current) return;
      setCurrentIndex(prev => (prev + 1) % safeSlides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [safeSlides.length, isPaused, isExpanded]);

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
      } else if (deltaX > threshold && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        setIsPaused(false);
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
            onDotClick={setCurrentIndex}
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
            }}
            onScorecardClose={() => {
              isScorecardOpenRef.current = false;
              scheduleResume();
            }}
            onCardTouchStart={handleTouchStart}
            onCardTouchMove={handleTouchMove}
            onCardTouchEnd={handleTouchEnd}
          />
        ))}
      </AnimatePresence>





    </div>
  );
}
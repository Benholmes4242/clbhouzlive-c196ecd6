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
  'UNITED STATES': '🇺🇸', 'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'NORTHERN IRELAND': '🇮🇪',
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
  // derivedRound = current active round (last completed + 1, capped at 4)
  const lastCompletedRound = [4,3,2,1].find(n =>
    leaderEntry[`round_${n}`] !== null
  ) ?? 0;
  const derivedRound = lastCompletedRound === 0
    ? currentRound          // no rounds complete yet — use server-provided round
    : Math.min(lastCompletedRound + 1, 4);  // advance to next round

  const playerId = leaderEntry?.player_id ?? leaderEntry?.player?.id ?? null;
  // Primary — always fetch derivedRound (active round)
  const { data: holeScores = [] } = useLeaderHoleScores(tournamentId, playerId, derivedRound);
  // Fallback — always fetch lastCompletedRound when it exists (no conditional)
  const { data: fallbackHoleScores = [] } = useLeaderHoleScores(
    tournamentId,
    playerId,
    lastCompletedRound > 0 ? lastCompletedRound : null
  );
  // Display: prefer active round if it has data, otherwise show last completed
  const displayHoleScores = holeScores.length > 0 ? holeScores : fallbackHoleScores;
  const displayRound = holeScores.length > 0 ? derivedRound : lastCompletedRound;

  const p = leaderEntry.player;
  if (!p) return null;

  const flagEmoji = COUNTRY_TO_FLAG[(p.country ?? '').toUpperCase()] ?? '';

  const fullName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
  const effectiveTourCode = p.tour_codes?.[0] ?? tourSlug ?? 'pga';
  const photoUrl = getPlayerHeadshotUrl(fullName, effectiveTourCode, p.headshot_override);
  const score = leaderEntry.score ?? 0;
  const scoreDisplay = score === 0 ? 'E' : score > 0 ? `+${score}` : `${score}`;
  const scoreColor = score < 0 ? '#ffffff' : score > 0 ? '#EF4444' : 'rgba(255,255,255,0.55)';
  const scoreTextShadow = 'none';

  const thruRaw = leaderEntry.thru;
  const thruDisplay = leaderEntry.status === 'cut' ? 'CUT'
    : leaderEntry.status === 'wd' ? 'WD'
    : thruRaw === 18 ? 'F'
    : thruRaw === 0 || thruRaw == null ? '-'
    : `${thruRaw}`;

  // Today's score — only show when actively playing (thru 1–17)
  const isActivelyPlaying = thruRaw != null && thruRaw >= 1 && thruRaw < 18;
  const completedTotal = [1, 2, 3, 4]
    .filter(r => r < derivedRound)
    .reduce((sum, r) => {
      const s = leaderEntry[`round_${r}`] as number | null;
      return s != null ? sum + s : sum;
    }, 0);
  const todayScore = isActivelyPlaying
    ? (score != null ? score - completedTotal : null)
    : null;
  const todayDisplay = todayScore === null ? null
    : todayScore === 0 ? 'E'
    : todayScore > 0 ? `+${todayScore}`
    : `${todayScore}`;
  const todayColor = todayScore === null ? 'rgba(255,255,255,0.55)'
    : todayScore < 0 ? '#4ade80'
    : todayScore > 0 ? '#EF4444'
    : 'rgba(255,255,255,0.55)';

  return (
    <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
      {/* Leader identity — floating directly on photo */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        {/* Left — avatar + name block */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {/* Avatar — slightly larger */}
          <div style={{
            width: 60, height: 62, borderRadius: '30%',
            border: '2px solid rgba(255,255,255,0.25)',
            background: 'rgba(0,0,0,0.3)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {photoUrl && !imgErr ? (
              <img src={photoUrl} alt="" onError={() => setImgErr(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            ) : (
              <PlayerSilhouette size={28} />
            )}
          </div>
          {/* Name + meta */}
          <div style={{ paddingBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>🥇</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Leader</span>
              {flagEmoji && <span style={{ fontSize: 13 }}>{flagEmoji}</span>}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.4px', lineHeight: 1.1,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {fullName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
              {thruDisplay !== '-' && thruDisplay !== 'F' && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {thruDisplay === '-' ? 'Starting soon' : thruDisplay === 'F' ? `Round ${derivedRound}` : `Thru ${thruDisplay} · Round ${derivedRound}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right — score + today + round pills */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 58, fontWeight: 800, lineHeight: 1,
            color: '#ffffff',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px',
            textShadow: 'none',
          }}>
            {scoreDisplay}
          </span>

          {todayDisplay !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: todayScore! < 0 ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${todayScore! < 0 ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>TODAY</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: todayColor, fontVariantNumeric: 'tabular-nums' }}>{todayDisplay}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* Divider line above hole strip */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.10)', marginBottom: 14 }} />

      {/* Hole dots + sparkline */}
      {displayHoleScores.length > 0 && (
        <div style={{ paddingTop: 0 }}>
          <HoleStripWithSparkline
            holes={displayHoleScores}
            totalHoles={18}
            label={`R${displayRound} · Hole by hole`}
          />
        </div>
      )}
    </div>
  );
}

/** Rotates through co-leaders (position === 1 ties) every 5 seconds */
function RotatingLeaderStrip({
  leaderEntries,
  tourSlug,
  leaderStats,
  tournamentId,
  currentRound,
}: {
  leaderEntries: any[];
  tourSlug: string;
  leaderStats: LeaderStats | null | undefined;
  tournamentId: string;
  currentRound: number;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    if (leaderEntries.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % leaderEntries.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [leaderEntries.length]);
  useEffect(() => {
    setActiveIdx(0);
  }, [leaderEntries.length]);
  const activeEntry = leaderEntries[activeIdx] ?? leaderEntries[0];
  if (!activeEntry) return null;
  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEntry.player_id ?? activeEntry.player?.id ?? activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <LeaderHeroStrip
            leaderEntry={activeEntry}
            tourSlug={tourSlug}
            leaderStats={activeIdx === 0 ? leaderStats : null}
            tournamentId={tournamentId}
            currentRound={currentRound}
          />
        </motion.div>
      </AnimatePresence>
      {leaderEntries.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, padding: '2px 0 6px' }}>
          {leaderEntries.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                width: i === activeIdx ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIdx ? '#ffffff' : 'rgba(255,255,255,0.20)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
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

      {/* Venue photo accent — right side fade for completed slides */}
      {isCompleted && backgroundImage && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <img
            src={backgroundImage}
            alt=""
            className="absolute top-0 right-0 h-full object-cover"
            style={{ width: '45%' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #141d2e 0%, rgba(20,29,46,0.7) 50%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* Legibility gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-5"
        style={{
          background: isLive || isCompleted
            ? 'none'
            : isUpcoming
            ? `linear-gradient(180deg,
                rgba(0,0,0,0.55) 0%,
                rgba(0,0,0,0.25) 15%,
                rgba(0,0,0,0.10) 30%,
                rgba(0,0,0,0.60) 55%,
                rgba(0,0,0,0.93) 72%,
                rgba(0,0,0,0.95) 82%)`
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
              rgba(0,0,0,0.70) 0%,
              rgba(0,0,0,0.50) 12%,
              rgba(0,0,0,0.20) 28%,
              transparent 42%)`,
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

            {/* ─── Tournament header — hidden when scorecard is open ─── */}
            {!selectedPlayer && (
              isCompleted ? (
                <div style={{
                  flexShrink: 0,
                  paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 65px)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, padding: '0 16px', height: 58,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/tourhub/tournament/${tournament.id}`} className="block active:opacity-70 transition-opacity">
                        <div style={{
                          fontSize: 22, fontWeight: 800, color: '#fff',
                          letterSpacing: '-0.02em', lineHeight: 1,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                        }}>
                          {tournament.name}
                        </div>
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/tourhub/courses?q=${encodeURIComponent(tournament.venueName || '')}`); }}
                        className="active:opacity-70 transition-opacity cursor-pointer"
                        style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: 3, background: 'none', border: 'none', padding: 0, textAlign: 'left' as const }}
                      >
                        {tournament.venueName}{tournament.venueCity ? ` · ${tournament.venueCity}` : ''}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.4)' }}>
                        Final Round
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 14 }}>🏆</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: 1 }}>
                          FINAL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isLive ? (
                /* ── Compact topbar — tournament name left, round + LIVE right ── */
                <div style={{
                  flexShrink: 0,
                  paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 65px)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, padding: '0 16px', height: 58,
                  }}>

                    {/* Left — tournament name + venue, full width */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 22, fontWeight: 700, color: '#fff',
                        letterSpacing: -0.3, lineHeight: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {tournament.name}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                        {tournament.venueName}{tournament.venueCity ? ` · ${tournament.venueCity}` : ''}
                      </div>
                    </div>

                    {/* Right — round label stacked above LIVE pill */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 500, letterSpacing: '0.8px',
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        {getCurrentRoundLabel(leaders, tournament.startDate)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span className="live-dot" style={{ width: 6, height: 6 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', letterSpacing: 1 }}>
                          LIVE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isUpcoming ? (
                <>
                  <div style={{
                    flexShrink: 0,
                    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 65px)',
                  }}>
                    <div style={{ padding: '0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.50)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            Upcoming · {getTourDisplayName(tournament.tourSlug)}
                          </span>
                        </div>
                        {tournament.startDate && tournament.endDate && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>
                            {new Date(tournament.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {new Date(tournament.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <Link to={`/tourhub/tournament/${tournament.id}`} className="block active:opacity-70 transition-opacity">
                        <h2 style={{
                          fontSize: 30, fontWeight: 900, color: '#fff',
                          letterSpacing: -0.6, lineHeight: 1.05, margin: 0,
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
                        style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5, background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
                      >
                        {tournament.venueName}{tournament.venueCity && ` · ${tournament.venueCity}`}
                      </button>
                    </div>
                  </div>
                </>
              ) : null
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
                            onClose={() => {
                              setSelectedPlayer(null);
                              onToggleExpand();
                            }}
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
                            <ExpandedLeaderboardSkeleton />
                          ) : isFullError ? (
                            <ExpandedLeaderboardError onRetry={() => refetchFull()} />
                          ) : fullLeaderboard.length === 0 ? (
                            <ExpandedLeaderboardEmpty />
                          ) : (
                            <>
                              {/* Leader hero strip — rotates through co-leaders every 5s */}
                              {(() => {
                                const leaderEntries = (fullLeaderboard as any[]).filter(e => e.position === 1);
                                if (leaderEntries.length === 0) return null;
                                const firstEntry = leaderEntries[0];
                                const currentRound = [4,3,2,1].find(n => firstEntry[`round_${n}`] !== null) ?? 1;
                                return (
                                  <RotatingLeaderStrip
                                    leaderEntries={leaderEntries}
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
                                tournamentId={tournament.id}
                                defendingChampion={tournament.defendingChampion}
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

              {/* COMPLETED LAYOUT — full-bleed dark, matching live aesthetic */}
              {isCompleted && (
                <motion.div
                  key="completed-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' as const, minHeight: 0 }}
                >
                  {/* Fixed content area — winner, sparkline, stats */}
                  <div style={{ padding: '0 16px', flexShrink: 0 }}>

                      {/* ── HEADER DIVIDER ── */}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />

                      {/* ── WINNER HERO STRIP ── */}
                      <AnimatePresence mode="wait">
                        {podiumWinner ? (
                          <motion.div
                            key="winner-hero"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                          >
                            {/* Champion eyebrow with country flag */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                              <span style={{ fontSize: 12 }}>🏆</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Champion</span>
                              {podiumWinner.country && COUNTRY_TO_FLAG[podiumWinner.country.toUpperCase()] && (
                                <span style={{ fontSize: 14 }}>{COUNTRY_TO_FLAG[podiumWinner.country.toUpperCase()]}</span>
                              )}
                            </div>

                            {/* Winner identity — avatar + name left, giant score right */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minWidth: 0, flex: 1 }}>
                                <button onClick={handlePlayerTapNav(podiumWinner.playerId)} className="transition-opacity active:opacity-70" style={{ flexShrink: 0 }}>
                                  <PlayerAvatar
                                    displayName={podiumWinner.displayName}
                                    fullName={podiumWinner.fullName}
                                    headshotOverride={podiumWinner.headshotOverride}
                                    tourCode={tournament.tourSlug}
                                    size={56}
                                    frosted
                                  />
                                </button>
                                <div style={{ paddingBottom: 2, minWidth: 0 }}>
                                  <button onClick={handlePlayerTapNav(podiumWinner.playerId)} className="transition-opacity active:opacity-70" style={{ display: 'block', textAlign: 'left' as const }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                                      {podiumWinner.fullName || podiumWinner.displayName}
                                    </div>
                                  </button>
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                                    72 Holes · {tournament.venueName || 'Tournament Complete'}
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: 52, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                {podiumWinner.displayScore}
                              </span>
                            </div>

                            {/* Round history pills + winning margin chip */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                              <RoundHistoryPills
                                round1={podiumWinner.round1}
                                round2={podiumWinner.round2}
                                round3={podiumWinner.round3}
                                round4={podiumWinner.round4}
                                currentRound={5}
                                highlightFinal
                              />
                              {winningMargin && (
                                <div style={{
                                  padding: '4px 8px',
                                  borderRadius: 7,
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
                                  whiteSpace: 'nowrap' as const,
                                }}>
                                  {winningMargin.replace('Won by ', '').replace(' strokes', ' strokes').replace(' stroke', ' stroke')}
                                </div>
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
                            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
                          >
                            <PlayerAvatar displayName={winnerInfo.winnerName} photoUrl={winnerInfo.winnerPhotoUrl} tourCode={winnerInfo.tourSlug || 'pga'} size={56} frosted />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4 }}>🏆 Champion</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{winnerInfo.winnerName}</div>
                            </div>
                            {winnerInfo.winnerScore && (
                              <span style={{ fontSize: 52, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
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
                            style={{ height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 12, animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }}
                          />
                        )}
                      </AnimatePresence>

                      {/* ── SCORE PROGRESSION SPARKLINE ── */}
                      {podiumWinner && [podiumWinner.round1, podiumWinner.round2, podiumWinner.round3, podiumWinner.round4].some(r => r !== null) && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.04 }}
                          style={{ marginBottom: 14 }}
                        >
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                            Tournament · Score Progression
                          </div>
                          {(() => {
                            const rounds = [podiumWinner.round1, podiumWinner.round2, podiumWinner.round3, podiumWinner.round4].filter((r): r is number => r !== null);
                            if (rounds.length < 2) return null;
                            const cumulative = rounds.reduce<number[]>((acc, r, i) => { acc.push((acc[i - 1] ?? 0) + r); return acc; }, []);
                            const minY = Math.min(...cumulative);
                            const maxY = Math.max(...cumulative);
                            const range = maxY - minY || 1;
                            const W = 300;
                            const H = 48;
                            const pad = 4;
                            const points = cumulative.map((v, i) => ({
                              x: pad + (i / (cumulative.length - 1)) * (W - 2 * pad),
                              y: pad + ((maxY - v) / range) * (H - 2 * pad),
                            }));
                            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                            const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;
                            const last = points[points.length - 1];
                            return (
                              <div style={{ position: 'relative' }}>
                                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
                                  <defs>
                                    <linearGradient id="completed-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                    </linearGradient>
                                  </defs>
                                  <path d={areaD} fill="url(#completed-sparkline-fill)" />
                                  <path d={pathD} fill="none" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                                  <circle cx={last.x} cy={last.y} r={3.5} fill="#ffffff" stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
                                </svg>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                  {rounds.map((_, i) => (
                                    <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>R{i + 1}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}

                      {/* ── SCORECARD STATS GRID ── */}
                      {winnerStats && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.08 }}
                          style={{ display: 'flex', gap: 4, marginBottom: 14 }}
                        >
                          {[
                            { v: winnerStats.eagles, label: 'Eagles', color: '#F7931E' },
                            { v: winnerStats.birdies, label: 'Birdies', color: '#22c55e' },
                            { v: winnerStats.pars, label: 'Pars', color: '#ffffff' },
                            { v: winnerStats.bogeys, label: 'Bogeys', color: '#ef4444' },
                            { v: winnerStats.doubleBogeys, label: 'Doubles', color: '#dc2626' },
                          ].map((stat: any) => (
                            <div key={stat.label} style={{
                              flex: 1, textAlign: 'center' as const,
                              padding: '9px 4px',
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.v}</div>
                              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginTop: 3 }}>{stat.label}</div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* ── LEADERBOARD SECTION — top 10, internally scrollable ── */}
                      <AnimatePresence mode="wait">
                        {(() => {
                          const chasers = allFetchedData
                            .filter(f => f.position > (winnerRow?.position ?? 1))
                            .slice(0, 10);
                          if (chasers.length === 0) return (
                            <motion.div key="lb-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                              <div style={{ height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
                              <div style={{ height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
                            </motion.div>
                          );
                          const positionCounts = new Map<number, number>();
                          allFetchedData.forEach(f => positionCounts.set(f.position, (positionCounts.get(f.position) || 0) + 1));
                          return (
                            <motion.div
                              key="leaderboard-rows"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1], delay: 0.06 }}
                            >
                              {/* Column headers */}
                              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
                                <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}></span>
                                <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Player</span>
                                <span style={{ width: 48, textAlign: 'right' as const, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Total</span>
                                <span style={{ width: 36, textAlign: 'right' as const, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>R4</span>
                                <span style={{ width: 28, textAlign: 'right' as const, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Thru</span>
                              </div>
                              {chasers.map((p, i) => {
                                const isTied = (positionCounts.get(p.position) || 1) > 1;
                                const r4 = p.round4;
                                const r4Display = r4 == null ? '—' : r4 === 0 ? 'E' : r4 > 0 ? `+${r4}` : `${r4}`;
                                const r4Color = r4 == null ? 'rgba(255,255,255,0.3)' : r4 < 0 ? '#4ade80' : r4 > 0 ? '#ef4444' : 'rgba(255,255,255,0.35)';
                                const countryFlag = p.country ? COUNTRY_TO_FLAG[p.country.toUpperCase()] : null;
                                return (
                                  <button
                                    key={p.playerId || i}
                                    onClick={handlePlayerTapNav(p.playerId)}
                                    className="transition-opacity active:opacity-70"
                                    style={{
                                      display: 'flex', alignItems: 'center',
                                      padding: '11px 0',
                                      width: '100%',
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: i < chasers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left' as const,
                                    }}
                                  >
                                    <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                                      {isTied ? `T${p.position}` : p.position}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                      {countryFlag ? (
                                        <span style={{ fontSize: 18, flexShrink: 0 }}>{countryFlag}</span>
                                      ) : (
                                        <PlayerAvatar displayName={p.displayName} fullName={p.fullName} headshotOverride={p.headshotOverride} tourCode={tournament.tourSlug} size={24} frosted />
                                      )}
                                      <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.displayName}</span>
                                    </div>
                                    <span style={{ width: 48, textAlign: 'right' as const, fontSize: 15, fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                      {p.displayScore}
                                    </span>
                                    <span style={{ width: 36, textAlign: 'right' as const, fontSize: 13, fontWeight: 600, color: r4Color, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                      {r4Display}
                                    </span>
                                    <span style={{ width: 28, textAlign: 'right' as const, fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                                      F
                                    </span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>

                      {/* Echo */}
                      <div style={{ paddingTop: 8, paddingBottom: 10 }}>
                        <EchoContextualButton
                          prompt={`Search for the ${new Date().getFullYear()} ${tournament.name} result${tournament.venueName ? ` at ${tournament.venueName}` : ''}${podiumWinner ? `. The winner was ${podiumWinner.fullName || podiumWinner.displayName}${podiumWinner.displayScore ? ` with a score of ${podiumWinner.displayScore}` : ''}` : tournament.winnerName ? `. The winner was ${tournament.winnerName}` : ''}. Tell me what happened, how the winner played, what the key moments were, and what this result means for their season.`}
                          label="Ask Echo about the result"
                          sublabel="Winner story · key moments"
                          source="tour_hub_completed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── FOOTER ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '10px 16px 16px', flexShrink: 0,
                  }}>
                    <Link
                      to={`/tourhub/tournament/${tournament.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 20,
                        padding: '10px 20px',
                        fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                        textDecoration: 'none',
                        width: '100%',
                      }}
                      className="active:opacity-70 transition-opacity"
                    >
                      Final Leaderboard
                      <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
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
                  style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' as const }}
                >
                  {/* Main content — grows to fill */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'flex-end', padding: '0 18px' }}>
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
                  <div style={{ paddingBottom: 10 }}>
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
                  {/* ── FOOTER — View Tournament pill only, right-aligned ── */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 18px 16px' }}>
                    <Link
                      to={`/tourhub/tournament/${tournament.id}`}
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
}

export function HeroCarousel({ hasHeader = false, onScorecardStateChange }: HeroCarouselProps) {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  const safeSlides = Array.isArray(slides) ? slides : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [autoAdvanceKey, setAutoAdvanceKey] = useState(0);
  const resetAutoAdvance = () => setAutoAdvanceKey(k => k + 1);
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

  // Auto-advance every 12 seconds, resets on user interaction
  useEffect(() => {
    if (safeSlides.length <= 1 || isPaused || isExpanded) return;
    
    const interval = setInterval(() => {
      if (isScorecardOpenRef.current) return;
      setCurrentIndex(prev => (prev + 1) % safeSlides.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [safeSlides.length, isPaused, isExpanded, autoAdvanceKey]);

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





    </div>
  );
}
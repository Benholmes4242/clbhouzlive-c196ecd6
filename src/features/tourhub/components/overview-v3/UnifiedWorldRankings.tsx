/**
 * UnifiedWorldRankings v5 — Broadcast-Quality OWGR Leaderboard
 * 
 * Polish pass: Typography-led hierarchy, two-column stats,
 * tier differentiation, editorial narrative strip, clean momentum pills.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRankingMovers, useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePhotoUrl, getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_PER_PAGE = 10;

// ============================================================================
// HELPERS
// ============================================================================

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Generate a narrative strip based on ranking data */
function generateNarrative(
  rankings: any[] | undefined,
  movers: any[] | undefined
): string {
  if (!rankings?.length) return '';

  const no1 = rankings[0];
  const no1Name = no1?.player?.last_name || 'The leader';
  const no1Stable = no1?.rank_change === 0;

  const topMovers = movers?.filter(m => m.rank <= 20 && m.rankChange > 0) || [];
  const biggestMover = topMovers[0];

  if (no1Stable && biggestMover) {
    return `${no1Name} holds firm at No.1 as ${biggestMover.lastName} surges ${biggestMover.rankChange} places`;
  }
  if (!no1Stable && no1?.rank_change > 0) {
    return `${no1Name} claims the No.1 spot in this week's rankings`;
  }
  if (biggestMover && biggestMover.rankChange >= 20) {
    return `${biggestMover.lastName} rockets up ${biggestMover.rankChange} spots — biggest move of the week`;
  }
  if (no1Stable) {
    return `No.1 unchanged — ${no1Name} extends reign at the summit`;
  }
  return `${no1Name} leads the Official World Golf Ranking`;
}

// ============================================================================
// SKELETON
// ============================================================================

function SkeletonPill() {
  return (
    <div className="flex-shrink-0 flex items-center gap-2 rounded-full bg-muted animate-pulse"
      style={{ height: '36px', width: '150px' }}
    />
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center py-3 px-0" style={{ minHeight: '60px' }}>
      <div className="w-10 flex justify-center">
        <div className="h-4 w-5 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-muted animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="w-28 flex justify-end gap-4">
        <div className="h-4 w-10 rounded bg-muted animate-pulse" />
        <div className="h-4 w-10 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ============================================================================
// MOMENTUM PILL — Clean, no emojis, single baseline
// ============================================================================

interface MomentumPillProps {
  entry: {
    playerId: string;
    firstName: string;
    lastName: string;
    country: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    rank: number;
    priorRank: number | null;
    rankChange: number;
  };
  index: number;
  direction: 'up' | 'down';
  onTap: (playerId: string, rank: number) => void;
}

function MomentumPill({ entry, index, direction, onTap }: MomentumPillProps) {
  const initials = `${entry.firstName?.[0] ?? ''}${entry.lastName?.[0] ?? ''}`.toUpperCase();
  const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;
  const showInitials = !showPhoto || !imgLoaded;

  const isUp = direction === 'up';
  const absChange = Math.abs(entry.rankChange);

  return (
    <motion.button
      onClick={() => onTap(entry.playerId, entry.rank)}
      className="flex-shrink-0 rounded-xl border border-border/60 active:scale-[0.97] transition-transform"
      style={{
        padding: '6px 10px',
        scrollSnapAlign: 'start',
        background: 'hsl(var(--muted) / 0.4)',
      }}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
        <div className="flex items-center gap-1.5">
          {/* Avatar */}
          <div className="w-6 h-6 overflow-hidden flex-shrink-0 border border-border/40" style={{ borderRadius: '34%' }}>
            {showPhoto && (
              <img
                src={photoUrl}
                alt={entry.lastName}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{ display: imgLoaded ? 'block' : 'none' }}
              />
            )}
            {showInitials && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-[9px] font-bold text-muted-foreground">{initials}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="whitespace-nowrap" style={{ fontSize: '13px', fontWeight: 500, color: '#44403C' }}>{entry.lastName}</span>
            <div className="flex items-center gap-1">
              <span className="font-mono" style={{ fontSize: '10px', color: '#A8A29E' }}>#{entry.rank}</span>
              <span className="whitespace-nowrap" style={{
                fontSize: '10px',
                fontWeight: 500,
                color: isUp ? '#16A34A' : '#DC2626',
              }}>
                {isUp ? '↑' : '↓'}{isUp ? '+' : '−'}{absChange}
              </span>
            </div>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedWorldRankings() {
  const navigate = useNavigate();
  const { data: movers, isLoading: moversLoading } = useRankingMovers();
  const { data: rankings, isLoading: rankingsLoading } = useWorldRankingsFull();

  const [currentPage, setCurrentPage] = useState(0);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isLoading = moversLoading || rankingsLoading;

  const totalPlayers = rankings?.length || 0;
  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);

  const startIndex = currentPage * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalPlayers);
  const currentPagePlayers = rankings?.slice(startIndex, endIndex) || [];

  const no1TotalPoints = rankings?.[0]?.total_points ?? 0;

  const moverPlayerIds = useMemo(() => new Set(movers?.map(m => m.playerId) || []), [movers]);
  const upwardMovers = useMemo(() => (movers || []).filter(m => m.rankChange > 0), [movers]);
  const downwardMovers = useMemo(() => {
    const downs = (movers || []).filter(m => m.rankChange < 0);
    // Sort by largest drop first (most negative rankChange)
    return [...downs].sort((a, b) => a.rankChange - b.rankChange).slice(0, upwardMovers.length || 10);
  }, [movers, upwardMovers.length]);
  const narrative = useMemo(() => generateNarrative(rankings, movers), [rankings, movers]);

  useEffect(() => {
    if (highlightedPlayerId) {
      const timer = setTimeout(() => setHighlightedPlayerId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightedPlayerId]);

  const goToPrevPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); };

  const handleMoverTap = useCallback((playerId: string, rank: number) => {
    const playerPage = Math.floor((rank - 1) / PLAYERS_PER_PAGE);
    setCurrentPage(playerPage);
    setTimeout(() => {
      setHighlightedPlayerId(playerId);
      const el = rowRefs.current.get(playerId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const setRowRef = useCallback((playerId: string, element: HTMLDivElement | null) => {
    if (element) rowRefs.current.set(playerId, element);
    else rowRefs.current.delete(playerId);
  }, []);

  // Dot pagination
  const maxVisibleDots = 6;
  const getVisibleDotRange = () => {
    if (totalPages <= maxVisibleDots) return { start: 0, end: totalPages };
    const half = Math.floor(maxVisibleDots / 2);
    let start = currentPage - half;
    let end = currentPage + half;
    if (start < 0) { start = 0; end = maxVisibleDots; }
    else if (end >= totalPages) { end = totalPages; start = totalPages - maxVisibleDots; }
    return { start, end };
  };
  const dotRange = getVisibleDotRange();

  // ── Loading ──
  if (isLoading) {
    return (
      <motion.section
        className="mt-10 px-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-0.5">
          <div className="h-5 w-52 rounded bg-muted animate-pulse" />
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-40 rounded bg-muted animate-pulse mb-3" />
        <div className="border-b border-border/10 mb-5" />
        <div className="h-4 w-36 rounded bg-muted animate-pulse mb-3" />
        <div className="flex gap-2 overflow-hidden mb-6">
          {[1, 2, 3, 4].map(i => <SkeletonPill key={i} />)}
        </div>
        {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
      </motion.section>
    );
  }

  if (!rankings?.length) return null;

  const hasMovers = upwardMovers.length > 0;

  return (
    <motion.section
      className="mt-10 px-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ═══ 1. Section Header ═══ */}
      <div className="flex items-start justify-between mb-0.5">
        <h2 className="text-[16px] tracking-tight leading-snug" style={{ fontWeight: 600, color: '#1C1917' }}>
          Official World Golf Ranking
        </h2>
        <button
          onClick={() => navigate('/tourhub?tab=players')}
          className="flex items-center gap-0.5 active:scale-95 transition-transform mt-1"
          style={{ fontSize: '13px', fontWeight: 500, color: '#EA580C' }}
        >
          View All
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight mb-2.5">
        Updated weekly · Official OWGR data
      </p>
      <div className="border-b mb-4" style={{ borderColor: 'hsl(var(--border) / 0.1)' }} />


      {/* ═══ 3. This Week's Momentum + Biggest Drops ═══ */}
      {hasMovers && (
        <div className="mb-5 space-y-4">
          {/* Up movers */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1917' }}>This Week's Momentum</span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
            >
              {upwardMovers.map((entry, idx) => (
                <MomentumPill key={entry.playerId} entry={entry} index={idx} direction="up" onTap={handleMoverTap} />
              ))}
            </div>
          </div>

          {/* Down movers */}
          {downwardMovers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1917' }}>Biggest Fallers This Week</span>
              </div>
              <div
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
              >
                {downwardMovers.map((entry, idx) => (
                  <MomentumPill key={entry.playerId} entry={entry} index={idx} direction="down" onTap={handleMoverTap} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 4. Leaderboard ═══ */}
      <div>
        {/* Two-column stat headers */}
        <div className="flex items-center pb-2" style={{ borderBottom: '1px solid hsl(var(--border) / 0.1)' }}>
          <div className="w-10 flex-shrink-0 text-center uppercase" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.05em', color: '#A8A29E' }}>
            #
          </div>
          <div className="flex-1 min-w-0 uppercase" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.05em', color: '#A8A29E' }}>
            Player
          </div>
          <div className="w-16 flex-shrink-0 text-right uppercase" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.05em', color: '#A8A29E' }}>
            Avg Pts
          </div>
          <div className="w-16 flex-shrink-0 text-right uppercase" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.05em', color: '#A8A29E' }}>
            Total Pts
          </div>
        </div>

        {/* ═══ 5–8. Player Rows ═══ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {currentPagePlayers.map((entry, index) => {
              const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
              const isHighlighted = highlightedPlayerId === entry.player.id;
              const isMover = moverPlayerIds.has(entry.player.id);

              // Tier logic
              const isCrown = entry.rank === 1;
              const isElite = entry.rank >= 2 && entry.rank <= 3;
              const isContender = entry.rank >= 4 && entry.rank <= 10;

              // Chase the Crown (ranks 2-5 only, based on TOTAL points)
              const showChase = entry.rank >= 2 && entry.rank <= 5 && no1TotalPoints > 0 && entry.total_points;
              const ptsToNo1 = showChase ? ((entry.total_points || 0) - no1TotalPoints).toFixed(1) : null;

              // Row background — subtle tier differentiation
              let rowBg = 'transparent';
              if (isCrown) rowBg = 'hsl(45 93% 47% / 0.04)';
              if (isHighlighted) rowBg = 'hsl(var(--primary) / 0.04)';

              // Velocity arrow
              const rankChange = entry.rank_change;

              // Avatar
              const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`.toUpperCase();
              const photoUrl = entry.player.pga_tour_id
                ? getPgaTourHeadshotUrl(entry.player.pga_tour_id)
                : null;

              return (
                <motion.div
                  key={entry.player.id}
                  ref={(el) => setRowRef(entry.player.id, el)}
                  className="flex items-center cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    padding: '10px 0',
                    minHeight: '60px',
                    borderBottom: '1px solid hsl(var(--border) / 0.08)',
                    borderLeft: isMover ? '3px solid hsl(142 76% 36%)' : '3px solid transparent',
                    background: rowBg,
                  }}
                >
                  {/* ── Rank + velocity arrow ── */}
                  <div className="w-10 flex-shrink-0 flex flex-col items-center gap-0.5">
                    <span className="font-mono" style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isCrown ? '#EA580C' : '#1C1917',
                    }}>
                      {entry.rank}
                    </span>
                    {/* Bolder, larger velocity arrows */}
                    {rankChange > 0 ? (
                      <span className="text-[11px] font-extrabold text-emerald-700">↑</span>
                    ) : rankChange < 0 ? (
                      <span className="text-[11px] font-extrabold text-red-500">↓</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30 font-bold">—</span>
                    )}
                  </div>

                  {/* ── Avatar + name (no rank badge overlay) ── */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <PlayerAvatar photoUrl={photoUrl} initials={initials} fullName={fullName} />

                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate leading-tight"
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1C1917',
                        }}
                      >
                        {fullName}
                      </div>
                      {/* Flag + country inline on same line */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <CountryFlag country={entry.player.country} size="sm" />
                        <span className="truncate leading-none" style={{ fontSize: '11px', fontWeight: 400, color: '#A8A29E' }}>
                          {formatCountryName(entry.player.country)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Two-column stats: Avg Pts | Total Pts ── */}
                  <div className="flex items-start gap-0 flex-shrink-0">
                    {/* Column 1: AVG PTS (primary, bold) */}
                    <div className="w-16 text-right">
                      <div className="font-mono" style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: isCrown ? '#EA580C' : '#44403C',
                      }}>
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </div>
                    </div>

                    {/* Column 2: TOTAL PTS (secondary, muted) */}
                    <div className="w-16 text-right">
                      <div className="font-mono" style={{ fontSize: '13px', fontWeight: 500, color: '#44403C' }}>
                        {entry.total_points
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 })
                          : '—'}
                      </div>
                      {/* Chase the Crown — ranks 2-5 only, based on total pts gap */}
                      {showChase && ptsToNo1 && (
                        <div className="text-[9px] text-muted-foreground/60 font-medium mt-0.5 whitespace-nowrap">
                          {ptsToNo1} to #1
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ 9. Pagination ═══ */}
      {totalPages > 1 && (
        <div className="pt-3 pb-1">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-border/60 bg-card active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: dotRange.end - dotRange.start }).map((_, i) => {
                const dotIndex = dotRange.start + i;
                const isActive = dotIndex === currentPage;
                return (
                  <button
                    key={dotIndex}
                    onClick={() => setCurrentPage(dotIndex)}
                    className="transition-all duration-300"
                    style={{
                      height: '4px',
                      width: isActive ? '16px' : '4px',
                      borderRadius: '2px',
                      background: isActive
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--muted-foreground) / 0.15)',
                    }}
                  />
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-border/60 bg-card active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          <p className="text-center text-[10px] font-medium text-muted-foreground/50 mt-1.5 font-mono">
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </div>
      )}
    </motion.section>
  );
}

// ============================================================================
// PlayerAvatar — Photo only when loaded, initials as true fallback (no layering)
// ============================================================================

function PlayerAvatar({ photoUrl, initials, fullName }: { photoUrl: string | null; initials: string; fullName: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;

  return (
    <div
      className="overflow-hidden border border-border/50 flex-shrink-0"
      style={{ width: '44px', height: '44px', borderRadius: '13px' }}
    >
      {showPhoto && (
        <img
          src={photoUrl}
          alt={fullName}
          className="w-full h-full object-cover"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{ display: imgLoaded ? 'block' : 'none' }}
        />
      )}
      {/* Show initials ONLY when no photo or photo hasn't loaded */}
      {(!showPhoto || !imgLoaded) && (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-xs font-bold text-muted-foreground">{initials}</span>
        </div>
      )}
    </div>
  );
}

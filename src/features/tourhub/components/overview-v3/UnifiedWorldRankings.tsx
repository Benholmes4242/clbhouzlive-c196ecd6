/**
 * UnifiedWorldRankings v4 - Broadcast-Style OWGR Leaderboard
 * 
 * Design: Card-free, page-level section with PGA broadcast energy.
 * Features: Momentum pill strip, tiered hierarchy, Chase the Crown,
 * narrative strip, rank velocity arrows, broadcast pagination.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
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

  // Check if #1 changed
  const no1Stable = no1?.rank_change === 0;

  // Find biggest mover in top 10
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
      style={{ height: '40px', width: '150px' }}
    />
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div className="flex items-center py-3 px-0" style={{ minHeight: '60px' }}>
      <div className="w-9 flex justify-center">
        <div className="h-4 w-5 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="w-16 flex justify-end">
        <div className="h-4 w-12 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ============================================================================
// MOMENTUM PILL — Compact, card-free
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
  onTap: (playerId: string, rank: number) => void;
}

function MomentumPill({ entry, index, onTap }: MomentumPillProps) {
  const initials = `${entry.firstName?.[0] ?? ''}${entry.lastName?.[0] ?? ''}`.toUpperCase();
  const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
  const isRocket = entry.rankChange >= 30;

  return (
    <motion.button
      onClick={() => onTap(entry.playerId, entry.rank)}
      className="flex-shrink-0 flex items-center gap-2 rounded-full bg-muted/60 border border-border active:scale-[0.97] transition-transform"
      style={{ padding: '6px 12px 6px 6px', scrollSnapAlign: 'start' }}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-border">
        {photoUrl ? (
          <img src={photoUrl} alt={entry.lastName} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">{entry.lastName}</span>

      {/* Rank (muted) */}
      <span className="text-[11px] text-muted-foreground font-mono">#{entry.rank}</span>

      {/* Movement badge */}
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
        {isRocket && <span className="text-[10px]">🚀</span>}
        <span>↑{entry.rankChange}</span>
      </span>
    </motion.button>
  );
}

// ============================================================================
// RANK BADGE (tiered)
// ============================================================================

function RankBadge({ rank }: { rank: number }) {
  // Crown tier
  if (rank === 1) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center justify-center"
        style={{
          width: '20px', height: '20px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #C1A84C 0%, #DAC06A 100%)',
          color: 'white', fontSize: '10px', fontWeight: 700,
          border: '1.5px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        👑
      </div>
    );
  }
  // Elite tier (2-3)
  if (rank <= 3) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center justify-center"
        style={{
          width: '20px', height: '20px', borderRadius: '7px',
          background: rank === 2
            ? 'linear-gradient(135deg, #A5A5A5 0%, #C0C0C0 100%)'
            : 'linear-gradient(135deg, #B08D57 0%, #CD9B5A 100%)',
          color: 'white', fontSize: '10px', fontWeight: 700,
          border: '1.5px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        {rank}
      </div>
    );
  }
  // Contender tier (4-10) — slightly elevated
  if (rank <= 10) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center justify-center bg-[#C1A84C]/10 text-[#C1A84C]"
        style={{
          width: '20px', height: '20px', borderRadius: '7px',
          fontSize: '10px', fontWeight: 700,
          border: '1.5px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {rank}
      </div>
    );
  }
  // Standard
  return (
    <div className="absolute -top-1 -right-1 flex items-center justify-center bg-muted text-muted-foreground"
      style={{
        width: '20px', height: '20px', borderRadius: '7px',
        fontSize: '10px', fontWeight: 700,
        border: '1.5px solid white',
      }}
    >
      {rank}
    </div>
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

  // No.1's avg points for "Chase the Crown"
  const no1AvgPoints = rankings?.[0]?.avg_points ?? 0;

  const moverPlayerIds = useMemo(() => new Set(movers?.map(m => m.playerId) || []), [movers]);

  // Only upward movers for momentum strip
  const upwardMovers = useMemo(() => (movers || []).filter(m => m.rankChange > 0), [movers]);

  const narrative = useMemo(() => generateNarrative(rankings, movers), [rankings, movers]);

  // Clear highlight
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

  // Dot pagination (max 6)
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
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-1">
          <div className="h-5 w-52 rounded bg-muted animate-pulse" />
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="border-b border-border/40 mb-5" />

        {/* Momentum skeleton */}
        <div className="h-4 w-36 rounded bg-muted animate-pulse mb-3" />
        <div className="flex gap-2 overflow-hidden mb-6">
          {[1, 2, 3, 4].map(i => <SkeletonPill key={i} />)}
        </div>

        {/* Table skeleton */}
        {[...Array(10)].map((_, i) => <SkeletonRow key={i} index={i} />)}
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
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-foreground text-[17px] font-semibold tracking-tight">
          Official World Golf Ranking
        </h2>
        <button
          onClick={() => navigate('/tourhub?tab=players')}
          className="flex items-center gap-0.5 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider active:scale-95 transition-transform"
        >
          View All
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Updated weekly · Official OWGR data
      </p>
      <div className="border-b border-border/40 mb-5" />

      {/* ── Narrative Strip ── */}
      {narrative && (
        <p className="text-[13px] text-muted-foreground italic mb-5 leading-relaxed">
          "{narrative}"
        </p>
      )}

      {/* ── This Week's Momentum ── */}
      {hasMovers && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-[13px] font-semibold text-foreground">This Week's Momentum</span>
          </div>
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
          >
            {upwardMovers.map((entry, idx) => (
              <MomentumPill key={entry.playerId} entry={entry} index={idx} onTap={handleMoverTap} />
            ))}
          </div>
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div>
        {/* Table header */}
        <div className="flex items-center pb-2 border-b border-border/40">
          <div className="w-8 flex-shrink-0 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            #
          </div>
          <div className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Player
          </div>
          <div className="w-[72px] flex-shrink-0 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Avg Pts
          </div>
        </div>

        {/* Rows */}
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

              // Chase the Crown (ranks 2-5)
              const showChase = entry.rank >= 2 && entry.rank <= 5 && no1AvgPoints > 0 && entry.avg_points;
              const ptsToNo1 = showChase ? (no1AvgPoints - (entry.avg_points || 0)).toFixed(1) : null;

              // Row background
              let rowBgClass = 'bg-transparent';
              if (isCrown) rowBgClass = 'bg-[#C1A84C]/[0.04]';
              if (isHighlighted) rowBgClass = 'bg-primary/[0.04]';

              // Velocity arrow
              const rankChange = entry.rank_change;

              return (
                <motion.div
                  key={entry.player.id}
                  ref={(el) => setRowRef(entry.player.id, el)}
                  className={cn(
                    'flex items-center cursor-pointer active:scale-[0.98] transition-transform',
                    rowBgClass,
                  )}
                  onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    padding: '10px 0',
                    minHeight: '58px',
                    borderBottom: '1px solid hsl(var(--border) / 0.3)',
                    borderLeft: isMover ? '3px solid hsl(142 76% 36%)' : '3px solid transparent',
                  }}
                >
                  {/* Rank + velocity */}
                  <div className="w-8 flex-shrink-0 flex flex-col items-center gap-0.5">
                    <span className={cn(
                      'text-xs font-bold font-mono',
                      isCrown ? 'text-[#C1A84C]' :
                      isElite ? 'text-foreground' :
                      isContender ? 'text-foreground/80' :
                      'text-muted-foreground'
                    )}>
                      {entry.rank}
                    </span>
                    {/* Velocity arrow */}
                    {rankChange > 0 ? (
                      <span className="text-[9px] font-bold text-emerald-700">↑</span>
                    ) : rankChange < 0 ? (
                      <span className="text-[9px] font-bold text-red-500">↓</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/40">—</span>
                    )}
                  </div>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className="overflow-hidden border border-border/60"
                        style={{ width: '38px', height: '38px', borderRadius: '11px' }}
                      >
                        {(() => {
                          const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`.toUpperCase();
                          const photoUrl = entry.player.pga_tour_id
                            ? getPgaTourHeadshotUrl(entry.player.pga_tour_id)
                            : null;
                          return (
                            <div className="relative w-full h-full">
                              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <span className="text-[11px] font-bold text-muted-foreground">{initials}</span>
                              </div>
                              {photoUrl && (
                                <img
                                  src={photoUrl}
                                  alt={fullName}
                                  className="relative z-10 w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <RankBadge rank={entry.rank} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'truncate text-[14px] font-semibold leading-tight',
                          isCrown || isElite ? 'text-foreground' : 'text-foreground/90'
                        )}
                      >
                        {fullName}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
                          <CountryFlag country={entry.player.country} size="sm" />
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {formatCountryName(entry.player.country)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points — stacked */}
                  <div className="w-[72px] flex-shrink-0 text-right">
                    <div
                      className={cn(
                        'font-mono text-[13px] font-bold',
                        isCrown ? 'text-[#C1A84C]' : 'text-foreground'
                      )}
                    >
                      {entry.avg_points?.toFixed(2) ?? '—'}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {entry.total_points
                        ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 })
                        : '—'}
                    </div>
                    {/* Chase the Crown */}
                    {showChase && ptsToNo1 && (
                      <div className="text-[9px] text-muted-foreground/70 font-medium mt-0.5">
                        −{ptsToNo1} to #1
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Broadcast Pagination ── */}
      {totalPages > 1 && (
        <div className="pt-4 pb-1">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: dotRange.end - dotRange.start }).map((_, i) => {
                const dotIndex = dotRange.start + i;
                const isActive = dotIndex === currentPage;
                return (
                  <button
                    key={dotIndex}
                    onClick={() => setCurrentPage(dotIndex)}
                    className="transition-all duration-300"
                    style={{
                      height: '5px',
                      width: isActive ? '18px' : '5px',
                      borderRadius: '3px',
                      background: isActive
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--muted-foreground) / 0.2)',
                    }}
                  />
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <p className="text-center text-[11px] font-medium text-muted-foreground/60 mt-2 font-mono">
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </div>
      )}
    </motion.section>
  );
}

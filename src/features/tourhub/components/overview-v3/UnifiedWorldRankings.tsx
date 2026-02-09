/**
 * UnifiedWorldRankings v4 - Page-level OWGR Leaderboard
 * 
 * Design: Card-free, rendered directly on page background.
 * Professional → Slick → Informative → Gamified (in that order).
 * 
 * Features:
 * - No outer card — page-level section
 * - Editorial narrative strip (data-driven)
 * - Momentum pill strip (horizontal scroll, no cards)
 * - Tiered hierarchy: Crown (#1), Elite (#2-3), Contender (#4-10)
 * - Rank velocity arrows per row
 * - "Chase the Crown" pts-to-#1 for ranks 2-5
 * - Stacked Avg/Total pts (modern, not spreadsheet)
 * - Broadcast-style pagination
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';
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

/** Generate an editorial narrative from live data */
function generateNarrative(
  rankings: Array<{ rank: number; rank_change: number; avg_points: number | null; player: { first_name: string; last_name: string } }> | undefined,
  movers: Array<{ lastName: string; rankChange: number; rank: number }> | undefined,
): string {
  if (!rankings?.length) return '';

  const no1 = rankings[0];
  const no1Name = no1.player.last_name;
  const no1Stable = no1.rank_change === 0;

  // Find biggest mover in top 20
  const topMovers = (movers || []).filter(m => m.rank <= 50).sort((a, b) => b.rankChange - a.rankChange);
  const biggestMover = topMovers[0];

  // Check if top-5 reshuffled
  const top5Changes = rankings.slice(0, 5).filter(r => r.rank_change !== 0);

  if (biggestMover && biggestMover.rankChange >= 30) {
    if (no1Stable) {
      return `${no1Name} holds firm as ${biggestMover.lastName} surges +${biggestMover.rankChange}`;
    }
    return `${biggestMover.lastName} surges +${biggestMover.rankChange} as rankings reshuffle`;
  }

  if (top5Changes.length >= 3) {
    return `Top-5 reshuffle as ${top5Changes.length} positions change hands`;
  }

  if (no1Stable) {
    return `No.1 unchanged — pressure building behind ${no1Name}`;
  }

  if (no1.rank_change > 0) {
    return `${no1Name} climbs to World No.1 after rankings update`;
  }

  return `${no1Name} leads the rankings into a new week`;
}

// ============================================================================
// MOMENTUM PILL
// ============================================================================

interface MomentumPillProps {
  entry: {
    playerId: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    rank: number;
    rankChange: number;
  };
  index: number;
  onTap: (playerId: string, rank: number) => void;
}

function MomentumPill({ entry, index, onTap }: MomentumPillProps) {
  const isRocket = entry.rankChange >= 30;
  const initials = `${entry.firstName?.[0] ?? ''}${entry.lastName?.[0] ?? ''}`.toUpperCase();

  const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);

  return (
    <motion.button
      onClick={() => onTap(entry.playerId, entry.rank)}
      className="flex-shrink-0 flex items-center gap-2 rounded-full bg-card border border-border active:scale-[0.97] transition-transform"
      style={{
        padding: '6px 12px 6px 6px',
        scrollSnapAlign: 'start',
      }}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Avatar */}
      <div
        className="overflow-hidden flex-shrink-0"
        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={entry.lastName}
            className="w-full h-full object-cover object-top"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-muted"
          >
            <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
        {entry.lastName}
      </span>

      {/* Rank (muted) */}
      <span className="text-[11px] text-muted-foreground font-medium">
        #{entry.rank}
      </span>

      {/* Movement badge */}
      <span className="text-[12px] font-bold text-emerald-700 whitespace-nowrap">
        {isRocket ? '🚀' : '↑'} +{entry.rankChange}
      </span>
    </motion.button>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function SkeletonStrip() {
  return (
    <div className="flex gap-2 overflow-hidden" style={{ padding: '0 16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex-shrink-0 h-10 w-36 rounded-full bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ padding: '12px 16px' }}>
      <div className="w-6 h-4 rounded bg-muted animate-pulse" />
      <div className="w-10 h-10 rounded-xl bg-muted animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </div>
      <div className="w-16 h-8 rounded bg-muted animate-pulse" />
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

  const no1AvgPts = rankings?.[0]?.avg_points ?? 0;

  const narrative = useMemo(
    () => generateNarrative(rankings, movers),
    [rankings, movers],
  );

  // Clear highlight after animation
  useEffect(() => {
    if (highlightedPlayerId) {
      const timer = setTimeout(() => setHighlightedPlayerId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightedPlayerId]);

  const goToPrevPage = () => { if (currentPage > 0) setCurrentPage(p => p - 1); };
  const goToNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); };

  const handleMoverTap = useCallback((playerId: string, rank: number) => {
    const playerPage = Math.floor((rank - 1) / PLAYERS_PER_PAGE);
    setCurrentPage(playerPage);
    setTimeout(() => {
      setHighlightedPlayerId(playerId);
      rowRefs.current.get(playerId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const setRowRef = useCallback((playerId: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(playerId, el);
    else rowRefs.current.delete(playerId);
  }, []);

  // Dot pagination (max 6 sliding window)
  const maxDots = 6;
  const getDotRange = () => {
    if (totalPages <= maxDots) return { start: 0, end: totalPages };
    const half = Math.floor(maxDots / 2);
    let start = currentPage - half;
    let end = currentPage + half;
    if (start < 0) { start = 0; end = maxDots; }
    else if (end >= totalPages) { end = totalPages; start = totalPages - maxDots; }
    return { start, end };
  };
  const dotRange = getDotRange();

  // ============ LOADING ============
  if (isLoading) {
    return (
      <motion.section
        style={{ marginTop: '40px', padding: '0 16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-52 bg-muted rounded animate-pulse" />
        </div>
        <SkeletonStrip />
        <div className="mt-6">
          {[...Array(10)].map((_, i) => <SkeletonRow key={i} index={i} />)}
        </div>
      </motion.section>
    );
  }

  if (!rankings?.length) return null;

  const hasMovers = movers && movers.length > 0;

  return (
    <motion.section
      style={{ marginTop: '40px', padding: '0 16px' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ────── Section Header ────── */}
      <div className="flex items-center justify-between mb-1">
        <h2
          className="text-foreground"
          style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.2px' }}
        >
          Official World Golf Ranking
        </h2>
        <button
          onClick={() => navigate('/tourhub?tab=players')}
          className="flex items-center gap-0.5 text-muted-foreground active:scale-[0.95] transition-transform"
          style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}
        >
          View All
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>

      {/* Subtext */}
      <p className="text-muted-foreground mb-5" style={{ fontSize: '11px' }}>
        Updated weekly · Official OWGR data
      </p>

      {/* Hairline divider */}
      <div className="border-t border-border/60 mb-5" />

      {/* ────── Narrative Strip ────── */}
      {narrative && (
        <p
          className="text-muted-foreground italic mb-5"
          style={{ fontSize: '13px', lineHeight: 1.5 }}
        >
          "{narrative}"
        </p>
      )}

      {/* ────── This Week's Momentum ────── */}
      {hasMovers && (
        <div className="mb-6">
          <p
            className="text-foreground mb-3"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            This Week's Momentum
          </p>
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
          >
            {movers!.map((entry, idx) => (
              <MomentumPill
                key={entry.playerId}
                entry={entry}
                index={idx}
                onTap={handleMoverTap}
              />
            ))}
          </div>
        </div>
      )}

      {/* ────── Leaderboard Table ────── */}

      {/* Column headers */}
      <div
        className="flex items-center pb-2 border-b border-border/60"
      >
        <div style={{ width: '30px', flexShrink: 0 }} />
        <div
          className="flex-1 min-w-0 text-muted-foreground"
          style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}
        >
          Player
        </div>
        <div
          className="text-muted-foreground text-right"
          style={{ width: '80px', flexShrink: 0, fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}
        >
          Points
        </div>
      </div>

      {/* Player Rows */}
      <div>
        {currentPagePlayers.map((entry, index) => {
          const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
          const isHighlighted = highlightedPlayerId === entry.player.id;
          const rank = entry.rank;

          // Tier logic
          const isCrown = rank === 1;
          const isElite = rank >= 2 && rank <= 3;
          const isContender = rank >= 4 && rank <= 10;

          // Chase the Crown: ranks 2-5
          const showChase = rank >= 2 && rank <= 5 && no1AvgPts > 0 && entry.avg_points;
          const ptsToNo1 = showChase ? (no1AvgPts - (entry.avg_points || 0)).toFixed(1) : null;

          // Rank velocity
          const change = entry.rank_change;

          // Row background — no alternating, just tier tints
          let rowBg = 'transparent';
          if (isCrown) rowBg = 'hsl(45 80% 96%)'; // very faint gold
          if (isHighlighted) rowBg = 'hsl(var(--muted))';

          const photoUrl = entry.player.pga_tour_id
            ? getPgaTourHeadshotUrl(entry.player.pga_tour_id)
            : null;
          const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`.toUpperCase();

          return (
            <motion.div
              key={entry.player.id}
              ref={(el) => setRowRef(entry.player.id, el)}
              className={cn(
                "flex items-center cursor-pointer transition-colors duration-150 active:scale-[0.98]",
                "border-b border-border/40",
              )}
              onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + Math.min(index, 10) * 0.03 }}
              style={{
                padding: '10px 0',
                background: rowBg,
              }}
            >
              {/* Rank + Velocity */}
              <div
                className="flex flex-col items-center justify-center"
                style={{ width: '30px', flexShrink: 0 }}
              >
                {/* Rank number */}
                <span
                  className={cn(
                    "font-mono text-xs font-bold",
                    isCrown ? "text-[#B8860B]" : isElite ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {rank}
                </span>
                {/* Velocity arrow */}
                {change > 0 ? (
                  <span className="text-[9px] font-bold text-emerald-700">↑{change}</span>
                ) : change < 0 ? (
                  <span className="text-[9px] font-bold text-red-500">↓{Math.abs(change)}</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0 mr-3">
                <div
                  className="overflow-hidden"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    border: isCrown
                      ? '1.5px solid hsl(45 70% 65%)'
                      : '1px solid hsl(var(--border))',
                  }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <span className="text-xs font-bold text-muted-foreground">{initials}</span>
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
                </div>
                {/* Crown icon for #1 */}
                {isCrown && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-[#B8860B] fill-[#B8860B]/20" />
                  </div>
                )}
              </div>

              {/* Player info */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate leading-tight",
                    isCrown ? "font-bold" : isElite ? "font-semibold" : "font-medium",
                  )}
                  style={{
                    fontSize: '14px',
                    color: 'hsl(var(--foreground))',
                  }}
                  title={fullName}
                >
                  {fullName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
                    <CountryFlag country={entry.player.country} size="sm" />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {formatCountryName(entry.player.country)}
                  </span>
                </div>
                {/* Chase the Crown */}
                {ptsToNo1 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    −{ptsToNo1} pts to #1
                  </p>
                )}
              </div>

              {/* Points — stacked */}
              <div className="text-right flex-shrink-0" style={{ width: '80px' }}>
                <p
                  className="font-mono font-bold"
                  style={{
                    fontSize: '14px',
                    color: isCrown ? '#B8860B' : 'hsl(var(--foreground))',
                  }}
                >
                  {entry.avg_points?.toFixed(2) ?? '—'}
                </p>
                <p className="font-mono text-muted-foreground" style={{ fontSize: '11px' }}>
                  {entry.total_points
                    ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 })
                    : '—'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ────── Pagination ────── */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="flex items-center gap-3">
            {/* Prev */}
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border transition-opacity disabled:opacity-20 active:scale-[0.95]"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: dotRange.end - dotRange.start }).map((_, i) => {
                const dotIdx = dotRange.start + i;
                const isActive = dotIdx === currentPage;
                return (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentPage(dotIdx)}
                    className="transition-all duration-200"
                    style={{
                      height: '6px',
                      width: isActive ? '18px' : '6px',
                      borderRadius: '3px',
                      background: isActive
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--muted-foreground) / 0.2)',
                    }}
                  />
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border transition-opacity disabled:opacity-20 active:scale-[0.95]"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground mt-2">
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </div>
      )}
    </motion.section>
  );
}

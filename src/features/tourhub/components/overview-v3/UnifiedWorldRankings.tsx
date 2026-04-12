/**
 * UnifiedWorldRankings v6 — Rankings Report Redesign (Dispatch aesthetic)
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRankingMovers, useWorldRankingsFull } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';
import CountryFlag from '@/components/ui/country-flag';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { toTitleCase } from '../../hooks/useWorldRankings';
import { TOUR_COLORS } from '../../constants/colors';
import { getTourLogo } from '../../utils/tourLogos';
import { BottomSheet } from '@/components/ui/BottomSheet';

const PLAYERS_PER_PAGE = 10;

const RANKING_TOUR_OPTIONS = [
  { code: 'pga',  label: 'PGA Tour',       description: 'Official World Golf Ranking' },
  { code: 'euro', label: 'DP World Tour',   description: 'DP World Tour ranking' },
  { code: 'liv',  label: 'LIV Golf',        description: 'LIV Golf Series ranking' },
  { code: 'lpga', label: 'LPGA Tour',       description: "Rolex Women's World Ranking" },
  { code: 'pgad', label: 'Korn Ferry',      description: 'Korn Ferry Tour ranking' },
];

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
// MOMENTUM PILL — kept for import safety, no longer rendered
// ============================================================================

interface MomentumPillProps {
  entry: {
    playerId: string;
    firstName: string;
    lastName: string;
    country: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    tourCode: string;
    rank: number;
    priorRank: number | null;
    rankChange: number;
  };
  index: number;
  direction: 'up' | 'down';
}

function MomentumPill({ entry, index, direction }: MomentumPillProps) {
  const navigate = useNavigate();
  const isUp = direction === 'up';
  const absChange = Math.abs(entry.rankChange);
  return (
    <button
      onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
      aria-label={`${entry.firstName} ${entry.lastName}, rank ${entry.rank}, ${isUp ? 'up' : 'down'} ${absChange}`}
    >
      {entry.lastName}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedWorldRankings() {
  const navigate = useNavigate();
  const [activeTour, setActiveTour] = useState('pga');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: movers, isLoading: moversLoading, error: moversError, refetch: refetchMovers } = useRankingMovers(activeTour);
  const { data: rankings, isLoading: rankingsLoading, error: rankingsError, refetch: refetchRankings } = useWorldRankingsFull(activeTour);

  const [currentPage, setCurrentPage] = useState(0);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isLoading = moversLoading || rankingsLoading;
  const hasError = moversError || rankingsError;

  const totalPlayers = rankings?.length || 0;
  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);

  const startIndex = currentPage * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalPlayers);
  const currentPagePlayers = rankings?.slice(startIndex, endIndex) || [];

  const moverPlayerIds = useMemo(() => new Set(movers?.map(m => m.playerId) || []), [movers]);
  const upwardMovers = useMemo(() => 
    (movers || []).filter(m => m.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange).slice(0, 10), 
  [movers]);
  const downwardMovers = useMemo(() => 
    (movers || []).filter(m => m.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange).slice(0, 10), 
  [movers]);

  useEffect(() => {
    if (highlightedPlayerId) {
      const timer = setTimeout(() => setHighlightedPlayerId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightedPlayerId]);

  const goToPrevPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); };

  const handleTourChange = (code: string) => {
    setActiveTour(code);
    setCurrentPage(0);
    setSheetOpen(false);
  };

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

  const hasMovers = upwardMovers.length > 0 || downwardMovers.length > 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <motion.section
        className="px-4"
        aria-label="Official World Golf Ranking"
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

  // Error state
  if (hasError) {
    return (
      <section aria-label="Official World Golf Ranking">
        <SectionErrorState sectionName="world rankings" onRetry={() => { refetchMovers(); refetchRankings(); }} />
      </section>
    );
  }

  return (
    <motion.section
      className="px-4"
      aria-label="Official World Golf Ranking"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ═══ MASTHEAD ═══ */}
      <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
              ⚡ Weekly Rankings Report
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              World Golf Rankings
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {/* Tour selector trigger */}
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#ffffff',
                border: '1px solid rgba(15,23,42,0.09)',
                borderRadius: 10, padding: '6px 11px',
                boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
              }}
              className="active:scale-[0.98] transition-transform"
            >
              <img src={getTourLogo(activeTour)} alt="" style={{ width: 24, height: 18, objectFit: 'contain' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                {RANKING_TOUR_OPTIONS.find(t => t.code === activeTour)?.label}
              </span>
              <ChevronDown style={{ width: 12, height: 12, color: '#94A3B8' }} />
            </button>
            <span style={{ fontSize: 9, color: '#94A3B8' }}>
              {(() => {
                const rankingDate = (rankings as any)?.[0]?.ranking_date;
                if (!rankingDate) return 'Updated weekly';
                const diffDays = Math.floor((new Date().getTime() - new Date(rankingDate + 'T00:00:00').getTime()) / 86400000);
                if (diffDays === 0) return 'Updated today';
                if (diffDays === 1) return 'Updated yesterday';
                if (diffDays <= 7) return `Updated ${diffDays} days ago`;
                return `Updated ${rankingDate}`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom sheet — kept exactly as is */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        ariaLabelledBy="rankings-tour-sheet-title"
      >
        <div className="px-5 pb-6 pt-2">
          <div style={{ paddingBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--accent-amber))', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
              Filter
            </div>
            <h3
              id="rankings-tour-sheet-title"
              style={{ fontSize: 20, fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em', margin: 0 }}
            >
              Rankings by tour
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {RANKING_TOUR_OPTIONS.map(tour => {
              const isActive = activeTour === tour.code;
              return (
                <button
                  key={tour.code}
                  onClick={() => handleTourChange(tour.code)}
                  aria-pressed={isActive}
                  className="w-full flex items-center gap-3 text-left transition-all duration-150"
                  style={{
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: isActive
                      ? '1.5px solid hsl(var(--accent-amber) / 0.40)'
                      : '1px solid hsl(var(--border) / 0.5)',
                    background: isActive
                      ? 'hsl(var(--accent-amber) / 0.10)'
                      : 'hsl(var(--card))',
                  }}
                >
                  <img
                    src={getTourLogo(tour.code)}
                    alt={tour.label}
                    style={{ width: 32, height: 22, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.875rem] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {tour.label}
                    </div>
                    <div className="text-[0.75rem]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {tour.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <Check className="w-4 h-4" style={{ color: 'hsl(var(--accent-amber))' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* ═══ NO.1 COVER STORY ═══ */}
      {currentPagePlayers.length > 0 && currentPage === 0 && (() => {
        const top = rankings?.[0];
        if (!top) return null;
        const topName = `${top.player.first_name} ${top.player.last_name}`;
        return (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 0,
            marginBottom: 16, paddingBottom: 16,
            borderBottom: '1px solid rgba(15,23,42,0.08)',
          }}>
            {/* Left — rank number */}
            <div style={{
              width: 64, flexShrink: 0,
              paddingRight: 14, marginRight: 14,
              borderRight: '1px solid rgba(15,23,42,0.08)',
            }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.14em', marginBottom: 4 }}>NO.1</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#F7931E', lineHeight: 1, letterSpacing: '-0.05em' }}>1</div>
            </div>
            {/* Right — player info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 3 }}>
                {topName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <CountryFlag country={top.player.country ?? ''} size="sm" />
                <span style={{ fontSize: 10, color: '#94A3B8' }}>{toTitleCase(top.player.country ?? '')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {top.avg_points?.toFixed(2) ?? '—'}
                </span>
                <span style={{ fontSize: 8.5, color: '#94A3B8', letterSpacing: '0.06em' }}>AVG PTS</span>
                <span style={{ fontSize: 11, color: '#E2E8F0', margin: '0 2px' }}>·</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                  {top.total_points?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'}
                </span>
                <span style={{ fontSize: 8.5, color: '#94A3B8', letterSpacing: '0.06em' }}>TOTAL</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ MOVERS REPORT ═══ */}
      {hasMovers && (
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid rgba(15,23,42,0.08)',
          padding: '12px 14px',
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
        }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.14em', marginBottom: 10 }}>
            WEEK'S MOVERS
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Risers column */}
            {upwardMovers.length > 0 && (
              <div style={{ flex: 1, borderRight: downwardMovers.length > 0 ? '0.5px solid rgba(15,23,42,0.08)' : 'none', paddingRight: downwardMovers.length > 0 ? 14 : 0 }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, color: '#16A34A', letterSpacing: '0.12em', marginBottom: 8 }}>
                  ▲ RISERS
                </div>
                {upwardMovers.slice(0, 4).map((entry, i) => (
                  <button
                    key={entry.playerId}
                    onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '5px 0',
                      background: 'none', border: 'none',
                      borderBottom: i < Math.min(upwardMovers.length, 4) - 1 ? '0.5px solid rgba(15,23,42,0.05)' : 'none',
                      cursor: 'pointer', textAlign: 'left' as const,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{entry.lastName}</div>
                      <div style={{ fontSize: 9, color: '#94A3B8' }}>#{entry.rank}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>+{Math.abs(entry.rankChange)}</div>
                  </button>
                ))}
              </div>
            )}
            {/* Fallers column */}
            {downwardMovers.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, color: '#DC2626', letterSpacing: '0.12em', marginBottom: 8 }}>
                  ▼ FALLERS
                </div>
                {downwardMovers.slice(0, 4).map((entry, i) => (
                  <button
                    key={entry.playerId}
                    onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '5px 0',
                      background: 'none', border: 'none',
                      borderBottom: i < Math.min(downwardMovers.length, 4) - 1 ? '0.5px solid rgba(15,23,42,0.05)' : 'none',
                      cursor: 'pointer', textAlign: 'left' as const,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{entry.lastName}</div>
                      <div style={{ fontSize: 9, color: '#94A3B8' }}>#{entry.rank}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626' }}>{entry.rankChange}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ LEADERBOARD ═══ */}
      <div>
        {/* Column headers */}
        <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid rgba(15,23,42,0.1)', marginBottom: 0 }}>
          <div style={{ width: 48, flexShrink: 0, fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em' }}>RNK</div>
          <div style={{ flex: 1, fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em' }}>PLAYER</div>
          <div style={{ width: 36, textAlign: 'right' as const, fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>WK</div>
          <div style={{ width: 52, textAlign: 'right' as const, fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>
            {activeTour === 'pga' ? 'AVG' : 'PTS'}
          </div>
          <div style={{ width: 52, textAlign: 'right' as const, fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>TOTAL</div>
        </div>

        {/* Player Rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {currentPagePlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <p className="text-[14px] font-medium text-foreground">
                  No ranking data available
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {RANKING_TOUR_OPTIONS.find(t => t.code === activeTour)?.label} rankings haven't been synced yet
                </p>
                <button
                  onClick={() => handleTourChange('pga')}
                  className="mt-2 text-[12px] font-semibold text-primary active:opacity-70"
                >
                  Switch to PGA Tour
                </button>
              </div>
            ) : currentPagePlayers.map((entry, index) => {
              const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
              const isHighlighted = highlightedPlayerId === entry.player.id;
              const isCrown = entry.rank === 1;
              const rankChange = entry.rank_change;
              const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`.toUpperCase();
              const photoUrl = getPlayerHeadshotUrl(fullName, entry.player.tour_codes?.[0] ?? 'pga');

              return (
                <motion.div
                  key={entry.player.id}
                  ref={(el) => setRowRef(entry.player.id, el)}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '11px 0',
                    borderBottom: '0.5px solid rgba(15,23,42,0.06)',
                    background: isHighlighted ? 'rgba(247,147,30,0.03)' : 'transparent',
                  }}
                  aria-label={`${fullName}, rank ${entry.rank}, average ${entry.avg_points?.toFixed(2) ?? 'N/A'} points`}
                >
                  {/* Large grey rank number */}
                  <div style={{ width: 48, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 18, fontWeight: 900,
                      color: isCrown ? '#F7931E' : 'rgba(15,23,42,0.12)',
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {entry.rank}
                    </span>
                  </div>

                  {/* Avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <PlayerAvatar photoUrl={photoUrl} initials={initials} fullName={fullName} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, lineHeight: 1.2 }}>
                        {fullName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <CountryFlag country={entry.player.country ?? ''} size="sm" />
                        <span style={{ fontSize: 10, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {toTitleCase(entry.player.country ?? '')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weekly change */}
                  <div style={{ width: 36, textAlign: 'right' as const, flexShrink: 0 }}>
                    {rankChange > 0 ? (
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A' }}>▲{Math.abs(rankChange)}</span>
                    ) : rankChange < 0 ? (
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626' }}>▼{Math.abs(rankChange)}</span>
                    ) : (
                      <span style={{ fontSize: 9, color: '#E2E8F0' }}>—</span>
                    )}
                  </div>

                  {/* Avg points */}
                  <div style={{ width: 52, textAlign: 'right' as const, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isCrown ? '#F7931E' : '#334155', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.avg_points?.toFixed(2) ?? '—'}
                    </span>
                  </div>

                  {/* Total */}
                  <div style={{ width: 52, textAlign: 'right' as const, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.total_points
                        ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 })
                        : '—'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="pt-3">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" />
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
                      height: '4px',
                      width: isActive ? '20px' : '4px',
                      borderRadius: '2px',
                      background: isActive ? '#0F172A' : 'rgba(15,23,42,0.12)',
                    }}
                    aria-label={`Page ${dotIndex + 1} of ${totalPages}`}
                  />
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" />
            </button>
          </div>

          <p className="text-center text-muted-foreground/50 mt-1.5" style={{ fontSize: 10, fontWeight: 500, fontVariantNumeric: 'normal' }}>
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </div>
      )}
    </motion.section>
  );
}

// ============================================================================
// PlayerAvatar
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
      {(!showPhoto || !imgLoaded) && (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}

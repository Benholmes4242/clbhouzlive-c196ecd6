/**
 * WorldRankingsHero — Three-tier World Rankings surface.
 *
 * Lives directly on the page background (no card wrappers). Three tiers:
 *   1. Headline #1   — editorial framing of the world #1 with WORLD #1 · N WEEKS tenure.
 *   2. Chasing list  — ranks 2-5 as scannable rows with movement indicator on every row.
 *   3. Movers block  — 2 risers + 2 fallers in a parallel two-column layout.
 *
 * Tour selector strip + section header sit above tier 1.
 * Movers block does not render for non-PGA tours (data layer returns []).
 */

import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Minus,
  TrendingUp,
  TrendingDown,
  Trophy,
} from 'lucide-react';
import {
  useRankingMovers,
  useWorldRankingsFull,
} from '../hooks/useOverviewModules';
import { usePlayerRankHistory } from '../hooks/usePlayerRankHistory';
import { SectionErrorState } from './SectionErrorState';
import CountryFlag from '@/components/ui/country-flag';
import { toTitleCase } from '../hooks/useWorldRankings';
import { getTourLogo } from '../utils/tourLogos';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PlayerAvatar } from './PlayerAvatar';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const INK = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_300 = '#CBD5E1';
const SLATE_200 = '#E2E8F0';
const SLATE_150 = '#EDF1F5';
const AMBER = '#F7931E';
const GREEN = '#16A34A';
const RED = '#DC2626';

// ─── Tour selector options ──────────────────────────────────────────────────
const RANKING_TOUR_OPTIONS = [
  { code: 'pga',  label: 'PGA Tour',     description: 'Official World Golf Ranking' },
  { code: 'euro', label: 'DP World Tour', description: 'DP World Tour ranking' },
  { code: 'liv',  label: 'LIV Golf',      description: 'LIV Golf Series ranking' },
  { code: 'lpga', label: 'LPGA Tour',     description: "Rolex Women's World Ranking" },
  { code: 'pgad', label: 'Korn Ferry',    description: 'Korn Ferry Tour ranking' },
];

// ─── "Updated Xd ago" helper (no "Updated " prefix — header renders that) ──
function formatUpdatedSuffix(rankingDate: string | null | undefined): string {
  if (!rankingDate) return 'WEEKLY';
  const diffDays = Math.floor(
    (new Date().getTime() - new Date(rankingDate + 'T00:00:00').getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  if (diffDays <= 7) return `${diffDays}D AGO`;
  return rankingDate.toUpperCase();
}

/**
 * Tolerant weeks-at-#1 count.
 * Walks history newest → oldest, increments on rank===1, stops only on an explicit
 * snapshot where rank > 1. Missing weeks (sync gaps) do NOT break the chain.
 * Returns null if no usable history.
 */
function computeWeeksAtNumberOne(
  history: { rank: number; date: string }[],
): number | null {
  if (!history.length) return null;
  // History from the hook is sorted ascending; walk descending here.
  const sortedDesc = [...history].sort((a, b) => (a.date < b.date ? 1 : -1));
  let count = 0;
  for (const snap of sortedDesc) {
    if (snap.rank === 1) count++;
    else break;
  }
  return count > 0 ? count : null;
}

// ─── Movement indicator (Chasing rows) ──────────────────────────────────────
function MovementIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          color: SLATE_400,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <Minus size={12} strokeWidth={3} />
      </div>
    );
  }
  if (change > 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: GREEN,
          fontSize: 11,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <TrendingUp size={11} strokeWidth={3} />
        {change}
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        color: RED,
        fontSize: 11,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <TrendingDown size={11} strokeWidth={3} />
      {Math.abs(change)}
    </div>
  );
}

// ─── Mover row (used in Movers block) ───────────────────────────────────────
interface MoverRowProps {
  mover: {
    playerId: string;
    firstName: string;
    lastName: string;
    country: string | null;
    tourCode: string;
    rank: number;
    rankChange: number;
  };
  direction: 'up' | 'down';
  isLast: boolean;
}

function MoverRow({ mover, direction, isLast }: MoverRowProps) {
  const navigate = useNavigate();
  const isUp = direction === 'up';
  const color = isUp ? GREEN : RED;
  const chipBg = isUp ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.06)';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const sign = isUp ? '+' : '−';

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/player/${mover.playerId}`)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        background: 'none',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${SLATE_150}`,
        cursor: 'pointer',
        textAlign: 'left' as const,
      }}
      className="active:opacity-70 transition-opacity"
    >
      <PlayerAvatar
        playerId={mover.playerId}
        playerName={`${mover.firstName} ${mover.lastName}`}
        tourCode={mover.tourCode}
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.01em',
            marginBottom: 2,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden' as const,
            textOverflow: 'ellipsis' as const,
          }}
        >
          {mover.firstName} {mover.lastName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CountryFlag country={mover.country ?? ''} size="sm" />
          <span style={{ fontSize: 11, fontWeight: 600, color: SLATE_500 }}>
            now #{mover.rank}
          </span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: chipBg,
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 900,
          color,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        <Icon size={11} strokeWidth={3} />
        {sign}
        {Math.abs(mover.rankChange)}
      </div>
      <ChevronRight size={14} strokeWidth={2.4} color={SLATE_400} style={{ flexShrink: 0 }} />
    </button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export const WorldRankingsHero = memo(function WorldRankingsHero() {
  const navigate = useNavigate();
  const [activeTour, setActiveTour] = useState('pga');
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data: rankings,
    isLoading: rankingsLoading,
    error: rankingsError,
    refetch: refetchRankings,
  } = useWorldRankingsFull(activeTour);
  const {
    data: movers,
    isLoading: moversLoading,
    error: moversError,
    refetch: refetchMovers,
  } = useRankingMovers(activeTour);

  const isLoading = rankingsLoading || moversLoading;
  const hasError = rankingsError || moversError;

  const top = rankings?.[0];
  const restOfTop5 = rankings?.slice(1, 5) ?? [];

  // Fetch up to 200 weeks of #1 history for the tenure derivation.
  const { data: rankHistory = [] } = usePlayerRankHistory(top?.player.id, 200);
  const weeksAtNo1 = useMemo(() => computeWeeksAtNumberOne(rankHistory), [rankHistory]);

  // Top 2 risers + top 2 fallers (data layer already returns top 8 of each).
  const topRisers = useMemo(
    () =>
      (movers ?? [])
        .filter((m) => m.rankChange > 0)
        .sort((a, b) => b.rankChange - a.rankChange)
        .slice(0, 2),
    [movers],
  );
  const topFallers = useMemo(
    () =>
      (movers ?? [])
        .filter((m) => m.rankChange < 0)
        .sort((a, b) => a.rankChange - b.rankChange)
        .slice(0, 2),
    [movers],
  );
  const hasMovers = topRisers.length > 0 || topFallers.length > 0;

  const activeTourLabel =
    RANKING_TOUR_OPTIONS.find((t) => t.code === activeTour)?.label ?? 'PGA Tour';
  const updatedSuffix = formatUpdatedSuffix((rankings as any)?.[0]?.ranking_date);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="px-4" aria-label="World Golf Rankings">
        <div className="h-4 w-40 rounded bg-muted animate-pulse mb-3" />
        <div className="h-20 w-full rounded bg-muted animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-full rounded bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (hasError) {
    return (
      <section className="px-4" aria-label="World Golf Rankings">
        <SectionErrorState
          sectionName="world rankings"
          onRetry={() => {
            refetchRankings();
            refetchMovers();
          }}
        />
      </section>
    );
  }

  return (
    <section className="px-4" aria-label="World Golf Rankings">
      {/* ─── Section header ─────────────────────────────────────────────── */}
      <SectionHeader
        eyebrow="Official World Golf Ranking"
        title="World Rankings"
        action={
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: SLATE_500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            UPDATED {updatedSuffix}
          </span>
        }
      />

      {/* ─── Tour selector strip ────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          className="active:opacity-70 transition-opacity"
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>
            Showing {activeTourLabel}
          </span>
          <ChevronDown style={{ width: 14, height: 14, color: SLATE_400 }} />
        </button>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        ariaLabelledBy="rankings-hero-tour-sheet-title"
      >
        <div style={{ padding: '6px 20px 14px' }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 900,
              color: AMBER,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              marginBottom: 4,
            }}
          >
            Filter
          </div>
          <div
            id="rankings-hero-tour-sheet-title"
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: INK,
              letterSpacing: '-0.03em',
            }}
          >
            Rankings by Tour
          </div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          {RANKING_TOUR_OPTIONS.map((tour) => {
            const isActive = activeTour === tour.code;
            return (
              <button
                key={tour.code}
                onClick={() => {
                  setActiveTour(tour.code);
                  setSheetOpen(false);
                }}
                aria-pressed={isActive}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: isActive ? 'rgba(247,147,30,0.04)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${AMBER}` : '3px solid transparent',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 22,
                    borderRadius: 4,
                    background: 'rgba(15,23,42,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={getTourLogo(tour.code)}
                    alt={tour.label}
                    style={{ width: 28, height: 18, objectFit: 'contain' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 800 : 500, color: INK }}>
                    {tour.label}
                  </div>
                  <div style={{ fontSize: 11, color: SLATE_400, marginTop: 2 }}>
                    {tour.description}
                  </div>
                </div>
                {isActive && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: AMBER,
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div
          style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }}
        />
      </BottomSheet>

      {/* ─── Tier 1 — Headline #1 ───────────────────────────────────────── */}
      {top && (
        <button
          type="button"
          onClick={() => navigate(`/tourhub/player/${top.player.id}`)}
          style={{
            width: '100%',
            display: 'block',
            textAlign: 'left' as const,
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginBottom: 18,
            paddingBottom: 18,
            borderBottom: `1px solid ${SLATE_200}`,
            cursor: 'pointer',
          }}
          className="active:opacity-70 transition-opacity"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(247,147,30,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <PlayerAvatar
                playerId={top.player.id}
                playerName={`${top.player.first_name} ${top.player.last_name}`}
                tourCode={top.player.tour_codes?.[0] ?? 'pga'}
                size="lg"
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <Trophy size={11} strokeWidth={1.5} fill={AMBER} color={AMBER} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: AMBER,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  WORLD #1{weeksAtNo1 != null ? ` · ${weeksAtNo1} WEEKS` : ''}
                </span>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  marginBottom: 4,
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden' as const,
                  textOverflow: 'ellipsis' as const,
                }}
              >
                {top.player.first_name} {top.player.last_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CountryFlag country={top.player.country ?? ''} size="sm" />
                <span style={{ fontSize: 12, fontWeight: 600, color: SLATE_500 }}>
                  {toTitleCase(top.player.country ?? '')}
                </span>
                <span style={{ fontSize: 12, color: SLATE_300 }}>·</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {top.avg_points ? top.avg_points.toFixed(2) : '—'} pts
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* ─── Tier 2 — Chasing list (ranks 2-5) ──────────────────────────── */}
      {restOfTop5.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: SLATE_500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              marginBottom: 10,
            }}
          >
            Chasing
          </div>
          {restOfTop5.map((entry, i) => {
            const isLast = i === restOfTop5.length - 1;
            return (
              <button
                key={entry.player.id}
                onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: isLast ? 'none' : `1px solid ${SLATE_150}`,
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
                className="active:opacity-70 transition-opacity"
              >
                <div
                  style={{
                    width: 24,
                    fontSize: 16,
                    fontWeight: 900,
                    color: SLATE_700,
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'center' as const,
                    flexShrink: 0,
                  }}
                >
                  {entry.rank}
                </div>
                <PlayerAvatar
                  playerId={entry.player.id}
                  playerName={`${entry.player.first_name} ${entry.player.last_name}`}
                  tourCode={entry.player.tour_codes?.[0] ?? 'pga'}
                  size="sm"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: '-0.01em',
                      marginBottom: 2,
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden' as const,
                      textOverflow: 'ellipsis' as const,
                    }}
                  >
                    {entry.player.first_name} {entry.player.last_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CountryFlag country={entry.player.country ?? ''} size="sm" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: SLATE_500 }}>
                      {entry.avg_points ? entry.avg_points.toFixed(2) : '—'} pts avg
                    </span>
                  </div>
                </div>
                <MovementIndicator change={entry.rank_change} />
                <ChevronRight
                  size={16}
                  strokeWidth={2.4}
                  color={SLATE_400}
                  style={{ flexShrink: 0 }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Tier 3 — Movers block (only when data available) ───────────── */}
      {hasMovers && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: SLATE_500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              marginBottom: 14,
            }}
          >
            Week's Biggest Movers
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            {/* Risers column */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${GREEN}`,
                  marginBottom: 2,
                }}
              >
                <TrendingUp size={12} strokeWidth={2.5} color={GREEN} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: GREEN,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Risers
                </span>
              </div>
              {topRisers.length === 0 ? (
                <div
                  style={{
                    padding: '14px 0',
                    fontSize: 11,
                    color: SLATE_400,
                  }}
                >
                  None this week
                </div>
              ) : (
                topRisers.map((m, i) => (
                  <MoverRow
                    key={m.playerId}
                    mover={m}
                    direction="up"
                    isLast={i === topRisers.length - 1}
                  />
                ))
              )}
            </div>

            {/* Fallers column */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${RED}`,
                  marginBottom: 2,
                }}
              >
                <TrendingDown size={12} strokeWidth={2.5} color={RED} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: RED,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Fallers
                </span>
              </div>
              {topFallers.length === 0 ? (
                <div
                  style={{
                    padding: '14px 0',
                    fontSize: 11,
                    color: SLATE_400,
                  }}
                >
                  None this week
                </div>
              ) : (
                topFallers.map((m, i) => (
                  <MoverRow
                    key={m.playerId}
                    mover={m}
                    direction="down"
                    isLast={i === topFallers.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

/**
 * WorldRankingsHero — Phase E redesign of the Overview rankings module.
 *
 * Replaces UnifiedWorldRankings on the Tour Hub Overview only. The legacy
 * UnifiedWorldRankings file and its ScheduleTab consumer remain untouched.
 *
 * Composition:
 *  • Tour selector strip (BottomSheet — same pattern as the legacy report)
 *  • #1 hero card with amber border + radial wash + 12-week sparkline
 *    powered by usePlayerRankHistory (real OWGR weekly snapshots)
 *  • Ranked list 2–5
 *  • Riser of Week + Faller of Week strip (singular framing)
 *
 * Per Tour Hub redesign brief Phase E.
 */

import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
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

// ─── Tour selector options (mirrors UnifiedWorldRankings) ────────────────────
const RANKING_TOUR_OPTIONS = [
  { code: 'pga',  label: 'PGA Tour',     description: 'Official World Golf Ranking' },
  { code: 'euro', label: 'DP World Tour', description: 'DP World Tour ranking' },
  { code: 'liv',  label: 'LIV Golf',      description: 'LIV Golf Series ranking' },
  { code: 'lpga', label: 'LPGA Tour',     description: "Rolex Women's World Ranking" },
  { code: 'pgad', label: 'Korn Ferry',    description: 'Korn Ferry Tour ranking' },
];

// ─── "Updated N days ago" helper ────────────────────────────────────────────
function formatUpdated(rankingDate: string | null | undefined): string {
  if (!rankingDate) return 'Updated weekly';
  const diffDays = Math.floor(
    (new Date().getTime() - new Date(rankingDate + 'T00:00:00').getTime()) /
      86_400_000,
  );
  if (diffDays <= 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays <= 7) return `Updated ${diffDays}d ago`;
  return `Updated ${rankingDate}`;
}

// ─── Sparkline (68 × 24) ────────────────────────────────────────────────────
interface SparklineProps {
  history: { rank: number; date: string }[];
}

function Sparkline({ history }: SparklineProps) {
  const W = 68;
  const H = 24;

  if (history.length < 3) {
    // Single dot fallback — never render a fake/broken line
    return (
      <svg width={W} height={H} aria-hidden="true">
        <circle cx={W - 4} cy={H / 2} r={3} fill="#F7931E" />
      </svg>
    );
  }

  const ranks = history.map((p) => p.rank);
  const min = Math.min(...ranks);
  const max = Math.max(...ranks);
  const range = Math.max(1, max - min);

  // y inverted: rank 1 (best) at top
  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * (W - 4) + 2;
    const y = ((p.rank - min) / range) * (H - 6) + 3;
    return { x, y };
  });

  const linePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${H} L ${points[0].x.toFixed(2)} ${H} Z`;
  const last = points[points.length - 1];

  const gradientId = `sparkfill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={W} height={H} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7931E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F7931E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="#F7931E"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2.5} fill="#F7931E" />
    </svg>
  );
}

// ─── Trajectory status text from history ────────────────────────────────────
function trajectoryStatus(history: { rank: number; date: string }[]): string {
  if (history.length < 3) return 'Holding #1';
  const first = history[0].rank;
  const last = history[history.length - 1].rank;
  if (last < first) return 'Climbing';
  if (last > first) return 'Falling';
  return 'Holding #1';
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

  const { data: rankHistory = [] } = usePlayerRankHistory(top?.player.id, 12);

  const status = useMemo(() => trajectoryStatus(rankHistory), [rankHistory]);

  const topRiser = useMemo(
    () =>
      (movers ?? [])
        .filter((m) => m.rankChange > 0)
        .sort((a, b) => b.rankChange - a.rankChange)[0] ?? null,
    [movers],
  );
  const topFaller = useMemo(
    () =>
      (movers ?? [])
        .filter((m) => m.rankChange < 0)
        .sort((a, b) => a.rankChange - b.rankChange)[0] ?? null,
    [movers],
  );

  const activeTourLabel =
    RANKING_TOUR_OPTIONS.find((t) => t.code === activeTour)?.label ?? 'PGA Tour';
  const updatedText = formatUpdated((rankings as any)?.[0]?.ranking_date);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="px-4" aria-label="World Golf Rankings">
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid rgba(15,23,42,0.08)',
            padding: 16,
            minHeight: 220,
          }}
        >
          <div className="h-4 w-40 rounded bg-muted animate-pulse mb-3" />
          <div className="h-20 w-full rounded bg-muted animate-pulse mb-4" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-full rounded bg-muted animate-pulse" />
            ))}
          </div>
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
      {/* ─── Tour selector strip ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
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
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
            Showing {activeTourLabel}
          </span>
          <ChevronDown style={{ width: 14, height: 14, color: '#94A3B8' }} />
        </button>
        <span style={{ fontSize: 10, color: '#94A3B8', letterSpacing: '0.04em' }}>
          {updatedText}
        </span>
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
              color: '#F7931E',
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              marginBottom: 4,
            }}
          >
            Filter
          </div>
          <div
            id="rankings-hero-tour-sheet-title"
            style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}
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
                  borderLeft: isActive ? '3px solid #F7931E' : '3px solid transparent',
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
                  <div style={{ fontSize: 14, fontWeight: isActive ? 800 : 500, color: '#0F172A' }}>
                    {tour.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {tour.description}
                  </div>
                </div>
                {isActive && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#F7931E',
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

      {/* ─── #1 hero card ───────────────────────────────────────────────── */}
      {top && (
        <button
          type="button"
          onClick={() => navigate(`/tourhub/player/${top.player.id}`)}
          style={{
            width: '100%',
            display: 'block',
            textAlign: 'left',
            position: 'relative',
            background:
              'radial-gradient(circle at 100% 0%, rgba(247,147,30,0.08) 0%, rgba(255,255,255,1) 60%)',
            border: '1.5px solid #F7931E',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 12,
            boxShadow: '0 4px 20px -4px rgba(247,147,30,0.2)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          className="active:scale-[0.99] transition-transform"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Rank badge */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#F7931E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(247,147,30,0.4)',
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                1
              </span>
            </div>

            {/* Player info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <Trophy style={{ width: 10, height: 10, color: '#F7931E' }} />
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 900,
                    color: '#F7931E',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  WORLD #1
                </span>
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  marginBottom: 4,
                }}
              >
                {top.player.first_name} {top.player.last_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CountryFlag country={top.player.country ?? ''} size="sm" />
                <span style={{ fontSize: 10, color: '#94A3B8' }}>
                  {toTitleCase(top.player.country ?? '')}
                </span>
                <span style={{ fontSize: 11, color: '#E2E8F0', margin: '0 2px' }}>·</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#475569',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {top.avg_points ? top.avg_points.toFixed(2) : '—'}
                </span>
                <span style={{ fontSize: 8.5, color: '#94A3B8', letterSpacing: '0.06em' }}>
                  AVG
                </span>
              </div>
            </div>

            {/* Sparkline */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 7.5,
                  fontWeight: 900,
                  color: '#94A3B8',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                }}
              >
                LAST 12 WKS
              </span>
              <Sparkline history={rankHistory} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color:
                    status === 'Climbing'
                      ? '#16A34A'
                      : status === 'Falling'
                        ? '#DC2626'
                        : '#475569',
                  letterSpacing: '0.02em',
                }}
              >
                {status}
              </span>
            </div>
          </div>
        </button>
      )}

      {/* ─── Ranked list 2–5 ───────────────────────────────────────────── */}
      {restOfTop5.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid rgba(15,23,42,0.08)',
            padding: '4px 14px',
            marginBottom: 12,
            boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
          }}
        >
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
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.06)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div
                  style={{
                    width: 22,
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#475569',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'center' as const,
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
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0F172A',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden' as const,
                      textOverflow: 'ellipsis' as const,
                    }}
                  >
                    {entry.player.first_name} {entry.player.last_name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 1,
                    }}
                  >
                    <CountryFlag country={entry.player.country ?? ''} size="sm" />
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>
                      {entry.avg_points ? entry.avg_points.toFixed(2) : '—'} avg
                    </span>
                  </div>
                </div>
                {entry.rank_change !== 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: entry.rank_change > 0 ? '#16A34A' : '#DC2626',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {entry.rank_change > 0 ? '▲' : '▼'}
                    {Math.abs(entry.rank_change)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Riser/Faller of Week ──────────────────────────────────────── */}
      {(topRiser || topFaller) && (
        <div style={{ display: 'flex', gap: 10 }}>
          {topRiser && (
            <button
              onClick={() => navigate(`/tourhub/player/${topRiser.playerId}`)}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid rgba(22,163,74,0.18)',
                borderRadius: 12,
                padding: '10px 12px',
                textAlign: 'left' as const,
                cursor: 'pointer',
              }}
              className="active:scale-[0.98] transition-transform"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <TrendingUp style={{ width: 11, height: 11, color: '#16A34A' }} />
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 900,
                    color: '#16A34A',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  RISER OF WEEK
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden' as const,
                  textOverflow: 'ellipsis' as const,
                }}
              >
                {topRiser.firstName} {topRiser.lastName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#16A34A',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  +{Math.abs(topRiser.rankChange)}
                </span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>now #{topRiser.rank}</span>
              </div>
            </button>
          )}
          {topFaller && (
            <button
              onClick={() => navigate(`/tourhub/player/${topFaller.playerId}`)}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid rgba(220,38,38,0.18)',
                borderRadius: 12,
                padding: '10px 12px',
                textAlign: 'left' as const,
                cursor: 'pointer',
              }}
              className="active:scale-[0.98] transition-transform"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <TrendingDown style={{ width: 11, height: 11, color: '#DC2626' }} />
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 900,
                    color: '#DC2626',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  FALLER OF WEEK
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden' as const,
                  textOverflow: 'ellipsis' as const,
                }}
              >
                {topFaller.firstName} {topFaller.lastName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#DC2626',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  −{Math.abs(topFaller.rankChange)}
                </span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>now #{topFaller.rank}</span>
              </div>
            </button>
          )}
        </div>
      )}
    </section>
  );
});

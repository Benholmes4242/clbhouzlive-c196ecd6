/**
 * WorldRankingsHero — Editorial World Rankings surface.
 *
 * Layout:
 *   1. Single-line header — "World Rankings" + UPDATED N AGO
 *   2. Tour dropdown trigger pill (opens existing BottomSheet, unchanged)
 *   3. #1 player card — light gold celebration treatment
 *   4. CHASING rows (ranks 2–5) — editorial detail line + movement chip
 *   5. Movers block (Risers / Fallers) — two-column white cards
 */

import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Crown,
  TrendingUp,
  TrendingDown,
  Trophy,
} from 'lucide-react';
import {
  useRankingMovers,
  useWorldRankingsFull,
  type WorldRankingEntry,
} from '../hooks/useOverviewModules';
import { usePlayerRankHistory } from '../hooks/usePlayerRankHistory';
import { SectionErrorState } from './SectionErrorState';
import CountryFlag from '@/components/ui/country-flag';
import { toTitleCase } from '../hooks/useWorldRankings';
import { getTourLogo } from '../utils/tourLogos';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { PlayerAvatar } from './PlayerAvatar';
import { Shimmer } from './shared/Shimmer';
import { TOUR_MAP, type TourCode } from '../constants/tourMap';

// ─── Tokens ─────────────────────────────────────────────────────────────────
import {
  AMBER,
  AMBER_TINT_04,
  GOLD,
  GOLD_BORDER,
  GOLD_GLOW,
  GOLD_TINT,
  INK,
  INK_FAINT,
  INK_LIGHT,
  INK_MUTE,
  INK_SOFT,
  INK_TINT_06,
  INK_TINT_07,
  SLATE_150,
  SLATE_200,
  SLATE_600,
  SURFACE,
  TREND_DOWN,
  TREND_DOWN_TINT,
  TREND_UP,
  TREND_UP_TINT,
} from '../_shared/tokens';

// ─── Tour selector options ──────────────────────────────────────────────────
const RANKING_TOUR_OPTIONS = [
  { code: 'pga',  label: 'PGA Tour',     description: 'Official World Golf Ranking' },
  { code: 'euro', label: 'DP World Tour', description: 'DP World Tour ranking' },
  { code: 'liv',  label: 'LIV Golf',      description: 'LIV Golf Series ranking' },
  { code: 'lpga', label: 'LPGA Tour',     description: "Rolex Women's World Ranking" },
  { code: 'pgad', label: 'Korn Ferry',    description: 'Korn Ferry Tour ranking' },
];

const COMPACT_TOUR_LABELS: Record<string, string> = {
  pga: 'PGA',
  EURO: 'DPWT',
  LPGA: 'LPGA',
  LIV: 'LIV',
  CHAMP: 'CHAMP',
  PGAD: 'KFT',
};

function tourMapKeyFor(code: string): TourCode {
  if (code === 'pga') return 'pga';
  return code.toUpperCase() as TourCode;
}

// ─── "Updated Xd ago" helper ────────────────────────────────────────────────
function formatUpdatedSuffix(rankingDate: string | null | undefined): string {
  if (!rankingDate) return 'WEEKLY';
  const diffDays = Math.floor(
    (new Date().getTime() - new Date(rankingDate + 'T00:00:00').getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return 'UPDATED TODAY';
  if (diffDays === 1) return 'UPDATED YESTERDAY';
  if (diffDays <= 7) return `UPDATED ${diffDays}D AGO`;
  return `UPDATED ${rankingDate.toUpperCase()}`;
}

function formatUpdatedSentence(rankingDate: string | null | undefined): string {
  if (!rankingDate) return '';
  const d = new Date(rankingDate + 'T00:00:00');
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays <= 7) return `Updated ${diffDays} days ago`;
  return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
}

/**
 * Tolerant weeks-at-#1 count — walks newest → oldest, missing weeks tolerated.
 */
function computeWeeksAtNumberOne(
  history: { rank: number; date: string }[],
): number | null {
  if (!history.length) return null;
  const sortedDesc = [...history].sort((a, b) => (a.date < b.date ? 1 : -1));
  let count = 0;
  for (const snap of sortedDesc) {
    if (snap.rank === 1) count++;
    else break;
  }
  return count > 0 ? count : null;
}

// ─── Tour dropdown trigger pill ─────────────────────────────────────────────
function TourDropdownTrigger({ activeTour, onClick }: {
  activeTour: string;
  onClick: () => void;
}) {
  const key = tourMapKeyFor(activeTour);
  const meta = TOUR_MAP[key];
  const compactLabel = COMPACT_TOUR_LABELS[key] ?? 'TOUR';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: SURFACE,
        border: `1px solid ${SLATE_200}`,
        borderRadius: 10,
        cursor: 'pointer',
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
        minHeight: 36,
      }}
      className="active:opacity-70 transition-opacity"
    >
      <span
        style={{
          padding: '3px 7px',
          borderRadius: 4,
          background: meta?.bg ?? SLATE_600,
          color: meta?.fg ?? SURFACE,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.10em',
          lineHeight: 1.2,
        }}
      >
        {compactLabel}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.01em',
        }}
      >
        {meta?.label ?? 'Select tour'}
      </span>
      <ChevronDown size={14} color={INK_MUTE} strokeWidth={2.4} />
    </button>
  );
}

// ─── Movement chip (compact, inline) ────────────────────────────────────────
function MovementChip({ change }: { change: number | null | undefined }) {
  if (!change) return null;
  const isUp = change > 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 11,
        fontWeight: 800,
        color: isUp ? TREND_UP : TREND_DOWN,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {isUp ? (
        <TrendingUp size={11} strokeWidth={2.5} />
      ) : (
        <TrendingDown size={11} strokeWidth={2.5} />
      )}
      {Math.abs(change)}
    </span>
  );
}

// ─── #1 player card ─────────────────────────────────────────────────────────
function NumberOneCard({
  entry,
  weeksAtNumberOne,
}: {
  entry: WorldRankingEntry;
  weeksAtNumberOne: number | null;
}) {
  const navigate = useNavigate();
  const playerName = `${entry.player.first_name} ${entry.player.last_name}`;
  const tourCode = entry.player.tour_codes?.[0] ?? 'pga';

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        marginBottom: 18,
        background: SURFACE,
        borderRadius: 16,
        border: `1px solid ${GOLD_BORDER}`,
        boxShadow: GOLD_GLOW,
        overflow: 'hidden',
        position: 'relative',
        textAlign: 'left',
        cursor: 'pointer',
      }}
      className="active:opacity-90 transition-opacity"
    >
      {/* Subtle gold tint top */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `linear-gradient(180deg, ${GOLD_TINT} 0%, transparent 50%)`,
        }}
      />
      {/* Trophy watermark */}
      <Trophy
        size={140}
        strokeWidth={1}
        aria-hidden
        style={{
          position: 'absolute',
          right: -28,
          top: -16,
          color: GOLD,
          opacity: 0.04,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, padding: '18px 18px 16px' }}>
        {/* Crown eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Crown size={11} color={GOLD} strokeWidth={2.4} fill={GOLD} />
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: GOLD,
            }}
          >
            WORLD #1
          </span>
          {weeksAtNumberOne != null && weeksAtNumberOne > 0 && (
            <>
              <span style={{ fontSize: 9, color: INK_LIGHT }}>·</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: INK_MUTE,
                  letterSpacing: '0.12em',
                }}
              >
                {weeksAtNumberOne} CONSECUTIVE {weeksAtNumberOne === 1 ? 'WEEK' : 'WEEKS'}
              </span>
            </>
          )}
        </div>

        {/* Player row — avatar + stacked name / country / points (points moved below country so the name + country use the full width and never truncate) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 80,
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
                padding: 2,
                background: GOLD,
                boxShadow: '0 0 16px rgba(255,184,0,0.20)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '34%',
                  overflow: 'hidden',
                  background: SURFACE,
                }}
              >
                <PlayerAvatar
                  playerId={entry.player.id}
                  playerName={playerName}
                  photoUrl={entry.player.photo_url}
                  tourCode={tourCode}
                  size="xl"
                  className="!w-full !h-full !rounded-[34%]"
                />

              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: GOLD,
                color: INK,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${SURFACE}`,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              1
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: INK,
                lineHeight: 1.1,
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {playerName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: INK_MUTE,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                minWidth: 0,
              }}
            >
              <CountryFlag country={entry.player.country ?? ''} size="sm" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {toTitleCase(entry.player.country ?? '')}
              </span>
            </div>

            {/* Total points — moved under country */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                marginTop: 10,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {entry.total_points != null ? entry.total_points.toFixed(2) : '—'}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: INK_FAINT,
                  letterSpacing: '0.12em',
                }}
              >
                TOTAL POINTS
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Chaser row (ranks 2–5) ─────────────────────────────────────────────────
function ChaserRow({
  entry,
  isLast,
}: {
  entry: WorldRankingEntry;
  isLast: boolean;
}) {
  const navigate = useNavigate();
  const playerName = `${entry.player.first_name} ${entry.player.last_name}`;
  const tourCode = entry.player.tour_codes?.[0] ?? 'pga';
  const detailLine = toTitleCase(entry.player.country ?? '') || '';

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: !isLast ? `1px solid ${SLATE_150}` : 'none',
        textAlign: 'left',
        cursor: 'pointer',
      }}
      className="active:opacity-70 transition-opacity"
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 22,
        }}
      >
        {entry.rank}
      </span>

      <PlayerAvatar
        playerId={entry.player.id}
        playerName={playerName}
        photoUrl={entry.player.photo_url}
        tourCode={tourCode}
        size="md"
      />


      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.015em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playerName}
          </span>
          <CountryFlag country={entry.player.country ?? ''} size="sm" />
        </div>
        <div
          style={{
            fontSize: 11,
            color: INK_MUTE,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {detailLine}
        </div>
      </div>

      <MovementChip change={entry.rank_change} />
      {entry.total_points != null && (
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          flexShrink: 0,
          minWidth: 56,
          textAlign: 'right',
        }}>
          {entry.total_points.toFixed(2)}
        </span>
      )}
    </button>
  );
}

// ─── Mover row (Risers / Fallers cards) ─────────────────────────────────────
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
  const playerName = `${mover.firstName} ${mover.lastName}`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/player/${mover.playerId}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderBottom: !isLast ? `1px solid ${SLATE_150}` : 'none',
        textAlign: 'left',
        cursor: 'pointer',
      }}
      className="active:opacity-70 transition-opacity"
    >
      <PlayerAvatar
        playerId={mover.playerId}
        playerName={playerName}
        tourCode={mover.tourCode}
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: INK,
            marginBottom: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {playerName}
        </div>
        <div
          style={{
            fontSize: 10,
            color: INK_MUTE,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <CountryFlag country={mover.country ?? ''} size="sm" />
          <span>now #{mover.rank}</span>
        </div>
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          padding: '3px 6px',
          borderRadius: 4,
          background: isUp ? TREND_UP_TINT : TREND_DOWN_TINT,
          color: isUp ? TREND_UP : TREND_DOWN,
          fontSize: 11,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {isUp ? (
          <TrendingUp size={10} strokeWidth={2.5} />
        ) : (
          <TrendingDown size={10} strokeWidth={2.5} />
        )}
        {isUp ? '+' : ''}
        {mover.rankChange}
      </span>
    </button>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function WorldRankingsSkeleton() {
  return (
    <section className="px-4" aria-label="World Golf Rankings">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Shimmer width="50%" height={24} radius={5} />
        <Shimmer width="25%" height={11} radius={3} />
      </div>

      {/* Tour dropdown */}
      <div style={{ marginBottom: 14 }}>
        <Shimmer width={160} height={36} radius={10} />
      </div>

      {/* #1 card */}
      <div
        style={{
          marginBottom: 18,
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${SLATE_200}`,
          padding: '18px 18px 16px',
        }}
      >
        <Shimmer width="40%" height={11} radius={3} style={{ marginBottom: 14 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Shimmer width={80} height={80} radius="50%" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Shimmer width="70%" height={20} radius={5} style={{ marginBottom: 8 }} />
            <Shimmer width="50%" height={11} radius={3} />
          </div>
          <Shimmer width={64} height={26} radius={5} />
        </div>
      </div>

      {/* CHASING */}
      <Shimmer width={70} height={11} radius={3} style={{ marginBottom: 12 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: i < 3 ? `1px solid ${SLATE_150}` : 'none',
          }}
        >
          <Shimmer width={22} height={16} radius={3} />
          <Shimmer width={38} height={38} radius="50%" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Shimmer width="60%" height={14} radius={3} style={{ marginBottom: 4 }} />
            <Shimmer width="40%" height={11} radius={3} />
          </div>
          <Shimmer width={24} height={11} radius={3} />
        </div>
      ))}

      {/* Movers */}
      <div style={{ marginTop: 28 }}>
        <Shimmer width="55%" height={11} radius={3} style={{ marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1].map((col) => (
            <div
              key={col}
              style={{
                background: SURFACE,
                borderRadius: 12,
                border: `1px solid ${SLATE_200}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${SLATE_150}` }}>
                <Shimmer width="50%" height={11} radius={3} />
              </div>
              {[0, 1].map((row) => (
                <div
                  key={row}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderBottom: row === 0 ? `1px solid ${SLATE_150}` : 'none',
                  }}
                >
                  <Shimmer width={28} height={28} radius="50%" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Shimmer width="70%" height={12} radius={3} style={{ marginBottom: 4 }} />
                    <Shimmer width="40%" height={10} radius={3} />
                  </div>
                  <Shimmer width={36} height={20} radius={4} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
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

  // Top 2 risers + top 2 fallers
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

  const rankingDate = rankings?.[0]?.ranking_date;
  const updatedSuffix = formatUpdatedSuffix(rankingDate);

  if (isLoading) return <WorldRankingsSkeleton />;

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
      {/* ─── Section title ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          World Rankings
        </div>
      </div>

      {/* ─── Tour dropdown + updated ────────────────────────────────────── */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <TourDropdownTrigger
          activeTour={activeTour}
          onClick={() => setSheetOpen(true)}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: INK_FAINT, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatUpdatedSentence(rankingDate)}
        </span>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        ariaLabelledBy="rankings-hero-tour-sheet-title"
      >
        <SheetHeader
          eyebrow="FILTER"
          title={<span id="rankings-hero-tour-sheet-title">Rankings by tour</span>}
          onClose={() => setSheetOpen(false)}
        />
        <div>
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
                  padding: '12px 16px',
                  background: isActive ? AMBER_TINT_04 : 'transparent',
                  border: 'none',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 22,
                    borderRadius: 4,
                    background: INK_TINT_06,
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
                  <div style={{ fontSize: 11, color: INK_FAINT, marginTop: 2 }}>
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

      {/* ─── #1 card ────────────────────────────────────────────────────── */}
      {top && <NumberOneCard entry={top} weeksAtNumberOne={weeksAtNo1} />}

      {/* ─── CHASING (ranks 2–5) ────────────────────────────────────────── */}
      {restOfTop5.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK_MUTE,
              letterSpacing: '0.16em',
              marginBottom: 4,
            }}
          >
            CHASING
          </div>
          {restOfTop5.map((entry, i) => (
            <ChaserRow
              key={entry.player.id}
              entry={entry}
              isLast={i === restOfTop5.length - 1}
            />
          ))}
        </div>
      )}

      {/* ─── Movers block ───────────────────────────────────────────────── */}
      {hasMovers && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK_MUTE,
              letterSpacing: '0.16em',
              marginBottom: 10,
            }}
          >
            WEEK'S BIGGEST MOVERS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Risers */}
            <div
              style={{
                background: SURFACE,
                borderRadius: 12,
                border: `1px solid ${SLATE_200}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: `1px solid ${SLATE_150}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <TrendingUp size={11} color={TREND_UP} strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: TREND_UP,
                    letterSpacing: '0.14em',
                  }}
                >
                  RISERS
                </span>
              </div>
              {topRisers.length === 0 ? (
                <div style={{ padding: '14px 12px', fontSize: 11, color: INK_FAINT }}>
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

            {/* Fallers */}
            <div
              style={{
                background: SURFACE,
                borderRadius: 12,
                border: `1px solid ${SLATE_200}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: `1px solid ${SLATE_150}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <TrendingDown size={11} color={TREND_DOWN} strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: TREND_DOWN,
                    letterSpacing: '0.14em',
                  }}
                >
                  FALLERS
                </span>
              </div>
              {topFallers.length === 0 ? (
                <div style={{ padding: '14px 12px', fontSize: 11, color: INK_FAINT }}>
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

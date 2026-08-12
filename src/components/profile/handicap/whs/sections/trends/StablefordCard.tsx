import React, { useState, useMemo } from 'react';
import { Info, ArrowUp, ArrowDown } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import {
  computeStablefordDistribution,
  type StablefordScope,
} from './computeStablefordDistribution';
import StablefordDetailSheet from './StablefordDetailSheet';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import { SC_BIRDIE, SC_ALBATROSS, SC_PAR, SC_BOGEY, SC_DOUBLE, SC_ACE_DARK, SC_ALBATROSS_DARK, SC_EAGLE_DARK, SC_BIRDIE_DARK, SC_PAR_DARK, SC_BOGEY_DARK, SC_DOUBLE_DARK } from '@/features/courses/components/holes/_constants';
import { useTrophyAggregates } from '@/lib/whs/hooks';
import { formatNumber } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DistributionRing, CHART, pointsTone, type RingSegment } from '../../charts';

interface Props {
  scores: WhsScore[];
  userId: string;
  connectionId: string;
}

type Mode = 'points' | 'shots';

const T = {
  ink: 'var(--hcp-t-100)',
  ink70: 'var(--hcp-t-80)',
  inkMute: 'var(--hcp-t-60)',
  ink40: 'var(--hcp-t-40)',
  hairline: 'var(--hcp-line-2)',
  ink04: 'var(--hcp-bg-2)',
  cardBg: 'var(--hcp-bg-1)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
  green: 'var(--hcp-good-deep)',
  greenInk: '#15803D',
  greenSoft: 'rgba(5,150,105,0.14)',
  red: 'var(--hcp-bad)',
  redInk: '#EF4444',
  redSoft: 'rgba(159,29,29,0.12)',
  ringTrack: 'var(--hcp-bg-3)',
};
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const HOLE_C = {
  birdie: SC_BIRDIE,
  par: SC_PAR,
  bogey: SC_BOGEY,
  double: SC_DOUBLE,
};

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 12,
  fontFamily: FONT,
};

const SCOPE_BTN_LABEL: Record<StablefordScope, string> = {
  '30d': '30D',
  '90d': '90D',
  all: 'ALL',
};

const SCOPE_LABEL_LONG: Record<StablefordScope, string> = {
  '30d': 'LAST 30 DAYS',
  '90d': 'LAST 90 DAYS',
  all: 'ALL TIME',
};

const SCOPE_DAYS: Record<Exclude<StablefordScope, 'all'>, number> = {
  '30d': 30,
  '90d': 90,
};

// ─── Helpers ────────────────────────────────────────────────────────────
function scoresInWindow(scores: WhsScore[], scope: StablefordScope): number[] {
  const valid = scores.filter(
    (s) => s.stableford_points != null && (s.stableford_points as number) > 0,
  );
  if (scope === 'all') return valid.map((s) => s.stableford_points as number);
  const cutoff = Date.now() - SCOPE_DAYS[scope] * 86_400_000;
  return valid
    .filter((s) => new Date(s.play_date).getTime() >= cutoff)
    .map((s) => s.stableford_points as number);
}

export const StablefordCard: React.FC<Props> = ({ scores, userId, connectionId }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scope, setScope] = useState<StablefordScope>('90d');
  const [mode, setMode] = useState<Mode>('points');

  const dist = useMemo(
    () => computeStablefordDistribution(scores, scope),
    [scores, scope],
  );

  // 4b — Scope → date range for the trophy aggregate fetch.
  const { fromDate, toDate } = useMemo(() => {
    if (scope === 'all') return { fromDate: null as string | null, toDate: null as string | null };
    const days = SCOPE_DAYS[scope];
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { fromDate: fmt(from), toDate: fmt(to) };
  }, [scope]);

  // Unconditional. Hook runs in both modes; React Query caches per window.
  const { data: trophyAgg, isLoading: shotsLoading } = useTrophyAggregates(
    userId,
    connectionId,
    fromDate,
    toDate,
  );

  // 4c — Scoring range computed from the parent's scores prop
  // (computeStablefordDistribution.ts is untouched and doesn't expose the window).
  const scoringRange = useMemo(() => {
    const pts = scoresInWindow(scores, scope);
    if (pts.length === 0) return null;
    const sorted = [...pts].sort((a, b) => a - b);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    const mid = sorted.length / 2;
    const median =
      sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[Math.floor(mid)];
    return { worst, median, best };
  }, [scores, scope]);

  // Dynamic header per mode
  const headerTitle = mode === 'points' ? "How you're scoring" : "What you're making";
  const headerEyebrow = mode === 'points' ? 'STABLEFORD POINTS' : 'SCORE STATS';

  // Meta count text for the scope toggle row
  const metaCount = (() => {
    if (mode === 'points') {
      return `${dist.total} ROUNDS`;
    }
    const totalHoles = trophyAgg?.hole_stats?.total_holes_in_window ?? 0;
    const roundsWithHoles = trophyAgg?.hole_stats?.rounds_with_holes_count ?? 0;
    if (totalHoles === 0 && roundsWithHoles === 0) return '';
    return `${totalHoles} HOLES · ${roundsWithHoles} ROUNDS`;
  })();

  return (
    <div style={SECTION_STYLE}>
      <CardHeader
        eyebrow={headerEyebrow}
        title={headerTitle}
        onOpenSheet={() => setSheetOpen(true)}
      />

      {/* 4d — Mode toggle */}
      <div style={{ padding: '12px 16px 0' }}>
        <ModeToggle mode={mode} setMode={setMode} />
      </div>

      {/* Scope toggle + meta count */}
      <div
        style={{
          padding: '12px 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <ScopeToggle scope={scope} setScope={setScope} />
        {metaCount && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: T.ink40,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metaCount}
          </span>
        )}
      </div>

      {/* Body */}
      {mode === 'points' ? (
        <PointsBody
          dist={dist}
          scope={scope}
          scoringRange={scoringRange}
        />
      ) : (
        <ShotsBody
          trophyAgg={trophyAgg}
          shotsLoading={shotsLoading}
          scope={scope}
        />
      )}

      <StablefordDetailSheet open={sheetOpen} onClose={() => setSheetOpen(false)} dist={dist} />
    </div>
  );
};

// ─── Card header (eyebrow/title/info only) ──────────────────────────────
interface CardHeaderProps {
  eyebrow: string;
  title: string;
  onOpenSheet: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ eyebrow, title, onOpenSheet }) => (
  <div style={{ paddingBottom: 0, position: 'relative' }}>
    <DarkSectionHeader
      eyebrow={eyebrow}
      title={title}
      right={
        <button
          type="button"
          onClick={onOpenSheet}
          aria-label="About this card"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 999,
            background: 'transparent',
            border: 'none',
            color: 'var(--hcp-t-60)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Info size={16} strokeWidth={2} />
        </button>
      }
    />
  </div>
);

// ─── Mode toggle ────────────────────────────────────────────────────────
const ModeToggle: React.FC<{ mode: Mode; setMode: (m: Mode) => void }> = ({ mode, setMode }) => (
  <div
    style={{
      display: 'inline-flex',
      background: 'var(--hcp-bg-2)',
      borderRadius: 999,
      padding: 2,
      gap: 2,
    }}
  >
    {(['points', 'shots'] as Mode[]).map((m) => {
      const active = mode === m;
      return (
        <button
          key={m}
          onClick={() => setMode(m)}
          aria-pressed={active}
          style={{
            padding: '5px 14px',
            background: active ? 'var(--hcp-bg-3)' : 'transparent',
            color: active ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            transition: 'background 160ms ease, color 160ms ease',
          }}
        >
          {m === 'points' ? 'POINTS' : 'SCORE STATS'}
        </button>
      );
    })}
  </div>
);

// ─── Scope toggle ───────────────────────────────────────────────────────
const ScopeToggle: React.FC<{
  scope: StablefordScope;
  setScope: (s: StablefordScope) => void;
}> = ({ scope, setScope }) => (
  <div
    style={{
      display: 'inline-flex',
      background: 'var(--hcp-bg-2)',
      borderRadius: 999,
      padding: 2,
      gap: 2,
    }}
  >
    {(['30d', '90d', 'all'] as StablefordScope[]).map((s) => (
      <button
        key={s}
        onClick={() => setScope(s)}
        aria-pressed={scope === s}
        style={{
          padding: '4px 11px',
          borderRadius: 999,
          background: scope === s ? 'var(--hcp-bg-3)' : 'transparent',
          color: scope === s ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.06em',
          transition: 'background 160ms ease, color 160ms ease',
        }}
      >
        {SCOPE_BTN_LABEL[s]}
      </button>
    ))}
  </div>
);

// ─── Points body ────────────────────────────────────────────────────────
interface PointsBodyProps {
  dist: ReturnType<typeof computeStablefordDistribution>;
  scope: StablefordScope;
  scoringRange: { worst: number; median: number; best: number } | null;
}

const PointsBody: React.FC<PointsBodyProps> = ({ dist, scope, scoringRange }) => {
  if (dist.insufficientData) {
    return (
      <div style={{ padding: '24px 16px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
          Add a few more rounds
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
          We need at least 3 rounds with Stableford
          {scope !== 'all' ? ` in ${SCOPE_LABEL_LONG[scope].toLowerCase()}` : ''} to show your distribution. You have {dist.total} so far.
        </p>
      </div>
    );
  }

  const avg = dist.avg ?? 0;
  const delta = dist.deltaVsPrev;
  const showDelta = delta !== null && Math.abs(delta) >= 0.05;
  const prevLabel =
    scope === '30d' ? 'vs prior 30D' :
    scope === '90d' ? 'vs prior 90D' :
    null;

  const POINTS_GOOD = '#55BD8B';
  const POINTS_AMBER = 'var(--hcp-amber, #F7931E)';
  const POINTS_OFF = 'rgba(242,244,247,0.22)';
  const POINTS_BAD = 'var(--hcp-bad)';

  const bands = [
    { key: 'zone', count: dist.inZoneCount, color: POINTS_GOOD },
    { key: 'solid', count: dist.solidCount, color: POINTS_AMBER },
    { key: 'off', count: dist.offDayCount, color: POINTS_OFF },
  ];

  const scopeShort = scope === '30d' ? '30D' : scope === '90d' ? '90D' : 'ALL';

  return (
    <>
      {/* Header micro-row */}
      <div
        style={{
          padding: '12px 16px 0',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: T.inkMute,
            fontFamily: FONT,
          }}
        >
          {SCOPE_LABEL_LONG[scope]}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: T.ink40,
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {dist.total} ROUNDS
        </span>
      </div>

      {/* Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 4px' }}>
        <DistributionRing
          segments={bands.map((b): RingSegment => ({ l: b.key, v: b.count, c: b.color }))}
          centre={
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: CHART.INK,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {avg.toFixed(1)}
            </span>
          }
          sub={`PTS AVG \u00B7 ${scopeShort}`}
          delta={
            showDelta && delta !== null
              ? {
                  text: `${delta > 0 ? '+' : '\u2212'}${Math.abs(delta).toFixed(1)} VS PRIOR`,
                  // MORE points is BETTER: pointsTone reads before-then-after
                  // and owns the polarity, so no argument swapping here.
                  tone: pointsTone(avg - delta, avg),
                }
              : undefined
          }
        />
      </div>

      {/* Band chips */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 8 }}>
        {[
          { label: 'IN THE ZONE', range: '36+ PTS', count: dist.inZoneCount, color: POINTS_GOOD },
          { label: 'SOLID', range: '33–35 PTS', count: dist.solidCount, color: POINTS_AMBER },
          { label: 'OFF DAY', range: '<33 PTS', count: dist.offDayCount, color: T.inkMute },
        ].map((c) => {
          const isZero = c.count === 0;
          return (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 11,
                padding: '9px 0 8px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid var(--hcp-line)',
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: isZero ? T.inkMute : c.color,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {c.count}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: T.ink40,
                  letterSpacing: '0.12em',
                  marginTop: 6,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: 'rgba(242,244,247,0.28)',
                  letterSpacing: '0.10em',
                  marginTop: 3,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {c.range}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring range strip */}
      {scoringRange && (
        <div style={{ padding: '0 16px 16px' }}>
          <ScoringRangeBlock range={scoringRange} />
        </div>
      )}
    </>
  );
};

interface KeyCellProps {
  color: string;
  label: string;
  meta: string;
}

const KeyCell: React.FC<KeyCellProps> = ({ color, label, meta }) => (
  <div style={{ textAlign: 'center', padding: '0 4px', fontFamily: FONT }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: T.ink,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        marginBottom: 3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}
      />
      {label}
    </div>
    <div
      style={{
        fontSize: 10.5,
        color: T.inkMute,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {meta}
    </div>
  </div>
);

// ─── Scoring range block (points mode) ──────────────────────────────────
const ScoringRangeBlock: React.FC<{
  range: { worst: number; median: number; best: number };
}> = ({ range }) => {
  const span = range.best - range.worst;
  const showMarker = span > 0;
  const rawPct = showMarker ? ((range.median - range.worst) / span) * 100 : 0;
  const markerPct = Math.min(98, Math.max(2, rawPct));

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--hcp-line)',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            color: T.inkMute,
            letterSpacing: '0.14em',
          }}
        >
          SCORING RANGE
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            color: T.ink40,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.10em',
          }}
        >
          {range.worst} — {range.best} PTS
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 5,
          borderRadius: 99,
          background:
            'linear-gradient(90deg, rgba(242,244,247,0.10) 0%, rgba(247,147,30,0.45) 50%, rgba(85,189,139,0.75) 100%)',
          overflow: 'visible',
        }}
      >
        {showMarker && (
          <div
            style={{
              position: 'absolute',
              top: -3,
              left: `${markerPct}%`,
              transform: 'translateX(-50%)',
              width: 3,
              height: 11,
              borderRadius: 2,
              background: '#FFFFFF',
            }}
            aria-label={`Median ${range.median} points`}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.10em',
          color: T.ink40,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>
          <span style={{ color: T.ink40 }}>{range.worst}</span> WORST
        </span>
        <span style={{ color: T.inkMute }}>
          <span style={{ color: T.inkMute }}>{range.median}</span> MEDIAN
        </span>
        <span>
          <span style={{ color: T.ink40 }}>{range.best}</span> BEST
        </span>
      </div>
    </div>
  );
};



// ─── Shots body ─────────────────────────────────────────────────────────
import type { TrophyAggregates } from '@/lib/whs/api';

interface ShotsBodyProps {
  trophyAgg: TrophyAggregates | null | undefined;
  shotsLoading: boolean;
  scope: StablefordScope;
}

const ShotsBody: React.FC<ShotsBodyProps> = ({ trophyAgg, shotsLoading, scope }) => {
  // 1. Loading skeleton
  if (shotsLoading) {
    return (
      <div style={{ padding: '16px' }}>
        <Skeleton
          variant="dark"
          style={{
            height: 50,
            borderRadius: 12,
            marginBottom: 12,
          }}
        />
        <Skeleton
          variant="dark"
          style={{ height: 16, borderRadius: 6, marginBottom: 8 }}
        />
        <Skeleton
          variant="dark"
          style={{ height: 16, borderRadius: 6, marginBottom: 8 }}
        />
        <Skeleton
          variant="dark"
          style={{ height: 16, borderRadius: 6 }}
        />
      </div>
    );
  }

  const hs = trophyAgg?.hole_stats;
  const roundsWithHoles = hs?.rounds_with_holes_in_window ?? 0;
  const totalRounds = hs?.total_rounds_count ?? 0;

  // 2. No hole data at all
  if (!hs || roundsWithHoles === 0) {
    return (
      <div style={{ padding: '24px 16px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
          Hole data needed
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
          We don&apos;t have hole-by-hole data for this window. Older rounds didn&apos;t ship with hole detail.
        </p>
      </div>
    );
  }

  // 3. Not enough rounds with holes
  if (roundsWithHoles < 3) {
    return (
      <div style={{ padding: '24px 16px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
          Add a few more rounds with hole data
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
          We need at least 3 rounds with hole-by-hole detail. You have {roundsWithHoles} so far.
        </p>
      </div>
    );
  }

  const aces = hs.aces_count_window ?? 0;
  const albatross = hs.albatross_count_window ?? 0;
  const eagles = hs.eagles_count_window ?? 0;
  const birdies = hs.birdies_count_window ?? 0;
  const pars = hs.pars_count ?? 0;
  const bogey = hs.bogey_count ?? 0;
  const doublePlus = hs.double_plus_count ?? 0;
  const totalHoles = hs.total_holes_in_window ?? 0;

  const eaglePlusCount = aces + albatross + eagles;
  const birdiesOrBetter = eaglePlusCount + birdies;
  const pctBirdiesOrBetter = totalHoles > 0 ? Math.round((birdiesOrBetter / totalHoles) * 1000) / 10 : 0;

  const prevBob = hs.birdies_or_better_prev_window;
  const delta = prevBob != null ? birdiesOrBetter - prevBob : null;
  const showDelta = scope !== 'all' && delta !== null && delta !== 0;

  // Segment definitions
  type Segment = {
    key: string;
    count: number;
    background: string;
    border?: string;
    textColor: string;
  };
  const allSegments: Segment[] = [
    { key: 'birdiePlus', count: birdiesOrBetter, background: HOLE_C.birdie, textColor: '#FFFFFF' },
    { key: 'par',        count: pars,            background: HOLE_C.par,    textColor: '#FFFFFF' },
    { key: 'bogey',      count: bogey,           background: HOLE_C.bogey,  textColor: '#FFFFFF' },
    { key: 'double',     count: doublePlus,      background: HOLE_C.double, textColor: '#FFFFFF' },
  ];

  const segments = allSegments.filter((s) => s.count > 0);
  const segTotal = segments.reduce((acc, s) => acc + s.count, 0) || 1;



  // Ring bands, order: birdie+, par, bogey, double+
  const bands = [
    { key: 'birdiePlus', count: birdiesOrBetter, color: SC_BIRDIE_DARK },
    { key: 'par',        count: pars,            color: SC_PAR_DARK },
    { key: 'bogey',      count: bogey,           color: SC_BOGEY_DARK },
    { key: 'double',     count: doublePlus,      color: SC_DOUBLE_DARK },
  ];

  return (
    <>
      {/* Header micro-row */}
      <div
        style={{
          padding: '12px 16px 0',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: T.inkMute,
            fontFamily: FONT,
          }}
        >
          {SCOPE_LABEL_LONG[scope]}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: T.ink40,
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {totalHoles} HOLES · {roundsWithHoles} ROUNDS
        </span>
      </div>

      {/* Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 4px' }}>
        <DistributionRing
          segments={bands.map((b): RingSegment => ({ l: b.key, v: b.count, c: b.color }))}
          centre={
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: SC_BIRDIE_DARK,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {birdiesOrBetter}
            </span>
          }
          sub={`BIRDIE+ \u00B7 ${pctBirdiesOrBetter.toFixed(1)}%`}
          delta={
            showDelta && delta !== null
              ? {
                  text: `${delta > 0 ? '+' : '\u2212'}${Math.abs(delta)} VS PRIOR`,
                  // MORE birdies is BETTER -- pointsTone, before then after.
                  tone: pointsTone(birdiesOrBetter - delta, birdiesOrBetter),
                }
              : undefined
          }
        />
      </div>

      {/* Band chips */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 6 }}>
        {[
          { label: 'BIRDIE+', count: birdiesOrBetter, color: SC_BIRDIE_DARK, isPar: false },
          { label: 'PAR', count: pars, color: SC_PAR_DARK, isPar: true },
          { label: 'BOGEY', count: bogey, color: SC_BOGEY_DARK, isPar: false },
          { label: 'DOUBLE+', count: doublePlus, color: SC_DOUBLE_DARK, isPar: false },
        ].map((c) => {
          const pctRaw = totalHoles > 0 ? (c.count / totalHoles) * 100 : 0;
          const pct = pctRaw < 10 ? pctRaw.toFixed(1) : Math.round(pctRaw).toString();
          const isZero = c.count === 0;
          const countColor = isZero ? T.ink40 : (c.isPar ? T.ink : c.color);
          const labelColor = c.isPar ? T.ink40 : c.color;
          return (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 11,
                padding: '9px 0 8px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid var(--hcp-line)',
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: countColor,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {formatNumber(c.count)}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: labelColor,
                  letterSpacing: '0.12em',
                  marginTop: 6,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: 'rgba(242,244,247,0.28)',
                  letterSpacing: '0.10em',
                  marginTop: 3,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Career milestones ladder */}
      <div style={{ padding: '16px' }}>
        <MilestoneLadder
          aces={aces}
          albatross={albatross}
          eagles={eagles}
          birdies={birdies}
          totalRoundsWithHoles={roundsWithHoles}
        />
      </div>
    </>
  );
};

// Ring geometry now lives in the shared DistributionRing primitive.


interface Band {
  key: string;
  count: number;
  color: string;
}

// ─── Milestone ladder ───────────────────────────────────────────────────
interface MilestoneLadderProps {
  aces: number;
  albatross: number;
  eagles: number;
  birdies: number;
  totalRoundsWithHoles: number;
}

const GOOD = 'var(--hcp-good, #55BD8B)';

// Convert #RRGGBB to rgba() with given alpha for row tint / soft accents
const hexToRgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const MilestoneLadder: React.FC<MilestoneLadderProps> = ({
  aces,
  albatross,
  eagles,
  birdies,
  totalRoundsWithHoles,
}) => {
  const unlockedCount = [aces, albatross, eagles, birdies].filter((c) => c > 0).length;
  const perRound = (count: number) =>
    totalRoundsWithHoles > 0 ? (count / totalRoundsWithHoles).toFixed(2) : '0.00';

  // Rarest first. Each row carries its own color from the scorecard dark palette
  // (matches RoundDetailSheet / scorecard bottom sheet).
  const rows = [
    {
      key: 'hio',
      name: 'Hole-in-One',
      count: aces,
      tier: 'ULTRA RARE',
      odds: '1-in-12,500',
      color: SC_ACE_DARK,
    },
    {
      key: 'albatross',
      name: 'Albatross',
      count: albatross,
      tier: 'ULTRA RARE',
      odds: '1-in-6M',
      color: SC_ALBATROSS_DARK,
    },
    {
      key: 'eagles',
      name: 'Eagles',
      count: eagles,
      tier: 'RARE',
      odds: null as string | null,
      color: SC_EAGLE_DARK,
    },
    {
      key: 'birdies',
      name: 'Birdies',
      count: birdies,
      tier: 'FREQUENT',
      odds: birdies > 0 || totalRoundsWithHoles > 0 ? `${perRound(birdies)}/round` : null,
      color: SC_BIRDIE_DARK,
    },
  ];

  // Ink for badge text on the (light gold / warm red) dark-palette swatches.
  const BADGE_INK = 'rgba(0,0,0,0.85)';

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '0 2px',
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: T.inkMute,
            fontFamily: FONT,
          }}
        >
          CAREER MILESTONES
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.10em',
            color: T.ink40,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: unlockedCount > 0 ? SC_BIRDIE_DARK : T.inkMute,
            }}
          >
            {unlockedCount}
          </span>{' '}
          OF {rows.length} UNLOCKED
        </span>
      </div>

      {/* Ladder container */}
      <div
        style={{
          background: 'var(--hcp-bg-2)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 13,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => {
          const unlocked = row.count > 0;
          return (
            <div
              key={row.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderTop: i === 0 ? 'none' : '1px solid var(--hcp-line)',
                background: unlocked ? hexToRgba(row.color, 0.06) : 'transparent',
                fontFamily: FONT,
              }}
            >
              {/* Badge */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                  background: unlocked ? row.color : 'transparent',
                  color: unlocked ? BADGE_INK : T.ink40,
                  border: unlocked ? 'none' : '1.5px dashed rgba(242,244,247,0.25)',
                }}
              >
                {row.count}
              </div>

              {/* Text column */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: unlocked ? T.ink : T.inkMute,
                    lineHeight: 1.15,
                  }}
                >
                  {row.name}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                  }}
                >
                  <span
                    style={{
                      color: unlocked ? row.color : 'rgba(242,244,247,0.45)',
                    }}
                  >
                    {row.tier}
                  </span>
                  {row.odds ? (
                    <span style={{ color: T.ink40, fontWeight: 700 }}> · {row.odds}</span>
                  ) : !unlocked ? (
                    <span style={{ color: T.ink40, fontWeight: 700 }}> · none yet</span>
                  ) : null}
                </div>
              </div>

              {/* Right count */}
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: unlocked ? row.color : 'rgba(242,244,247,0.22)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {row.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StablefordCard;

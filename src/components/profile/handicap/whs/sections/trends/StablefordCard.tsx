import React, { useState, useMemo } from 'react';
import { Info, ArrowUp, ArrowDown } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import {
  computeStablefordDistribution,
  type StablefordScope,
} from './computeStablefordDistribution';
import StablefordDetailSheet from './StablefordDetailSheet';
import SectionHeader from '../SectionHeader';
import { useTrophyAggregates } from '@/lib/whs/hooks';

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
  redInk: '#DC2626',
  redSoft: 'rgba(159,29,29,0.12)',
  ringTrack: 'var(--hcp-bg-3)',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const HOLE_C = {
  birdie: '#9F1D1D',
  par: '#94A3B8',
  bogey: '#2563EB',
  double: '#1E3A5F',
};

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 14,
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
          padding: '10px 16px 0',
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
  <div style={{ paddingBottom: 0 }}>
    <SectionHeader
      eyebrow={eyebrow}
      title={title}
      right={
        <button
          onClick={onOpenSheet}
          aria-label="Open Stableford detail sheet"
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            border: `1px solid ${T.hairline}`,
            background: 'transparent',
            color: T.inkMute,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Info size={13} strokeWidth={2.2} />
        </button>
      }
    />
  </div>
);

// ─── Mode toggle ────────────────────────────────────────────────────────
const ModeToggle: React.FC<{ mode: Mode; setMode: (m: Mode) => void }> = ({ mode, setMode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 4,
      padding: 3,
      background: T.ink04,
      borderRadius: 12,
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
            padding: '9px 8px',
            borderRadius: 9,
            background: active ? T.ink : 'transparent',
            color: active ? 'var(--hcp-bg-1)' : T.ink70,
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
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
      background: T.ink04,
      borderRadius: 99,
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
          padding: '4px 9px',
          borderRadius: 99,
          background: scope === s ? T.ink : 'transparent',
          color: scope === s ? 'var(--hcp-bg-1)' : T.ink70,
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.06em',
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
      <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
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

  const GREEN_GRAD = 'var(--hcp-good-deep)';
  const AMBER_GRAD = 'var(--hcp-bg-3)';
  const RED_GRAD = 'var(--hcp-bad)';

  const segs = [
    { count: dist.inZoneCount, gradient: GREEN_GRAD },
    { count: dist.solidCount, gradient: AMBER_GRAD },
    { count: dist.offDayCount, gradient: RED_GRAD },
  ].filter((s) => s.count > 0);


  return (
    <>
      {/* Hero: AVG number + delta pill */}
      <div style={{ padding: '14px 20px 12px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: T.inkMute,
            fontFamily: FONT,
          }}
        >
          AVG · {SCOPE_LABEL_LONG[scope]}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 200,
              color: T.ink,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {avg.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: T.inkMute, fontFamily: FONT }}>pts avg</span>
          {showDelta && delta !== null && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 999,
                background: delta > 0 ? T.greenSoft : T.redSoft,
                color: delta > 0 ? T.greenInk : T.redInk,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: FONT,
              }}
            >
              {delta > 0 ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
              {Math.abs(delta).toFixed(1)} {prevLabel}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal segmented bar */}
      <div style={{ padding: '0 20px 16px' }}>
        <div
          style={{
            display: 'flex',
            height: 48,
            borderRadius: 12,
            overflow: 'hidden',
            background: T.ink04,
            
          }}
          role="img"
          aria-label={`Distribution: ${dist.inZoneCount} in zone, ${dist.solidCount} solid, ${dist.offDayCount} off`}
        >
          {segs.map((s, i) => (
            <div
              key={i}
              style={{
                flex: s.count,
                background: s.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: FONT,
                fontVariantNumeric: 'tabular-nums',
                transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {s.count > dist.total * 0.1 ? `${s.count}` : ''}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${Math.max(dist.inZoneCount, 0.5)}fr ${Math.max(dist.solidCount, 0.5)}fr ${Math.max(dist.offDayCount, 0.5)}fr`,
            gap: 0,
            marginTop: 10,
            fontFamily: FONT,
          }}
        >
          <KeyCell color={T.green} label="IN THE ZONE" meta={`36+ · ${dist.inZonePct}%`} />
          <KeyCell color={T.amber} label="SOLID" meta={`33–35 · ${dist.solidPct}%`} />
          <KeyCell color={T.red} label="OFF DAY" meta={`<33 · ${dist.offDayPct}%`} />
        </div>

        {/* 4e — Scoring range block */}
        {scoringRange && <ScoringRangeBlock range={scoringRange} avg={avg} />}
      </div>
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
  avg: number;
}> = ({ range, avg }) => {
  const span = Math.max(range.best - range.worst, 1);
  const markerPct = Math.min(100, Math.max(0, ((avg - range.worst) / span) * 100));

  return (
    <div style={{ marginTop: 18 }}>
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
            color: T.ink40,
            letterSpacing: '0.14em',
            fontFamily: FONT,
          }}
        >
          SCORING RANGE
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.inkMute,
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
          }}
        >
          {range.worst} — {range.best} pts
        </span>
      </div>

      {/* Track */}
      <div
        style={{
          position: 'relative',
          height: 5,
          borderRadius: 99,
          background: 'rgba(15,23,42,0.06)',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 99,
            background:
              'linear-gradient(90deg, #DC2626 0%, #F59E0B 50%, #22C55E 100%)',
            opacity: 0.85,
          }}
        />
        {/* Marker */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: `${markerPct}%`,
            transform: 'translateX(-50%)',
            width: 4,
            height: 13,
            borderRadius: 2,
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15,23,42,0.35)',
          }}
          aria-label={`Average ${avg.toFixed(1)} points`}
        />
      </div>

      {/* Axis */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          marginTop: 10,
          fontFamily: FONT,
        }}
      >
        <RangeAxisCell value={range.worst} label="WORST" align="flex-start" />
        <RangeAxisCell value={range.median} label="MEDIAN" align="center" />
        <RangeAxisCell value={range.best} label="BEST" align="flex-end" />
      </div>
    </div>
  );
};

const RangeAxisCell: React.FC<{
  value: number;
  label: string;
  align: 'flex-start' | 'center' | 'flex-end';
}> = ({ value, label, align }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: T.ink,
        fontFamily: FONT,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: T.ink40,
        letterSpacing: '0.08em',
        marginTop: 2,
        fontFamily: FONT,
      }}
    >
      {label}
    </span>
  </div>
);

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
      <div style={{ padding: '16px 20px 20px' }}>
        <div
          className="animate-pulse"
          style={{
            height: 50,
            borderRadius: 12,
            background: T.ink04,
            marginBottom: 12,
          }}
        />
        <div
          className="animate-pulse"
          style={{ height: 16, borderRadius: 6, background: T.ink04, marginBottom: 8 }}
        />
        <div
          className="animate-pulse"
          style={{ height: 16, borderRadius: 6, background: T.ink04, marginBottom: 8 }}
        />
        <div
          className="animate-pulse"
          style={{ height: 16, borderRadius: 6, background: T.ink04 }}
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
      <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
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
      <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
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


  // Footnote
  const footnoteHtml =
    roundsWithHoles === totalRounds
      ? `<strong>${pctBirdiesOrBetter}%</strong> of holes are birdie or better.`
      : `Hole-by-hole data from <strong>${roundsWithHoles} of ${totalRounds} rounds</strong>. <strong>${pctBirdiesOrBetter}%</strong> of holes are birdie or better.`;

  return (
    <>
      {/* Hero */}
      <div style={{ padding: '14px 20px 0' }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: T.inkMute,
            fontFamily: FONT,
          }}
        >
          BIRDIES OR BETTER
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 200,
              color: HOLE_C.birdie,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {birdiesOrBetter}
          </span>
          <span style={{ fontSize: 12, color: T.inkMute, fontFamily: FONT }}>
            in {totalHoles} holes · {pctBirdiesOrBetter}%
          </span>
          {showDelta && delta !== null && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 999,
                background: delta > 0 ? T.greenSoft : T.redSoft,
                color: delta > 0 ? T.greenInk : T.redInk,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: FONT,
              }}
            >
              {delta > 0 ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
              {Math.abs(delta)} vs prior
            </span>
          )}
        </div>
      </div>

      {/* 4-segment bar */}
      <div style={{ padding: '0 18px' }}>
        <div style={{ margin: '16px 0 0' }}>
          <div
            style={{
              display: 'flex',
              gap: 2,
              height: 50,
              borderRadius: 12,
              overflow: 'hidden',
            }}
            role="img"
            aria-label={`Hole distribution: ${birdiesOrBetter} birdies or better, ${pars} pars, ${bogey} bogeys, ${doublePlus} double+`}
          >
            {segments.map((s) => (
              <div
                key={s.key}
                style={{
                  flex: s.count,
                  background: s.background,
                  border: s.border,
                  transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Key row — 4 cols, count big + pct small */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 4,
            margin: '14px 0 0',
          }}
        >
          {[
            { label: 'BIRDIE+', count: birdiesOrBetter, color: HOLE_C.birdie },
            { label: 'PAR', count: pars, color: HOLE_C.par },
            { label: 'BOGEY', count: bogey, color: HOLE_C.bogey },
            { label: 'DOUBLE+', count: doublePlus, color: HOLE_C.double },
          ].map((cell) => {
            const pctRaw = segTotal > 0 ? (cell.count / segTotal) * 100 : 0;
            const pct = pctRaw < 10 ? pctRaw.toFixed(1) : Math.round(pctRaw).toString();
            const isZero = cell.count === 0;
            return (
              <div key={cell.label} style={{ textAlign: 'center', fontFamily: FONT, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: cell.color,
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cell.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: isZero ? 400 : 800,
                    color: isZero ? 'var(--hcp-t-40)' : cell.color,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginTop: 7,
                  }}
                >
                  {cell.count.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--hcp-t-40)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.04em',
                    marginTop: 4,
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>


        {/* Footnote */}
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 11.5,
            lineHeight: 1.55,
            color: T.inkMute,
            fontFamily: FONT,
          }}
          dangerouslySetInnerHTML={{ __html: footnoteHtml }}
        />
      </div>

      {/* Career milestones */}
      <div style={{ padding: '18px 18px 18px' }}>
        <MilestonesStrip
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

// ─── Milestones strip ───────────────────────────────────────────────────
interface MilestonesStripProps {
  aces: number;
  albatross: number;
  eagles: number;
  birdies: number;
  totalRoundsWithHoles: number;
}

const MilestonesStrip: React.FC<MilestonesStripProps> = ({
  aces,
  albatross,
  eagles,
  birdies,
  totalRoundsWithHoles,
}) => {
  const unlockedCount = [aces, albatross, eagles, birdies].filter((c) => c > 0).length;
  const rate = (count: number) =>
    totalRoundsWithHoles > 0 ? (count / totalRoundsWithHoles).toFixed(2) : '0.00';

  const rows = [
    {
      key: 'hio',
      name: 'Hole-in-One',
      count: aces,
      rarity: 'ULTRA RARE',
      rings: 2,
      meta: aces > 0 ? `${aces} career` : 'none yet · 1-in-12,500 odds',
    },
    {
      key: 'albatross',
      name: 'Albatross',
      count: albatross,
      rarity: 'ULTRA RARE',
      rings: 2,
      meta:
        albatross > 0
          ? `${rate(albatross)}/round · ${albatross} career`
          : 'none yet · 1-in-6,000 odds',
    },
    {
      key: 'eagles',
      name: 'Eagles',
      count: eagles,
      rarity: 'RARE',
      rings: 1,
      meta: eagles > 0 ? `${rate(eagles)}/round` : 'none yet',
    },
    {
      key: 'birdies',
      name: 'Birdies',
      count: birdies,
      rarity: 'FREQUENT',
      rings: 0,
      meta: birdies > 0 ? `${rate(birdies)}/round` : 'none yet',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 10,
          padding: '0 2px',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: T.ink40,
            fontFamily: FONT,
          }}
        >
          CAREER MILESTONES
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--hcp-t-40)',
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ color: T.amber, fontWeight: 800 }}>{unlockedCount}</span> of 4 unlocked
        </span>
      </div>

      {/* Container */}
      <div
        style={{
          borderRadius: 14,
          background:
            'linear-gradient(180deg, var(--hcp-bg-2) 0%, var(--hcp-bg-1) 100%)',
          border: '1px solid var(--hcp-line)',
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <MilestoneRow
            key={row.key}
            name={row.name}
            count={row.count}
            rarity={row.rarity}
            rings={row.rings}
            meta={row.meta}
            isLast={i === rows.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const MilestoneRow: React.FC<{
  name: string;
  count: number;
  rarity: string;
  rings: number;
  meta: string;
  isLast: boolean;
}> = ({ name, count, rarity, rings, meta, isLast }) => {
  const achieved = count > 0;
  const rarityColor = rarity === 'FREQUENT' ? 'var(--hcp-t-40)' : T.amber;

  // Stacked box-shadow rings — gaps painted in card bg so geometry stays clean
  // at small sizes (per brief: don't approximate with border/outline).
  const medalSize = 34;
  let medalBoxShadow = 'none';
  let medalMargin = 0;
  if (achieved && rings === 1) {
    medalBoxShadow =
      '0 0 0 2px var(--hcp-bg-1), 0 0 0 3.5px rgba(247,147,30,0.8)';
    medalMargin = 2;
  } else if (achieved && rings === 2) {
    medalBoxShadow =
      '0 0 0 2px var(--hcp-bg-1), 0 0 0 3.5px rgba(247,147,30,0.9), 0 0 0 5px var(--hcp-bg-1), 0 0 0 6.5px rgba(247,147,30,0.6)';
    medalMargin = 4;
  }

  const medalStyle: React.CSSProperties = achieved
    ? {
        width: medalSize,
        height: medalSize,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #F7931E 0%, #BA6E12 100%)',
        color: '#1A0F02',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 800,
        fontFamily: FONT,
        fontVariantNumeric: 'tabular-nums',
        textShadow: 'none',
        boxShadow: medalBoxShadow,
        margin: medalMargin,
        flexShrink: 0,
      }
    : {
        width: medalSize,
        height: medalSize,
        borderRadius: '50%',
        background: 'var(--hcp-bg-2)',
        border: '1px dashed var(--hcp-line-2)',
        color: 'var(--hcp-t-30)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 800,
        fontFamily: FONT,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--hcp-line)',
        position: 'relative',
      }}
    >
      {achieved && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, #F7931E 0%, #BA6E12 100%)',
            opacity: 0.8,
          }}
        />
      )}

      <div style={medalStyle}>{count}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC', fontFamily: FONT }}>
            {name}
          </span>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: rarityColor,
              fontFamily: FONT,
            }}
          >
            {rarity}
          </span>
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--hcp-t-40)',
            marginTop: 2,
            fontFamily: FONT,
          }}
        >
          {meta}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 200,
            color: count > 0 ? T.amber : 'var(--hcp-t-30)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            fontFamily: FONT,
          }}
        >
          {count}
        </span>
      </div>
    </div>
  );
};

export default StablefordCard;

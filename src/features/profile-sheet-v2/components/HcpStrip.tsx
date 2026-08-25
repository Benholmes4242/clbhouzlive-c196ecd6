/**
 * ProfileSheetV2 · HcpStrip — the 90-day index trend card.
 *
 * ONE SUBJECT (the index), ONE INTERACTION (scrub the window), and a
 * zone-graded plot that carries colour rather than whispering it. The old
 * three-figure strip (HANDICAP / ROUNDS / INDEX MOVE) is gone; ROUNDS is
 * dropped entirely.
 *
 * THE AXIS IS NATURAL, NOT INVERTED. High index at the TOP, low at the
 * BOTTOM, so an improving index FALLS. Golfers say "I got my handicap DOWN
 * to 2" — a DIP IS A GOOD SPELL. Do not flip this on the theory that
 * "up = good"; it makes the values count backwards.
 *
 * COLOUR is INDEX_DELTA.light, via A.IMPROVED / A.DRIFTED. The index delta is
 * a MOVEMENT, not a score: never TOPAR_RED, never A.RED / A.GREEN, and never
 * the dark pair, which fails on white.
 *
 * GATING. A disabled React Query v5 query is PENDING with fetchStatus 'idle',
 * so `isLoading` is FALSE before it has ever run. Gating the connected /
 * unconnected choice on `!isLoading` reads `connection === undefined` as
 * "disconnected" and flashes the CONNECT card at a connected member on every
 * mount. We gate on isFetched, exactly as ChromeIsland:230-246 documents, and
 * while unsettled render NOTHING — no skeleton, no reserved height.
 *
 * Both states are the SAME HEIGHT, so connecting does not make the sheet
 * below jump.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { IndexMovementTriangle } from '@/components/explore-tab-new/friendRoundParts';
import { useWhsConnection, useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { A, KICKER, LABEL, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatDayMonthShortGB } from '@/i18n/format';
import { smoothPathXY } from '@/lib/charts/smoothPath';

interface Props {
  actorType: 'personal' | 'business';
  actorId: string;
  onNavigate: (route: string) => void;
}

// ---------------------------------------------------------------------------
// Fixed geometry. The two states share every band so the card cannot change
// height when a member connects.
// ---------------------------------------------------------------------------
const CARD_RADIUS = 12;
const HEADER_H = 26;
const FIGURE_H = 46;
const PLOT_H = 96;
const LEGEND_H = 18;
const PAD = 14;

const AMBER = A.AMBER;
const AMBER_TEXT = A.AMBER_DEEP;

interface Point { t: string; v: number }

/** Zone of a revision between the window's worst (0) and best (1) index. */
function zoneColor(v: number, best: number, worst: number): string {
  const span = worst - best;
  const toBest = span <= 0 ? 1 : (worst - v) / span;
  if (toBest >= 0.66) return A.IMPROVED;
  if (toBest >= 0.33) return AMBER;
  return A.DRIFTED;
}

function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}


/** Smooth polyline through points using cubic Bezier splines.
 *  NOW SHARED: the implementation lives in `@/lib/charts/smoothPath` so the
 *  round curves (RoundShape / TrajectoryLine) draw with the same tangent method
 *  and the same tension 0.25. Do not re-inline a local copy. */
const smoothPath = smoothPathXY;



// ---------------------------------------------------------------------------
// Shell — owns the border, the radius and the band heights. The plot is handed
// the full inner width so it can run EDGE TO EDGE to the card's own border.
// ---------------------------------------------------------------------------
const Shell: React.FC<{
  header: React.ReactNode;
  figure: React.ReactNode;
  plot: (width: number) => React.ReactNode;
  legend?: React.ReactNode;
  onClick?: () => void;
  plotRef?: React.Ref<HTMLDivElement>;
  plotHandlers?: React.HTMLAttributes<HTMLDivElement>;
}> = ({ header, figure, plot, legend, onClick, plotRef, plotHandlers }) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ margin: '12px 20px 0', fontFamily: SANS }}>
      <div
        ref={outerRef}
        onClick={onClick}
        style={{
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: CARD_RADIUS,
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <div style={{ padding: `${PAD}px ${PAD}px 0` }}>
          <div
            style={{
              height: HEADER_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            {header}
          </div>
          <div style={{ height: FIGURE_H, display: 'flex', alignItems: 'center', gap: 10 }}>
            {figure}
          </div>
        </div>
        <div
          ref={plotRef}
          style={{ height: PLOT_H, position: 'relative', touchAction: 'none' }}
          {...plotHandlers}
        >
          {width > 0 && plot(width)}
        </div>
        <div
          style={{
            height: LEGEND_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: `0 ${PAD}px`,
            marginBottom: PAD - 4,
          }}
        >
          {legend}
        </div>
      </div>
    </div>
  );
};

const LegendSwatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span style={{ width: 9, height: 9, borderRadius: 2.5, background: color }} />
    <span style={{ ...LABEL, fontSize: 11, letterSpacing: '0.1em', color: A.MUTE }}>{label}</span>
  </span>
);

// ---------------------------------------------------------------------------
// The unconnected card. Amber throughout, and NO FIGURES ANYWHERE — nothing
// on it may be mistaken for the member's own data. The kicker is
// FEDERATION-NEUTRAL: sixteen more governing bodies are pending, so nothing
// before a member picks a country may name England Golf.
// ---------------------------------------------------------------------------
const GhostCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <Shell
    onClick={onOpen}
    header={<span style={KICKER}>Official handicap index</span>}
    figure={
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK, lineHeight: 1.3 }}>
        Connect your official handicap
        <br />
        for stats, analytics and your circle.
      </div>
    }
    plot={(w) => {
      const h = PLOT_H;
      const pad = 2;
      // A sample improving trend: starts far from best (red), passes mid
      // (amber), and ends near best (green). It previews the real colour
      // system without pretending to be the member's own data.
      const ys = [0.78, 0.68, 0.72, 0.52, 0.46, 0.38, 0.28, 0.18];
      const ghostPoints = ys.map((r, i) => {
        const x = (i / (ys.length - 1)) * w;
        const y = pad + r * (h - pad * 2);
        return [x, y] as const;
      });
      const d = smoothPath(ghostPoints);
      const area = `${d} L${w},${h} L0,${h} Z`;

      return (
        <>
          <svg width={w} height={h} style={{ display: 'block' }} aria-hidden>
            <defs>
              <linearGradient id="hcp-ghost-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={A.DRIFTED} stopOpacity={0.26} />
                <stop offset="45%" stopColor={AMBER} stopOpacity={0.18} />
                <stop offset="100%" stopColor={A.IMPROVED} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hcp-ghost-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={A.DRIFTED} />
                <stop offset="48%" stopColor={AMBER} />
                <stop offset="100%" stopColor={A.IMPROVED} />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#hcp-ghost-fill)" />
            {/* The white halo is what stops the line reading flat on its own fill. */}
            <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={4.0} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="url(#hcp-ghost-stroke)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* The action sits INSIDE the plot on its baseline — the row the date
              ticks would use — so it costs no height. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: AMBER_TEXT,
            }}
          >
            <span style={{ ...LABEL, color: AMBER_TEXT }}>Connect your handicap</span>
            <ChevronRight size={12} strokeWidth={2.6} />
          </div>
        </>
      );
    }}
    legend={
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LegendSwatch color={A.DRIFTED} label="Off best" />
        <LegendSwatch color={AMBER} label="Mid" />
        <LegendSwatch color={A.IMPROVED} label="Near best" />
      </div>
    }
  />
);

// ---------------------------------------------------------------------------
// The connected card.
// ---------------------------------------------------------------------------
const TrendCard: React.FC<{
  points: Point[];
  windowDays: 30 | 90;
  onWindow: (d: 30 | 90) => void;
  fallbackIndex: number | null;
  onNavigate: (route: string) => void;
}> = ({ points, windowDays, onWindow, fallbackIndex, onNavigate }) => {
  const [scrub, setScrub] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const n = points.length;
  const active = scrub == null ? n - 1 : Math.min(Math.max(scrub, 0), n - 1);

  // Delta: last minus first across the window. Unchanged arithmetic.
  const delta = n >= 2 ? points[n - 1].v - points[0].v : null;
  const deltaTone = delta == null || Math.abs(delta) < 0.05
    ? A.DIM
    : delta < 0 ? A.IMPROVED : A.DRIFTED;

  const headIndex = n > 0 ? points[active].v : fallbackIndex;
  const headDate = n > 0 ? formatDayMonthShortGB(points[active].t) : null;

  const moveTo = useCallback((clientX: number) => {
    const el = plotRef.current;
    if (!el || n < 2) return;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left) / Math.max(1, r.width);
    setScrub(Math.round(Math.min(1, Math.max(0, ratio)) * (n - 1)));
  }, [n]);

  // Move and up listeners live on WINDOW, not the element — otherwise the
  // scrub drops the moment a thumb leaves the plot bounds. Release does NOT
  // reset: the member can park the marker on any revision.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      moveTo(e.clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [moveTo]);

  // The window changed under us — park back on the latest revision.
  useEffect(() => { setScrub(null); }, [windowDays, n]);

  const stats = useMemo(() => {
    if (n === 0) return null;
    const vals = points.map((p) => p.v);
    return { best: Math.min(...vals), worst: Math.max(...vals) };
  }, [points, n]);

  return (
    <Shell
      plotRef={plotRef}
      plotHandlers={{
        onPointerDown: (e) => {
          if (n < 2) return;
          dragging.current = true;
          moveTo(e.clientX);
        },
      }}
      header={
        <>
          <span style={KICKER}>Handicap index</span>
          <span style={{ display: 'inline-flex', gap: 2, background: A.TRACK, borderRadius: 7, padding: 2 }}>
            {([30, 90] as const).map((d) => {
              const on = windowDays === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onWindow(d)}
                  style={{
                    border: 'none',
                    background: on ? A.PANEL : 'transparent',
                    borderRadius: 5,
                    padding: '3px 9px',
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: on ? A.INK : A.DIM,
                    boxShadow: on ? `0 1px 2px ${A.BORDER}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {d}D
                </button>
              );
            })}
          </span>
        </>
      }
      figure={
        <>
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '-0.05em',
              color: A.INK,
              lineHeight: 1,
              ...FIGS,
            }}
          >
            {headIndex != null ? formatIndex(headIndex) : '\u2014'}
          </span>
          {headDate && <span style={{ ...LABEL, paddingBottom: 2 }}>{headDate}</span>}
          {delta != null && (
            <span
              style={{
                marginLeft: 'auto',
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                ...FIGS,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                background:
                  deltaTone === A.IMPROVED
                    ? 'rgba(15,143,74,0.14)'
                    : deltaTone === A.DRIFTED
                      ? 'rgba(200,55,43,0.14)'
                      : 'rgba(162,169,178,0.14)',
                border: `1px solid ${
                  deltaTone === A.IMPROVED
                    ? 'rgba(15,143,74,0.28)'
                    : deltaTone === A.DRIFTED
                      ? 'rgba(200,55,43,0.28)'
                      : 'rgba(162,169,178,0.28)'
                }`,
                color: deltaTone,
                boxShadow: `0 2px 8px ${deltaTone}26`,
              }}
            >
              {Math.abs(delta) >= 0.05 && (
                <IndexMovementTriangle
                  direction={delta < 0 ? 'down' : 'up'}
                  color={deltaTone}
                  size={7}
                />
              )}
              {Math.abs(delta).toFixed(1)}
            </span>
          )}
        </>
      }
      plot={(w) => {
        if (n < 2 || !stats) return null;
        const h = PLOT_H;
        const padY = 16;
        const padX = 11;
        const span = stats.worst - stats.best || 1;
        // NATURAL AXIS: high index at the TOP. A dip is a good spell.
        // 16px vertical headroom at each end guarantees the high/low callouts
        // never clip out of the plot.
        const xy = points.map((p, i) => {
          const x = padX + (i / (n - 1)) * (w - 2 * padX);
          const y = padY + ((stats.worst - p.v) / span) * (h - padY * 2);
          return [x, y] as const;
        });
        const line = smoothPath(xy);
        const area = `${line} L${w - padX},${h} L${padX},${h} Z`;

        const mx = xy[active][0];
        const my = xy[active][1];
        const markerTone = zoneColor(points[active].v, stats.best, stats.worst);

        // CALLOUTS: the high and the low, on the curve, no axis furniture.
        // A flat window has no extremes — draw neither. Tied extremes label
        // their FIRST occurrence only.
        const flat = stats.worst - stats.best <= 0;
        const worstIdx = flat ? -1 : points.findIndex((p) => p.v === stats.worst);
        const bestIdx = flat ? -1 : points.findIndex((p) => p.v === stats.best);

        // COLLISION GUARD for two labels that are now both above their dots.
        // When the extremes are close in x AND close in y (the flat-index
        // case: a settled handicap whose high and low are a few days and a
        // few tenths apart) the two callouts would sit on top of each other.
        // We nudge the LOW one horizontally AWAY from the high one rather
        // than suppressing it — both figures stay readable, and neither
        // moves below its dot into the legend row again.
        let lowShift = 0;
        if (worstIdx >= 0 && bestIdx >= 0) {
          const dx = xy[bestIdx][0] - xy[worstIdx][0];
          const dy = Math.abs(xy[bestIdx][1] - xy[worstIdx][1]);
          if (Math.abs(dx) < 46 && dy < 16) lowShift = dx >= 0 ? 24 : -24;
        }

        const callout = (idx: number, kind: 'high' | 'low', xShift = 0) => {
          if (idx < 0) return null;
          const [cx, cy] = xy[idx];
          const tone = zoneColor(points[idx].v, stats.best, stats.worst);
          const onMarker = idx === active;
          // Horizontal edge guard: the last revision is often the best, so the
          // right-hand rim is hit immediately. Anchor into the plot by 2px.
          const lx = Math.min(Math.max(cx + xShift, padX), w - padX);
          const nearLeft = lx <= padX + 18;
          const nearRight = lx >= w - padX - 18;
          const anchor = nearLeft ? 'start' : nearRight ? 'end' : 'middle';
          const tx = nearLeft ? 2 : nearRight ? w - 2 : lx;
          // Vertical placement: BOTH labels sit ABOVE their dot. This
          // overturns the earlier rule — "high is always above its dot, low
          // always below" — which existed for two reasons: symmetry, and
          // clip-safety at both edges (PAD_Y = 16 reserved headroom top AND
          // bottom, so neither direction could clip). Ben has chosen both
          // above, so the low label no longer risks the OFF BEST / MID / NEAR
          // BEST legend row beneath the plot; instead it enters the plot area,
          // and the two guards above (horizontal nudge) and below (y clamp at
          // 9px) keep it clear of the other label and of the top edge.
          const ty = Math.max(cy - 8, 9);
          return (
            <g key={idx} opacity={onMarker ? 0.42 : 1}>
              {/* When today IS the extreme, the scrub marker owns the point:
                  one dot, not two stacked. */}
              {!onMarker && (
                <circle cx={cx} cy={cy} r={3.4} fill={tone} stroke="#FFFFFF" strokeWidth={1.6} />
              )}
              <text
                x={tx}
                y={ty}
                textAnchor={anchor}
                fill={tone}
                /* Extreme-value labels are READ figures (the high/low index), not axis
                   ticks, so they take the 11px floor rather than the 10px axis
                   exception. */
                style={{ fontSize: 11, fontWeight: 700, ...FIGS }}
              >
                {formatIndex(points[idx].v)}
              </text>
            </g>
          );
        };

        return (
          <svg width={w} height={h} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="hcp-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={deltaTone} stopOpacity={0.42} />
                <stop offset="100%" stopColor={deltaTone} stopOpacity={0.03} />
              </linearGradient>
              {/* One stop per revision, coloured by its zone, so a good spell
                  renders green and a bad one red along one continuous line. */}
              <linearGradient id="hcp-trend-stroke" x1="0" y1="0" x2="1" y2="0">
                {points.map((p, i) => (
                  <stop
                    key={i}
                    offset={`${(i / (n - 1)) * 100}%`}
                    stopColor={zoneColor(p.v, stats.best, stats.worst)}
                  />
                ))}
              </linearGradient>
            </defs>
            <path d={area} fill="url(#hcp-trend-fill)" />
            <path d={line} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={4.0} strokeLinecap="round" strokeLinejoin="round" />
            <path d={line} fill="none" stroke="url(#hcp-trend-stroke)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            {/* Under the marker triple, so the marker is never obscured. */}
            {callout(worstIdx, 'high')}
            {callout(bestIdx, 'low', lowShift)}
            <line x1={mx} y1={0} x2={mx} y2={h} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={2} />
            <circle cx={mx} cy={my} r={8.5} fill="#FFFFFF" fillOpacity={0.45} />
            <circle cx={mx} cy={my} r={4.5} fill="#FFFFFF" />
            <circle cx={mx} cy={my} r={2.5} fill={markerTone} />
          </svg>
        );

      }}
      legend={
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LegendSwatch color={A.DRIFTED} label="Off best" />
            <LegendSwatch color={AMBER} label="Mid" />
            <LegendSwatch color={A.IMPROVED} label="Near best" />
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/handicap?subtab=today')}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: SANS,
            }}
          >
            <span style={{ ...LABEL, color: A.INK }}>View Handicap</span>
            <ChevronRight size={12} strokeWidth={2.6} color={A.INK} />
          </button>
        </>
      }
    />
  );
};

export default function HcpStrip({ actorType, actorId, onNavigate }: Props) {
  const isBusiness = actorType === 'business';
  const [windowDays, setWindowDays] = useState<30 | 90>(90);

  const { data: profile, isFetched: profileFetched, isError: profileError } =
    useUserProfile(isBusiness ? undefined : actorId);
  const { data: connection, isFetched: connFetched, isError: connError } =
    useWhsConnection(isBusiness ? undefined : actorId);
  const { data: trend, isFetched: trendFetched, isError: trendError } =
    useHandicapTrend(connection?.id);
  const { data: history90, isFetched: histFetched, isError: histError } =
    useHandicapHistory(connection?.id, 90);

  // The 30-day window is a client-side slice of the SAME 90-day query — the
  // segmented control costs no extra round trip.
  const points = useMemo<Point[]>(() => {
    if (!history90) return [];
    const cutoff = windowDays === 90 ? 0 : Date.now() - windowDays * 86_400_000;
    return history90
      .filter((p: any) => !cutoff || new Date(p.observed_at).getTime() >= cutoff)
      .map((p: any) => ({ t: p.observed_at, v: p.handicap_index }));
  }, [history90, windowDays]);

  const anyError = profileError || connError || trendError || histError;
  const settled =
    anyError ||
    (profileFetched && connFetched && (!connection || (trendFetched && histFetched)));

  if (isBusiness) return null;
  // UNRESOLVED IS NOT ABSENT: render nothing at all while unsettled.
  if (!settled) return null;
  // The hide toggle governs BOTH surfaces — the island chip and this card.
  if (profile?.hide_handicap_chip) return null;

  if (!connection) return <GhostCard onOpen={() => onNavigate('/manage/handicap')} />;

  const fallbackIndex = typeof trend?.current === 'number' ? trend.current : null;
  if (points.length < 2 && fallbackIndex == null) return null;

  return (
    <TrendCard
      points={points}
      windowDays={windowDays}
      onWindow={setWindowDays}
      fallbackIndex={fallbackIndex}
      onNavigate={onNavigate}
    />
  );
}

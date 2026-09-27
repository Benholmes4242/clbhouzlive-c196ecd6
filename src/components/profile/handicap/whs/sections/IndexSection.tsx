/**
 * IndexSection — the handicap index block (BRIEF_HANDICAP_TAB_SIMPLIFY §1).
 *
 * No heading, no kicker: the index figure IS the headline. Headline row
 * (HANDICAP INDEX + value left, window movement + window label right), then
 * range chips, then the scrubbable step chart. There is NO separate readout:
 * the scrub mutates the headline in place, and nothing else moves.
 *
 * RULES (do not relax them):
 *
 * - THE SERIES IS THE ONE ALREADY ON SCREEN: useHandicapHistory(…, 'all').
 *   No new read. The line is a step function of the index in force.
 *
 * - NO CAUSAL CLAIM. No point can be joined to a round, so the scrub says
 *   "THIS STEP", never "this round" (BRIEF_WALK_YOUR_INDEX_DATA_CHECK).
 *
 * - WINDOWS are the last N days ENDING TODAY (…_WINDOW_ANCHOR, not revisited).
 *
 * - LANDING MOVEMENT is window end minus window start. Down = improved tone,
 *   up = drifted tone, zero = A.DIM and reads "0.0".
 *
 * - THE LINE IS ONE COLOUR, SET BY THE WINDOW (BRIEF_INDEX_LINE_SOFTENED_STEPS):
 *   `windowNet` is computed ONCE and drives both the headline movement figure
 *   and the stroke/fill tone. Scrub never recolours the line.
 *
 * - SOFTENED STAIRCASE: still a step function; each corner is a quadratic with
 *   its control point ON the corner, r = min(RADIUS_MAX, run/2, |rise|/2), so
 *   the arc can never pass beyond a value the member actually held.
 *
 * - FILL: same path data as the stroke + two closing edges to the plot bottom.
 *
 * - COLOUR PAIR: A.IMPROVED / A.DRIFTED (= INDEX_DELTA.dark), the pair the
 *   movement figure already resolved to, so line and figure cannot disagree.
 *
 * - SCRUB: pointer down snaps to the nearest point; drag follows under pointer
 *   capture; release PARKS it. Any range change resets to landing.
 *   touch-action: none is on the chart element ONLY.
 *
 * - CHIPS are plain buttons with aria-pressed, NOT role="tab": handicap-dark.css
 *   forces [role="tab"][aria-selected="true"] to white with !important.
 */
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { useHandicapHistory } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import { HcpSection } from './HcpSection';
import { CHART, DEAD_BAND } from '../charts/tokens';

interface Props {
  connection: WhsConnection;
}

const MS_PER_DAY = 86_400_000;
const CHART_H = 132;
const PAD_T = 22;
const PAD_B = 22;
/** Scrub within this many px of the high/low point and its label yields. */
const LABEL_YIELD_PX = 36;
/** Absolute corner cap: keeps a sparse window reading as hold-then-jump. */
const RADIUS_MAX = 9;
const FILL_ALPHA = { down: 0.26, up: 0.16 } as const;

/** Softened staircase through step points, holding the last value to xEnd. */
export function softStepPath(p: Array<[number, number]>, xEnd: number): string {
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const [X, y1] = p[i];
    const [x0, y0] = p[i - 1];
    const rise = y1 - y0;
    if (Math.abs(rise) < 0.01) continue; // zero rise: plain run, no arcs
    const nextX = i + 1 < p.length ? p[i + 1][0] : xEnd;
    const r = Math.min(RADIUS_MAX, (X - x0) / 2, (nextX - X) / 2, Math.abs(rise) / 2);
    if (r < 0.5) {
      d += ` L ${X} ${y0} L ${X} ${y1}`;
      continue;
    }
    const s = Math.sign(rise);
    d += ` L ${X - r} ${y0} Q ${X} ${y0} ${X} ${y0 + s * r} L ${X} ${y1 - s * r} Q ${X} ${y1} ${X + r} ${y1}`;
  }
  return `${d} L ${xEnd} ${p[p.length - 1][1]}`;
}

type WindowKey = '30d' | '90d' | '12m';
const DAYS: Record<WindowKey, number> = { '30d': 30, '90d': 90, '12m': 365 };
const CHIP_LABEL: Record<WindowKey, string> = { '30d': '30D', '90d': '90D', '12m': '12M' };
/* The pre-rebuild handicap_chart_scoped wire vocabulary, kept comparable. */
const WIRE: Record<WindowKey, string> = { '30d': '1M', '90d': '3M', '12m': '1Y' };
const WINDOW_KEY: Record<WindowKey, string> = {
  '30d': 'common:handicap.walk.window30',
  '90d': 'common:handicap.walk.window90',
  '12m': 'common:handicap.walk.window12',
};

const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };
/* 8.5 / 0.16em label. Weight 700, not the prototype's 800: the canonical scale
   (src/lib/tokens/type.ts) allows 400-700 only. */
const HEAD_LABEL: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: A.DIM,
  lineHeight: '12px',
  whiteSpace: 'nowrap',
};
const AXIS: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

/** Plus handicaps render with a leading '+'. */
function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

/** A movement: true minus when down, '+' when up, "0.0" when held. */
function formatMove(d: number): string {
  if (Math.abs(d) < DEAD_BAND) return '0.0';
  return d < 0 ? `\u2212${Math.abs(d).toFixed(1)}` : `+${d.toFixed(1)}`;
}

function moveTone(d: number | null, held: string): string {
  if (d == null || Math.abs(d) < DEAD_BAND) return held;
  return d < 0 ? A.IMPROVED : A.DRIFTED;
}

interface Pt {
  ts: number;
  v: number;
  /** Window edge (index in force), not an observation. */
  edge?: 'lead' | 'trail';
}

const IndexSection: React.FC<Props> = ({ connection }) => {
  const { t } = useTranslation(['common']);
  const { data: history, isLoading } = useHandicapHistory(connection.id, 'all');

  const all = useMemo<Pt[]>(
    () =>
      (history ?? [])
        .map((p) => ({ ts: new Date(p.observed_at).getTime(), v: Number(p.handicap_index) }))
        .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v))
        .sort((a, b) => a.ts - b.ts),
    [history],
  );

  const [win, setWin] = useState<WindowKey>('12m');

  /* THE WINDOW IS THE LAST N DAYS ENDING TODAY (BRIEF_WALK_YOUR_INDEX_WINDOW_ANCHOR).
     The chip, the kicker and the axis state the same span by construction.
     The series is the index IN FORCE across the window:
       - a leading edge point at `start` carrying the last observation at or
         before start (when one exists),
       - the observations inside [start, end],
       - a trailing edge point at `end` carrying the newest index, so the step
         holds flat to today.
     Edge points are not observations and never claim a movement. An inactive
     member's 30D is therefore a flat line — their index has not moved. */
  const view = useMemo(() => {
    if (all.length === 0) return null;
    const end = Date.now();
    const start = end - DAYS[win] * MS_PER_DAY;
    const before = all.filter((p) => p.ts <= start);
    const inside = all.filter((p) => p.ts > start && p.ts <= end);
    const pts: Pt[] = [];
    if (before.length) pts.push({ ts: start, v: before[before.length - 1].v, edge: 'lead' });
    pts.push(...inside);
    const last = pts[pts.length - 1];
    if (last && last.ts < end) pts.push({ ts: end, v: last.v, edge: 'trail' });
    return { pts, start, end };
  }, [all, win]);

  const pts = view?.pts ?? [];
  // NO CHART only when there is no index history at all at or before today.
  const drawable = pts.length >= 1;

  /* null = LANDING (window movement). A number = parked on that point. */
  const [sel, setSel] = useState<number | null>(null);

  // ── Width, measured (the chart sits inside the tab's gutter) ──────────
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [drawable]);

  const geo = useMemo(() => {
    if (!drawable || !view || w <= 0) return null;
    const vs = pts.map((p) => p.v);
    let lo = Math.min(...vs);
    let hi = Math.max(...vs);
    if (hi - lo < 0.5) {
      const mid = (hi + lo) / 2;
      lo = mid - 0.25;
      hi = mid + 0.25;
    }
    const span = Math.max(1, view.end - view.start);
    const x = (ts: number) => ((ts - view.start) / span) * w;
    // Worse (higher index) is HIGHER on screen; SVG y grows down, so subtract.
    const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * (CHART_H - PAD_T - PAD_B);
    const xs = pts.map((p) => x(p.ts));
    const line = softStepPath(pts.map((p, i) => [xs[i], y(p.v)] as [number, number]), w);
    // One path, two uses: the fill is the stroke's own data plus two closing edges.
    const fill = `${line} L ${w} ${CHART_H} L ${xs[0]} ${CHART_H} Z`;
    let hiIdx = 0;
    let loIdx = 0;
    pts.forEach((p, i) => {
      if (p.v > pts[hiIdx].v) hiIdx = i;
      if (p.v < pts[loIdx].v) loIdx = i;
    });
    return { xs, y, line, fill, hiIdx, loIdx };
  }, [drawable, view, pts, w]);


  // ── Scrub ──────────────────────────────────────────────────────────────
  const dragging = useRef(false);
  const pickAt = (clientX: number) => {
    const el = boxRef.current;
    if (!el || !geo) return;
    const px = clientX - el.getBoundingClientRect().left;
    let best = 0;
    let bestD = Infinity;
    geo.xs.forEach((gx, i) => {
      const dd = Math.abs(gx - px);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    setSel(best);
  };

  const scopeWindow = (next: WindowKey) => {
    if (next === win) return;
    const newest = all.length ? all[all.length - 1].ts : 0;
    const sample = all.filter((p) => p.ts >= newest - DAYS[next] * MS_PER_DAY).length;
    analyticsEvents.track('handicap_chart_scoped', {
      chart: 'index_history',
      from: WIRE[win],
      to: WIRE[next],
      sample_size: sample,
    });
    setWin(next);
    setSel(null);
  };

  /* THE ONE VALUE (§2.2): window end minus window start. The headline figure
     and the line/fill tone both read it; they cannot disagree. */
  const windowNet = pts.length ? pts[pts.length - 1].v - pts[0].v : 0;
  const lineTone: 'down' | 'up' | 'flat' =
    Math.abs(windowNet) < DEAD_BAND ? 'flat' : windowNet < 0 ? 'down' : 'up';

  if (isLoading) return null;

  const idx = sel == null ? null : Math.min(sel, pts.length - 1);
  const cur = idx == null ? null : pts[idx];
  const prev = idx != null && idx > 0 ? pts[idx - 1] : null;

  /* THE HEADLINE — four slots, fixed metrics, mutated in place by the scrub. */
  let label: string;
  let value: string;
  let valueTone: string = A.INK;
  let move: string;
  let moveColor: string;
  let windowLabel: string;
  if (cur == null) {
    const last = pts[pts.length - 1];
    const d = windowNet;
    label = t('common:handicap.walk.headlineLabel');
    value = last ? formatIndex(last.v) : '';
    move = formatMove(d);
    moveColor = moveTone(d, A.DIM);
    windowLabel = t(WINDOW_KEY[win]);
  } else {
    // Edge points never claim movement: lead = FIRST IN WINDOW, trail = NO CHANGE.
    const d = cur.edge === 'lead' || !prev ? null : cur.edge === 'trail' ? 0 : cur.v - prev.v;
    const held = d == null || Math.abs(d) < DEAD_BAND;
    label = format(new Date(cur.ts), 'd MMM yyyy').toUpperCase();
    value = formatIndex(cur.v);
    valueTone = moveTone(d, A.INK);
    move = formatMove(d ?? 0);
    moveColor = moveTone(d, A.DIM);
    windowLabel =
      d == null
        ? t('common:handicap.walk.firstInWindow')
        : held
          ? t('common:handicap.walk.noChange')
          : t('common:handicap.walk.thisStep');
  }

  const chips = (
    <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
      {(Object.keys(DAYS) as WindowKey[]).map((k) => {
        const on = k === win;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            onClick={() => scopeWindow(k)}
            style={{
              borderRadius: 999,
              padding: '4px 9px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: on ? CHART.GRID : 'transparent',
              border: on ? '1px solid transparent' : `1px solid ${CHART.BORDER}`,
              color: on ? CHART.INK : CHART.DIM,
            }}
          >
            {CHIP_LABEL[k]}
          </button>
        );
      })}
    </div>
  );

  const labelYields = (i: number) =>
    !!geo && idx != null && Math.abs(geo.xs[i] - geo.xs[idx]) < LABEL_YIELD_PX;

  const segColor = { down: A.IMPROVED, up: A.DRIFTED, flat: A.DIM } as const;
  const dotIdx = idx ?? pts.length - 1;

  return (
    <HcpSection first>
      {drawable && (
        <div
          data-hcp-headline
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={HEAD_LABEL}>{label}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                color: valueTone,
                ...FIG,
              }}
            >
              {value}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: moveColor, ...FIG }}>
              {move}
            </div>
            <div style={{ ...HEAD_LABEL, letterSpacing: '0.14em', marginTop: 4 }}>{windowLabel}</div>
          </div>
        </div>
      )}

      {chips}

      {!drawable ? (
        <p style={{ margin: '16px 0 0', fontSize: 12, color: CHART.DIM, lineHeight: 1.5 }}>
          {t('common:handicap.walk.empty')}
        </p>
      ) : (
        <>
          {/* Inside the section's own gutter: same left/right edges as the headings (no bleed - this chart does not scroll). */}
          <div
            ref={boxRef}
            role="img"
            aria-label={t('common:handicap.walk.chartLabel')}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              pickAt(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging.current) pickAt(e.clientX);
            }}
            onPointerUp={(e) => {
              // PARKS where released — never auto-resets.
              dragging.current = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            style={{
              margin: '14px 0 0',
              height: CHART_H,
              touchAction: 'none',
              position: 'relative',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {geo && (
              <svg width={w} height={CHART_H} style={{ display: 'block', overflow: 'visible' }}>
                {lineTone !== 'flat' && (
                  <>
                    <defs>
                      <linearGradient id="hcp-index-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={segColor[lineTone]} stopOpacity={FILL_ALPHA[lineTone]} />
                        <stop offset="100%" stopColor={segColor[lineTone]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path data-fill d={geo.fill} fill="url(#hcp-index-fill)" />
                  </>
                )}
                <path
                  data-tone={lineTone}
                  d={geo.line}
                  fill="none"
                  stroke={segColor[lineTone]}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* HIGH red, LOW green: a lower index is better. Yields to the scrub. */}
                {geo.hiIdx !== geo.loIdx && !labelYields(geo.hiIdx) && (
                  <text
                    x={geo.xs[geo.hiIdx]}
                    y={geo.y(pts[geo.hiIdx].v) - 8}
                    textAnchor={geo.xs[geo.hiIdx] < 30 ? 'start' : geo.xs[geo.hiIdx] > w - 30 ? 'end' : 'middle'}
                    style={{ fontSize: 10, fontWeight: 700, fill: CHART.UP, ...FIG }}
                  >
                    {t('common:handicap.walk.high', { v: formatIndex(pts[geo.hiIdx].v) })}
                  </text>
                )}
                {geo.hiIdx !== geo.loIdx && !labelYields(geo.loIdx) && (
                  <text
                    x={geo.xs[geo.loIdx]}
                    y={geo.y(pts[geo.loIdx].v) + 16}
                    textAnchor={geo.xs[geo.loIdx] < 30 ? 'start' : geo.xs[geo.loIdx] > w - 30 ? 'end' : 'middle'}
                    style={{ fontSize: 10, fontWeight: 700, fill: CHART.DOWN, ...FIG }}
                  >
                    {t('common:handicap.walk.low', { v: formatIndex(pts[geo.loIdx].v) })}
                  </text>
                )}
                {idx != null && (
                  <line x1={geo.xs[idx]} x2={geo.xs[idx]} y1={0} y2={CHART_H} stroke={CHART.FAINT} strokeWidth={1} />
                )}
                <circle cx={geo.xs[dotIdx]} cy={geo.y(pts[dotIdx].v)} r={4.5} fill={CHART.INK} stroke={CHART.CANVAS} strokeWidth={2} />
              </svg>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, ...AXIS }}>
            <span>{view ? format(new Date(view.start), 'MMM yyyy') : ''}</span>
            <span>{t('common:handicap.walk.today')}</span>
          </div>
        </>
      )}
    </HcpSection>
  );
};

export default IndexSection;

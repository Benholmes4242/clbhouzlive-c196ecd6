/**
 * IndexSection — "WALK YOUR INDEX" (BRIEF_HANDICAP_TAB_PHASE_2 §1).
 *
 * Kicker / heading, range chips, a scrubbable index chart, then a two-column
 * readout: ON THIS DATE + the date under the scrub on the left, the index on
 * that date (large) and its movement since the previous point on the right.
 *
 * RULES (do not relax them):
 *
 * - THE SERIES IS THE ONE ALREADY ON SCREEN: useHandicapHistory(…, 'all'),
 *   i.e. fetchHandicapHistory's merge of snapshots and
 *   whs_scores.handicap_index_at_time. No new read. The line is a step
 *   function of the index in force on a given day.
 *
 * - NO ROUND PANEL and NO CAUSAL CLAIM. There is no exact join from a point
 *   on this line to the round behind it, so nothing here names a round. The
 *   readout says what the index WAS on a date — "ON THIS DATE", never
 *   "this round". Absent beats approximated.
 *
 * - WINDOWS are measured back from the NEWEST observation, not from today, so
 *   a member who has not played for six weeks still gets a real 30D window.
 *   The axis runs to today on the right (the newest index is still in force),
 *   so the step holds flat from the newest observation to TODAY.
 *
 * - FEWER THAN TWO OBSERVATIONS in the window: no chart. Heading, chips and
 *   one quiet line; the chips stay so the member can widen the range.
 *
 * - MOVEMENT is scrubbed point minus the previous point IN THE WINDOW, in the
 *   INDEX_DELTA dark pair (down green, up red). An index that held reads
 *   "NO CHANGE" in DIM — never an em dash. This is movement, not a score.
 *
 * - SCRUB: pointer down snaps to the nearest observation; drag follows under
 *   pointer capture; release leaves it. Defaults to the newest on mount and on
 *   every range change. touch-action: none is on the chart element ONLY.
 *
 * - CHIPS are plain buttons with aria-pressed, NOT role="tab": handicap-dark.css
 *   forces [role="tab"][aria-selected="true"] to white with !important inside
 *   .hcp-dark, which would override the chip treatment.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { useHandicapHistory } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

import { HcpSection } from './HcpSection';
import { CHART } from '../charts/tokens';

interface Props {
  connection: WhsConnection;
}

const MS_PER_DAY = 86_400_000;
const CHART_H = 132;
const PAD_T = 22;
const PAD_B = 22;
/** Scrub within this many px of the high/low point and its label yields. */
const LABEL_YIELD_PX = 36;

type WindowKey = '30d' | '90d' | '12m';
const DAYS: Record<WindowKey, number> = { '30d': 30, '90d': 90, '12m': 365 };
const CHIP_LABEL: Record<WindowKey, string> = { '30d': '30D', '90d': '90D', '12m': '12M' };
/* The pre-rebuild handicap_chart_scoped wire vocabulary, kept comparable. */
const WIRE: Record<WindowKey, string> = { '30d': '1M', '90d': '3M', '12m': '1Y' };

const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };
const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

/** Plus handicaps render with a leading '+'. */
function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

interface Pt {
  ts: number;
  v: number;
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

  const view = useMemo(() => {
    if (all.length === 0) return null;
    const newest = all[all.length - 1].ts;
    const start = newest - DAYS[win] * MS_PER_DAY;
    const pts = all.filter((p) => p.ts >= start);
    const end = Math.max(newest, Date.now());
    return { pts, start, end };
  }, [all, win]);

  const pts = view?.pts ?? [];
  const drawable = pts.length >= 2;

  const [sel, setSel] = useState(0);
  // Newest observation on mount and on every range change.
  useEffect(() => {
    setSel(Math.max(0, pts.length - 1));
  }, [win, pts.length]);

  // ── Width, measured (the chart is full width of the tab) ──────────────
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
    // Step function: the index holds until the next observation, then to today.
    let d = `M ${xs[0]} ${y(pts[0].v)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` H ${xs[i]} V ${y(pts[i].v)}`;
    }
    d += ` H ${w}`;
    let hiIdx = 0;
    let loIdx = 0;
    pts.forEach((p, i) => {
      if (p.v > pts[hiIdx].v) hiIdx = i;
      if (p.v < pts[loIdx].v) loIdx = i;
    });
    return { xs, y, d, hiIdx, loIdx };
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
  };

  if (isLoading || all.length === 0) return null;

  const idx = Math.min(sel, pts.length - 1);
  const cur = pts[idx];
  const prev = idx > 0 ? pts[idx - 1] : null;
  const delta = cur && prev ? cur.v - prev.v : null;
  const held = delta != null && Math.abs(delta) < 0.05;

  const kickerKey: Record<WindowKey, string> = {
    '30d': 'common:handicap.walk.kicker30',
    '90d': 'common:handicap.walk.kicker90',
    '12m': 'common:handicap.walk.kicker12',
  };

  const chips = (
    <div style={{ display: 'flex', gap: 6 }}>
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
    !!geo && Math.abs(geo.xs[i] - geo.xs[idx]) < LABEL_YIELD_PX;

  return (
    <HcpSection kicker={t(kickerKey[win])} heading={t('common:handicap.walk.heading')} first>
      {chips}

      {!drawable ? (
        <p style={{ margin: '16px 0 0', fontSize: 12, color: CHART.DIM, lineHeight: 1.5 }}>
          {t('common:handicap.walk.empty')}
        </p>
      ) : (
        <>
          {/* Full width of the tab: bleed through the section's 20px gutter. */}
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
              dragging.current = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            style={{
              margin: '16px -20px 0',
              height: CHART_H,
              touchAction: 'none',
              position: 'relative',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {geo && (
              <svg width={w} height={CHART_H} style={{ display: 'block', overflow: 'visible' }}>
                <path d={geo.d} fill="none" stroke={CHART.MUTE} strokeWidth={1.75} strokeLinejoin="round" />
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
                {/* Scrub line + dot */}
                <line x1={geo.xs[idx]} x2={geo.xs[idx]} y1={0} y2={CHART_H} stroke={CHART.FAINT} strokeWidth={1} />
                <circle cx={geo.xs[idx]} cy={geo.y(cur.v)} r={4.5} fill={CHART.INK} stroke={CHART.CANVAS} strokeWidth={2} />
              </svg>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, ...KICKER, letterSpacing: '0.12em' }}>
            <span>{view ? format(new Date(view.start), 'MMM yyyy') : ''}</span>
            <span>{t('common:handicap.walk.today')}</span>
          </div>

          {/* Readout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 18, gap: 16 }}>
            <div>
              <div style={KICKER}>{t('common:handicap.walk.onThisDate')}</div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: CHART.INK, ...FIG }}>
                {format(new Date(cur.ts), 'd MMM yyyy')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: CHART.INK, letterSpacing: '-0.04em', ...FIG }}>
                {formatIndex(cur.v)}
              </div>
              <div
                style={{
                  ...KICKER,
                  marginTop: 6,
                  letterSpacing: '0.12em',
                  color:
                    delta == null || held
                      ? CHART.DIM
                      : delta < 0
                        ? INDEX_DELTA.dark.improved
                        : INDEX_DELTA.dark.drifted,
                  ...FIG,
                }}
              >
                {delta == null
                  ? t('common:handicap.walk.firstInWindow')
                  : held
                    ? t('common:handicap.walk.noChange')
                    : t(delta < 0 ? 'common:handicap.walk.down' : 'common:handicap.walk.up', {
                        v: Math.abs(delta).toFixed(1),
                      })}
              </div>
            </div>
          </div>
        </>
      )}
    </HcpSection>
  );
};

export default IndexSection;

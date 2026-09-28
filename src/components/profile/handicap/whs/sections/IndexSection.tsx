/**
 * IndexSection — the handicap index block (BRIEF_HANDICAP_TAB_SIMPLIFY §1).
 *
 * No heading, no kicker: the index figure IS the headline. Headline row
 * (HANDICAP INDEX + value left, window movement + window label right), then
 * range chips, then the scrubbable index curve. There is NO separate readout:
 * the scrub mutates the headline in place, and nothing else moves.
 *
 * RULES (do not relax them):
 *
 * - THE SERIES IS THE ONE ALREADY ON SCREEN: useHandicapHistory(…, 'all').
 *   No new read. The line shows the index in force across the selected window.
 *
 * - NO CAUSAL CLAIM. No point can be joined to a round, so the scrub says
 *   "THIS STEP", never "this round" (BRIEF_WALK_YOUR_INDEX_DATA_CHECK).
 *
 * - WINDOWS are the last N days ENDING TODAY (…_WINDOW_ANCHOR, not revisited).
 *
 * - LANDING MOVEMENT is window end minus window start. Down = improved tone,
 *   up = drifted tone, zero = A.DIM and reads "0.0".
 *
 * - THE CHART IS THE SAME SHARED HcpTrendChart USED BY THE PROFILE SHEET:
 *   zone-graded stroke, net-movement fill, best/worst callouts and active halo.
 *
 * - SCRUB: pointer down snaps to the nearest point; drag follows under pointer
 *   capture; release PARKS it. Any range change resets to landing.
 *   touch-action: none is on the chart element ONLY.
 *
 * - CHIPS are plain buttons with aria-pressed, NOT role="tab": handicap-dark.css
 *   forces [role="tab"][aria-selected="true"] to white with !important.
 */
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { useHandicapHistory } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import { HcpSection } from './HcpSection';
import { CHART, DEAD_BAND } from '../charts/tokens';
import { HcpTrendChart } from '../charts/HcpTrendChart';

interface Props {
  connection: WhsConnection;
}

const MS_PER_DAY = 86_400_000;
const CHART_H = 96;

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
  const chartPoints = useMemo(
    () => pts.map((p) => ({ t: new Date(p.ts).toISOString(), v: p.v })),
    [pts],
  );
  // NO CHART only when there is no index history at all at or before today.
  const drawable = pts.length >= 1;

  /* null = LANDING (window movement). A number = parked on that point. */
  const [sel, setSel] = useState<number | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);


  // ── Scrub ──────────────────────────────────────────────────────────────
  const dragging = useRef(false);
  const pickAt = (clientX: number) => {
    const el = boxRef.current;
    if (!el || pts.length < 2) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width || el.clientWidth;
    const pointerX = Number.isFinite(clientX) ? clientX : rect.left;
    const ratio = (pointerX - rect.left) / Math.max(1, width);
    setSel(Math.round(Math.min(1, Math.max(0, ratio)) * (pts.length - 1)));
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
            <HcpTrendChart
              points={chartPoints}
              active={dotIdx}
              showCrosshair={idx != null}
              height={CHART_H}
              /* FULL SECTION WIDTH: padX 0 so the line spans the same left and
                 right edges as the section rows below (BRIEF user ruling). */
              padX={0}
            />
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

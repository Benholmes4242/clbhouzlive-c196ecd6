/**
 * IndexSection — SECTION B of the one-page handicap brief.
 *
 * Kicker "Handicap index", no heading. The index figure at 52/700/INK left,
 * with the 90 DAYS and 12 MONTHS deltas to its right (17 tabular, 0.12em
 * kickers beneath), then the range chips + sample kicker, then IndexChart.
 *
 * RULES IMPLEMENTED HERE (from the brief, do not relax them):
 *
 * - DELTA COLOUR comes from indexTone(first, last) — falling index green,
 *   rising red. The comparator is not reimplemented and its argument order
 *   is never swapped.
 *
 * - DELTA WITHHELD RULES: the 90-day delta renders only when the record has
 *   a round older than 90 days AND at least 8 rounds; the 12-month delta
 *   only when a round is older than 12 months (the existing 335-day guard,
 *   MIN_12M_DAYS, shared with useHandicapTrend12mo). When NEITHER renders,
 *   "from {n} rounds" takes their place at 12 / DIM.
 *
 * - RANGE CHIPS: a chip renders only if the record spans it. If only one
 *   chip would render, no chips render at all and the span is stated in the
 *   meta slot (the right-hand kicker) instead. Applied chip = the existing
 *   6% white filled ground (CHART.GRID value, reused — no new tone);
 *   unselected = transparent with a 1px CHART.BORDER border.
 *
 * - WITHHELD (< 8 rounds): the index figure as normal, no deltas, the chart
 *   with visible point markers (IndexChart's additive `showPoints`), and the
 *   sentence beneath at 12 / DIM.
 *
 * INSTRUMENTATION:
 * - Range chips continue the handicap_chart_scoped series with the legacy
 *   wire vocabulary (1M/3M/1Y) so it stays comparable across the rebuild;
 *   sample_size (points in the resulting window) is added per the brief.
 * - The withheld state fires handicap_section_withheld once per mount with
 *   the section name and the sample that fell short (Section N).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';

import { HcpSection } from './HcpSection';
import { IndexChart, type IndexPoint } from '../charts';
import { CHART, indexTone, toneColor } from '../charts/tokens';

interface Props {
  connection: WhsConnection;
}

/** The page canvas (--hcp-bg-0 in handicap-dark.css) — the chart halo must
 *  be the page colour now that there is no panel behind it. */
const PAGE_CANVAS = '#15171F';

const MS_PER_DAY = 86_400_000;
/** useHandicapTrend12mo's guard: 335 days of record before we claim 12 months. */
const MIN_12M_DAYS = 335;
/** Fewer rounds than this and a 90-day trend cannot say anything. */
const MIN_DELTA_ROUNDS = 8;

/** U+2212 true minus for negative deltas; plus sign for rises. */
function formatDelta(v: number): string {
  const sign = v < 0 ? '\u2212' : '+';
  return `${sign}${Math.abs(v).toFixed(1)}`;
}

/** Plus handicaps render with a leading '+'. */
function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

type WindowKey = '30d' | '90d' | '12m';

/* Keeps the pre-rebuild handicap_chart_scoped wire vocabulary so the series
   stays comparable across the change. */
const WIRE: Record<WindowKey, string> = { '30d': '1M', '90d': '3M', '12m': '1Y' };

const IndexSection: React.FC<Props> = ({ connection }) => {
  const { t } = useTranslation(['common']);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history, isLoading: historyLoading } = useHandicapHistory(connection.id, 'all');

  const handicap = trend?.current ?? null;

  const model = useMemo(() => {
    const rows = history ?? [];
    const now = Date.now();
    const toPoint = (p: { observed_at: string; handicap_index: number | string }): IndexPoint => ({
      t: p.observed_at,
      v: Number(p.handicap_index),
    });
    const since = (days: number) =>
      rows.filter((p) => now - new Date(p.observed_at).getTime() <= days * MS_PER_DAY).map(toPoint);
    const all = rows.map(toPoint);
    const total = rows.length;
    const earliestTs = total ? new Date(rows[0].observed_at).getTime() : now;
    const spanDays = total ? (now - earliestTs) / MS_PER_DAY : 0;
    const has90 = spanDays >= 90; // a round older than 90 days
    const has12m = spanDays >= MIN_12M_DAYS; // a round older than 12 months
    const netOf = (pts: IndexPoint[]): number | null =>
      pts.length < 2 ? null : pts[pts.length - 1].v - pts[0].v;
    return {
      all,
      slices: { '30d': since(30), '90d': since(90), '12m': since(365) } as Record<WindowKey, IndexPoint[]>,
      total,
      spanDays,
      has30: spanDays >= 30,
      has90,
      has12m,
      delta90: netOf(since(90)),
      delta12: has12m ? netOf(since(365)) : null,
    };
  }, [history]);

  // ── Range chips: a chip exists only if the record spans it. ────────────
  const chips = useMemo(() => {
    const out: WindowKey[] = [];
    if (model.has30) out.push('30d');
    if (model.has90) out.push('90d');
    if (model.has12m) out.push('12m');
    return out;
  }, [model.has30, model.has90, model.has12m]);
  // One chip is no choice at all — none render, and the span is stated in
  // the meta slot instead (below).
  const chipsVisible = chips.length > 1;
  const widest: WindowKey | 'all' = model.has12m ? '12m' : model.has90 ? '90d' : model.has30 ? '30d' : 'all';

  const [win, setWin] = useState<WindowKey | 'all'>(widest);
  const active: WindowKey | 'all' =
    win !== 'all' && chips.includes(win) ? win : widest;
  const chartPoints = active === 'all' ? model.all : model.slices[active];

  const scopeWindow = (next: WindowKey) => {
    if (next === active) return;
    const pts = model.slices[next];
    analyticsEvents.track('handicap_chart_scoped', {
      chart: 'index_history',
      from: active === 'all' ? 'ALL' : WIRE[active],
      to: WIRE[next],
      sample_size: pts.length,
    });
    setWin(next);
  };

  // ── States ─────────────────────────────────────────────────────────────
  const withheld = model.total < MIN_DELTA_ROUNDS;
  const show90 = !withheld && model.has90 && model.delta90 != null;
  const show12 = !withheld && model.has12m && model.delta12 != null;

  // Section N: instrument every withheld state, once per mount.
  const withheldFired = useRef(false);
  useEffect(() => {
    if (withheldFired.current || trendLoading || historyLoading) return;
    if (!withheld) return;
    withheldFired.current = true;
    analyticsEvents.track('handicap_section_withheld', {
      section: 'index',
      sample_size: model.total,
    });
  }, [withheld, trendLoading, historyLoading, model.total]);

  if (trendLoading || historyLoading) return null;

  const spanLabel =
    model.spanDays >= MIN_12M_DAYS
      ? t('common:handicap.index.spanFixed12m')
      : model.has90
        ? t('common:handicap.index.spanFixed90')
        : model.has30
          ? t('common:handicap.index.spanFixed30')
          : t('common:handicap.index.spanDays', { count: Math.max(1, Math.floor(model.spanDays)) });

  const CHIP_LABEL: Record<WindowKey, string> = { '30d': '30D', '90d': '90D', '12m': '12M' };

  /* The delta FIGURE sits on the index figure's baseline and its kicker hangs
     BELOW that line (absolute, out of flow) — one row of figures with labels
     beneath, the same grammar as Last round and Friends' rounds. Aligning the
     block instead would put the kickers on the baseline and lift the figures
     off it. */
  /* THE LAST KICKER IS ANCHORED TO ITS RIGHT EDGE, not its left. The label is
     wider than the figure above it and sits out of flow, so a left anchor on
     the rightmost block pushed "12 MONTHS" past the 20px gutter and the S was
     clipped. Anchored right, it grows inwards and both kickers render whole. */
  const deltaCell = (delta: number, label: string, anchor: 'left' | 'right') => {
    const pts = label === t('common:handicap.index.delta90') ? model.slices['90d'] : model.slices['12m'];
    const color = toneColor(indexTone(pts[0].v, pts[pts.length - 1].v));
    return (
      <div key={label} style={{ position: 'relative' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color, lineHeight: 1.1, textAlign: anchor, ...FIG }}>
          {formatDelta(delta)}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            [anchor === 'right' ? 'right' : 'left']: 0,
            textAlign: anchor,
            marginTop: 3,
            whiteSpace: 'nowrap',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: CHART.DIM,
          }}
        >
          {label}
        </div>
      </div>
    );
  };

  return (
    <HcpSection kicker={t('common:handicap.index.kicker')} first>
      {/* Figure + deltas */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ fontSize: 52, fontWeight: 700, color: CHART.INK, lineHeight: 1, ...FIG }}>
          {handicap != null ? formatIndex(handicap) : '\u2014'}
        </div>
        {withheld ? null : show90 || show12 ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 28 }}>
            {show90 && deltaCell(model.delta90 as number, t('common:handicap.index.delta90'))}
            {show12 && deltaCell(model.delta12 as number, t('common:handicap.index.delta12m'))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: CHART.DIM, ...FIG }}>
            {t('common:handicap.index.fromRounds', { count: model.total })}
          </div>
        )}
      </div>

      {/* Chips + sample, 18px down */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
        }}
      >
        {chipsVisible && !withheld ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {chips.map((w) => {
              const on = active === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => scopeWindow(w)}
                  style={{
                    borderRadius: 999,
                    padding: '4px 9px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    // Applied = the existing 6% white filled ground, no border;
                    // unselected = transparent with a 1px border.
                    background: on ? CHART.GRID : 'transparent',
                    border: on ? 'none' : `1px solid ${CHART.BORDER}`,
                    color: on ? CHART.INK : CHART.DIM,
                  }}
                >
                  {CHIP_LABEL[w]}
                </button>
              );
            })}
          </div>
        ) : (
          <span />
        )}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: CHART.DIM,
            ...FIG,
          }}
        >
          {chipsVisible && !withheld
            ? t('common:handicap.index.sample', { count: chartPoints.length })
            : t('common:handicap.index.sampleWithSpan', { count: model.total, span: spanLabel })}
        </div>
      </div>

      {/* The chart */}
      <div style={{ marginTop: 12 }}>
        <IndexChart
          points={chartPoints}
          height={96}
          halo={PAGE_CANVAS}
          hideLegend
          hideFooter
          showPoints={withheld}
          formatLabel={(ts) =>
            format(new Date(ts), active === '12m' || active === 'all' ? 'MMM yyyy' : 'd MMM')
          }
        />
      </div>

      {withheld && (
        <div style={{ marginTop: 12, fontSize: 12, color: CHART.DIM, ...FIG }}>
          {t('common:handicap.index.withheld', { count: model.total })}
        </div>
      )}
    </HcpSection>
  );
};

export default IndexSection;

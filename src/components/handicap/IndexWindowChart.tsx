/**
 * IndexWindowChart — BRIEF_ONE_INDEX_CHART: the ONE index chart drawn by the
 * profile hero, the Handicap page (IndexSection) and the index glance.
 *
 * - Points come from indexWindow (src/lib/whs/indexWindow.ts); the tone is that
 *   window's net (last − first) through indexToneOf, so a figure printed beside
 *   the chart and the line colour cannot disagree.
 * - Geometry (indexLine, promoted from the profile hero): viewBox 361×64,
 *   preserveAspectRatio none, y = 8 + (max − v)/(max − min) × 42 (flat at 8),
 *   x by date from the first point to max(today, last point). HTML overlays
 *   scale the y with `height` (y × height / 64).
 * - Rounds are the shared last five (src/lib/whs/lastFive.ts): an 8px dot on
 *   the line by date, green only when `counts`. data-form-round-dot and
 *   data-counts are the profile's attributes and stay.
 * - Scrub (Handicap page only): the caller owns pointer handling; `scrub.active`
 *   draws the crosshair and the active dot. No SVG circles anywhere.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { indexToneOf, INDEX_LEVEL_INK } from '@/lib/whs/indexWindow';

export interface HeroIndexPoint { value: number; observed_at: string }

export function indexLine(points: HeroIndexPoint[], today = Date.now()) {
  const valid = points.filter(p => Number.isFinite(p.value) && Number.isFinite(Date.parse(p.observed_at))).slice().sort((a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));
  if (valid.length < 2) return null;
  const start = Date.parse(valid[0].observed_at);
  const end = Math.max(today, Date.parse(valid[valid.length - 1].observed_at));
  const min = Math.min(...valid.map(p => p.value));
  const max = Math.max(...valid.map(p => p.value));
  const xOf = (date: number) => end === start ? 0 : (date - start) / (end - start) * 361;
  const yOf = (value: number) => max === min ? 8 : 8 + (max - value) / (max - min) * 42;
  const coords = valid.map(p => ({ x: xOf(Date.parse(p.observed_at)), y: yOf(p.value) }));
  const last = coords[coords.length - 1];
  if (last.x < 361) coords.push({ x: 361, y: last.y });
  const at = (date: string) => {
    const ms = Date.parse(date);
    if (!Number.isFinite(ms) || ms < start || ms > end) return null;
    const x = xOf(ms);
    const right = coords.findIndex(p => p.x >= x);
    if (right <= 0) return { x, y: coords[0].y };
    const a = coords[right - 1], b = coords[right];
    return { x, y: b.x === a.x ? b.y : a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x) };
  };
  return { coords, at, min, max, xOf, yOf, lowY: yOf(min), lastY: last.y, start, end, values: valid };
}

const W = 361;
const CANVAS = '#0A0A0C';
const LOW_LINE = 'rgba(255,255,255,0.14)';
const DIM = 'rgba(248,250,252,0.42)';
const AXIS_INK = 'rgba(248,250,252,0.30)';
const MICRO: React.CSSProperties = { fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' };
const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

export function formatIndexValue(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

export interface IndexWindowChartProps {
  points: HeroIndexPoint[];
  windowDays: number;
  rounds?: ReadonlyArray<{ id: string; date: string; counts: boolean }>;
  height?: number;
  scrub?: { active: number | null };
  /** Hide the axis row (the profile's connect example). */
  hideAxis?: boolean;
}

export const IndexWindowChart: React.FC<IndexWindowChartProps> = ({ points, windowDays, rounds = [], height = 64, scrub, hideAxis }) => {
  const { t } = useTranslation(['common']);
  const gid = React.useId().replace(/:/g, '');
  const line = indexLine(points);
  if (!line) return null;
  const sorted = line.values;
  const net = sorted[sorted.length - 1].value - sorted[0].value;
  const color = indexToneOf(net);
  const fillTop = color === INDEX_LEVEL_INK ? 0.16 : 0.28;
  const sy = height / 64;
  const d = line.coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const low = formatIndexValue(line.min);
  const windowWord = windowDays >= 365
    ? t('common:handicap.chart.months', { count: Math.round(windowDays / 30.4), defaultValue: `${Math.round(windowDays / 30.4)} months` })
    : t('common:handicap.chart.days', { count: windowDays, defaultValue: `${windowDays} days` });
  const active = scrub?.active != null ? sorted[Math.min(Math.max(scrub.active, 0), sorted.length - 1)] : null;
  const activeXY = active ? { x: line.xOf(Date.parse(active.observed_at)), y: line.yOf(active.value) } : null;
  return (
    <div data-index-window-chart={windowDays}>
      <div style={{ height, position: 'relative' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${W} 64`} preserveAspectRatio="none" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`iwc-fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={fillTop} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,64 ${d} ${W},64`} fill={`url(#iwc-fill-${gid})`} stroke="none" />
          <line data-index-low-line x1={0} y1={line.lowY} x2={W} y2={line.lowY} stroke={LOW_LINE} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <polyline data-index-line={color} points={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {activeXY && <line data-index-crosshair x1={activeXY.x} y1={0} x2={activeXY.x} y2={64} stroke="#F8FAFC" strokeOpacity={0.85} strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        </svg>
        {rounds.map(r => {
          const p = line.at(r.date);
          if (!p) return null;
          return <span key={r.id} aria-hidden data-form-round-dot={r.id} data-counts={r.counts ? 'true' : 'false'} className="profile-index-round-dot"
            style={{ position: 'absolute', width: 8, height: 8, margin: '-4px 0 0 -4px', borderRadius: '50%', background: r.counts ? INDEX_DELTA.dark.improved : '#F8FAFC', boxShadow: `0 0 0 2px ${CANVAS}`, left: `${p.x / W * 100}%`, top: p.y * sy }} />;
        })}
        {activeXY && <span aria-hidden data-index-active-dot style={{ position: 'absolute', width: 10, height: 10, margin: '-5px 0 0 -5px', borderRadius: '50%', background: '#F8FAFC', boxShadow: `0 0 0 2px ${CANVAS}`, left: `${activeXY.x / W * 100}%`, top: activeXY.y * sy }} />}
        <span data-index-low-label style={{ position: 'absolute', left: 0, top: line.lowY * sy, transform: 'translateY(-50%)', ...MICRO, color: DIM, background: CANVAS, paddingRight: 6, ...FIGS }}>
          {t('common:handicap.chart.low', { value: low, defaultValue: `Low ${low}` })}
        </span>
      </div>
      {!hideAxis && <div data-index-axis style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', ...MICRO, color: AXIS_INK }}>
        <span>{t('common:handicap.chart.ago', { window: windowWord, defaultValue: `${windowWord} ago` })}</span>
        <span>{t('common:handicap.chart.today', { defaultValue: 'Today' })}</span>
      </div>}
    </div>
  );
};

export default IndexWindowChart;

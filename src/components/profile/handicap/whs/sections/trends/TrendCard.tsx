import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { TrendMetric, TrendRange } from './types';

interface Props {
  metric: TrendMetric;
  range: TrendRange;
  onRangeChange: (next: TrendRange) => void;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  hairline: 'rgba(15,23,42,0.08)',
  cardBg: '#FFFFFF',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  green: '#059669',
  greenTint: 'rgba(5,150,105,0.10)',
  red: '#9F1D1D',
  redTint: 'rgba(159,29,29,0.10)',
};
const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const RANGES: { key: TrendRange; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '1m', label: '1M' },
  { key: '6m', label: '6M' },
];

export const TrendCard: React.FC<Props> = ({ metric, range, onRangeChange }) => {
  const Icon = metric.icon;

  const W = 320;
  const H = 110;
  const PAD_X = 4;
  const PAD_Y = 12;
  const PAD_BOTTOM = 22;

  const numericBuckets = useMemo(
    () =>
      metric.buckets.filter((b) => b.value !== null) as Array<
        typeof metric.buckets[number] & { value: number }
      >,
    [metric.buckets],
  );

  const { coords, yBandTop, yBandBottom, xLabels } = useMemo(() => {
    const allValues = [
      ...numericBuckets.map((b) => b.value),
      ...(metric.typicalRangeLow !== null ? [metric.typicalRangeLow] : []),
      ...(metric.typicalRangeHigh !== null ? [metric.typicalRangeHigh] : []),
    ];
    if (allValues.length === 0) {
      return {
        coords: [] as Array<{ x: number; y: number; bucketIdx: number }>,
        yBandTop: 0,
        yBandBottom: 0,
        xLabels: [] as Array<{ x: number; label: string }>,
      };
    }
    const yMinRaw = Math.min(...allValues) - 0.3;
    const yMaxRaw = Math.max(...allValues) + 0.3;
    const yRange = yMaxRaw - yMinRaw || 1;
    const yFor = (v: number) =>
      H - PAD_BOTTOM - ((v - yMinRaw) / yRange) * (H - PAD_Y - PAD_BOTTOM);

    const total = metric.buckets.length;
    const xFor = (i: number) =>
      total === 1 ? W / 2 : PAD_X + (i / (total - 1)) * (W - 2 * PAD_X);

    const coords = metric.buckets
      .map((b, i) =>
        b.value === null ? null : { x: xFor(i), y: yFor(b.value), bucketIdx: i },
      )
      .filter(Boolean) as Array<{ x: number; y: number; bucketIdx: number }>;

    const yBandTop = metric.typicalRangeHigh !== null ? yFor(metric.typicalRangeHigh) : 0;
    const yBandBottom = metric.typicalRangeLow !== null ? yFor(metric.typicalRangeLow) : 0;

    let xLabels: Array<{ x: number; label: string }>;
    if (total <= 4) {
      xLabels = metric.buckets.map((b, i) => ({ x: xFor(i), label: b.label }));
    } else {
      xLabels = [
        { x: xFor(0), label: metric.buckets[0].label },
        {
          x: xFor(Math.floor(total / 2)),
          label: metric.buckets[Math.floor(total / 2)].label,
        },
        { x: xFor(total - 1), label: metric.buckets[total - 1].label },
      ];
    }

    return { coords, yBandTop, yBandBottom, xLabels };
  }, [metric.buckets, metric.typicalRangeLow, metric.typicalRangeHigh, numericBuckets]);

  const path =
    coords.length > 0
      ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
      : '';

  const lastCoord = coords[coords.length - 1];

  const deltaPositive =
    metric.previousPeriodDelta === null
      ? null
      : metric.betterDirection === 'down'
        ? metric.previousPeriodDelta < 0
        : metric.previousPeriodDelta > 0;
  const Arrow =
    metric.previousPeriodDelta !== null && metric.previousPeriodDelta < 0 ? ArrowDown : ArrowUp;

  const formatValue = (v: number) => v.toFixed(metric.decimals);

  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.hairline}`,
        borderRadius: 16,
        padding: '16px 0 14px',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 12px',
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: T.amberTint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={15} color={T.amberDeep} strokeWidth={2.2} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 800,
                color: T.ink,
                letterSpacing: '-0.01em',
              }}
            >
              {metric.label}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: T.inkMute, marginTop: 1 }}>
              {metric.sublabel}
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label={`${metric.label} time range`}
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: 'rgba(15,23,42,0.04)',
            borderRadius: 999,
          }}
        >
          {RANGES.map((r) => {
            const active = r.key === range;
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={active}
                onClick={() => onRangeChange(r.key)}
                style={{
                  padding: '4px 10px',
                  fontSize: 10,
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  background: active ? T.ink : 'transparent',
                  color: active ? '#fff' : T.inkMute,
                  letterSpacing: '0.04em',
                  transition: 'all 150ms ease',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: '14px 16px 8px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 800,
              color: T.inkMute,
              letterSpacing: '0.16em',
              marginBottom: 2,
            }}
          >
            CURRENT
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 38,
              fontWeight: 200,
              color: T.ink,
              fontFamily: FONT_DISPLAY,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {metric.currentValue !== null ? formatValue(metric.currentValue) : '—'}
            <span style={{ fontSize: 18, color: T.inkMute, fontWeight: 600 }}>{metric.unit}</span>
          </p>
        </div>
        {metric.previousPeriodDelta !== null && deltaPositive !== null && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 999,
              background: deltaPositive ? T.greenTint : T.redTint,
              border: `1px solid ${deltaPositive ? 'rgba(5,150,105,0.20)' : 'rgba(159,29,29,0.20)'}`,
              color: deltaPositive ? T.green : T.red,
              fontSize: 12,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Arrow size={12} strokeWidth={2.6} />
            {Math.abs(metric.previousPeriodDelta).toFixed(metric.decimals)}
            {metric.unit} past period
          </div>
        )}
      </div>

      <div style={{ padding: '8px 12px 0' }}>
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}
          aria-label={`${metric.label} over the last ${range === '7d' ? '7 days' : range === '1m' ? 'month' : '6 months'}`}
          role="img"
        >
          <defs>
            <linearGradient id={`fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.amber} stopOpacity={0.16} />
              <stop offset="100%" stopColor={T.amber} stopOpacity={0} />
            </linearGradient>
          </defs>

          {metric.typicalRangeLow !== null && metric.typicalRangeHigh !== null && (
            <>
              <rect
                x={0}
                y={yBandTop}
                width={W}
                height={yBandBottom - yBandTop}
                fill="rgba(15,23,42,0.05)"
              />
              <text
                x={W - 4}
                y={yBandTop - 3}
                textAnchor="end"
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  fill: T.inkMute,
                  letterSpacing: '0.08em',
                }}
              >
                TYPICAL RANGE
              </text>
            </>
          )}

          {coords.length >= 2 && (
            <>
              <path
                d={`${path} L ${coords[coords.length - 1].x} ${H - PAD_BOTTOM} L ${coords[0].x} ${H - PAD_BOTTOM} Z`}
                fill={`url(#fill-${metric.id})`}
              />
              <path
                d={path}
                fill="none"
                stroke={T.amber}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {lastCoord && metric.currentValue !== null && (
            <g>
              <circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r={4}
                fill={T.amber}
                stroke="#fff"
                strokeWidth={2}
              />
              <text
                x={lastCoord.x - 6}
                y={lastCoord.y - 8}
                textAnchor="end"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  fill: T.ink,
                  fontFamily: FONT_DISPLAY,
                }}
              >
                {formatValue(metric.currentValue)}
                {metric.unit}
              </text>
            </g>
          )}

          {xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={H - 4}
              textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
              style={{
                fontSize: 9,
                fontWeight: 700,
                fill: T.inkMute,
                letterSpacing: '0.04em',
              }}
            >
              {l.label}
            </text>
          ))}

          {coords.length === 0 && (
            <text
              x={W / 2}
              y={H / 2}
              textAnchor="middle"
              style={{ fontSize: 11, fontWeight: 700, fill: T.inkMute }}
            >
              No rounds in this range yet
            </text>
          )}
        </svg>
      </div>

      <div
        style={{
          padding: '12px 16px 0',
          marginTop: 8,
          borderTop: `1px solid ${T.hairline}`,
        }}
      >
        <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.45, color: T.inkSoft }}>
          {metric.insight}
        </p>
      </div>
    </div>
  );
};

export default TrendCard;

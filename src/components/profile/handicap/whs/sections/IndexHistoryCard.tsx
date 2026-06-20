import React, { useMemo, useState } from 'react';
import { useHandicapHistory } from '@/lib/whs/hooks';
import { DarkSectionHeader, DarkCard } from './_shared/darkAtoms';
import { fmtHcp } from '@/lib/whs/format';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

type Range = '1M' | '3M' | '1Y';

interface Props {
  connectionId: string;
}

const IndexHistoryCard: React.FC<Props> = ({ connectionId }) => {
  const [range, setRange] = useState<Range>('3M');

  const daysBack = range === '1M' ? 30 : range === '3M' ? 90 : 365;
  const { data: history, isLoading } = useHandicapHistory(connectionId, daysBack);

  const points = useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history]
      .filter((p: any) => p.handicap_index != null)
      .sort(
        (a: any, b: any) =>
          new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime(),
      ) as { observed_at: string; handicap_index: number }[];
  }, [history]);

  // ── Geometry constants ──────────────────────────────────────
  const W = 320;
  const H = 180;
  const PADDING_X = 6;
  const PADDING_Y_TOP = 18;
  const PADDING_Y_BOTTOM = 14;
  const plotW = W - PADDING_X * 2;
  const plotH = H - PADDING_Y_TOP - PADDING_Y_BOTTOM;

  const chart = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const firstHcp = first.handicap_index;
    const lastHcp = last.handicap_index;
    const netDelta = lastHcp - firstHcp;

    const allHcps = points.map((p) => p.handicap_index);
    const minHcp = Math.min(...allHcps);
    const maxHcp = Math.max(...allHcps);
    const rangeHcp = maxHcp - minHcp || 1;
    const yPad = rangeHcp * 0.15;
    const yMin = minHcp - yPad;
    const yMax = maxHcp + yPad;
    const ySpan = yMax - yMin || 1;

    const firstT = new Date(first.observed_at).getTime();
    const lastT = new Date(last.observed_at).getTime();
    const tSpan = lastT - firstT || 1;

    const px = (ts: number) => PADDING_X + ((ts - firstT) / tSpan) * plotW;
    const py = (h: number) => PADDING_Y_TOP + ((yMax - h) / ySpan) * plotH;

    const linePath = points
      .map((p, i) => {
        const x = px(new Date(p.observed_at).getTime());
        const y = py(p.handicap_index);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    const baselineY = H - PADDING_Y_BOTTOM;
    const firstX = px(firstT);
    const lastX = px(lastT);
    const firstY = py(firstHcp);
    const lastY = py(lastHcp);
    const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baselineY} L ${firstX.toFixed(2)} ${baselineY} Z`;

    const minIdx = allHcps.indexOf(minHcp);
    const minDate = points[minIdx].observed_at;

    return {
      firstHcp,
      lastHcp,
      netDelta,
      minHcp,
      maxHcp,
      minDate,
      firstT,
      lastT,
      px,
      linePath,
      areaPath,
      firstX,
      firstY,
      lastX,
      lastY,
    };
  }, [points, plotW, plotH]);

  const xLabels = useMemo(() => {
    if (!chart) return [] as { x: number; text: string }[];
    const { firstT, lastT, px } = chart;
    const labels: { x: number; text: string }[] = [];
    if (range === '1M') {
      const mid = (firstT + lastT) / 2;
      labels.push(
        { x: px(firstT), text: fmtMonthDay(firstT) },
        { x: px(mid), text: fmtMonthDay(mid) },
        { x: px(lastT), text: fmtMonthDay(lastT) },
      );
    } else {
      const months = uniqueMonthsBetween(firstT, lastT);
      const target = range === '3M' ? 3 : 4;
      const step = Math.max(1, Math.floor(months.length / target));
      for (let i = 0; i < months.length; i += step) {
        labels.push({ x: px(months[i]), text: fmtMonth(months[i]) });
      }
    }
    return labels;
  }, [chart, range]);

  if (isLoading || !chart) return null;

  const { netDelta, firstHcp, lastHcp, minHcp, minDate, linePath, areaPath, firstX, firstY, lastX, lastY } = chart;

  const isImproving = netDelta < -0.05;
  const isWorsening = netDelta > 0.05;
  const lineColorHex = isImproving ? '#059669' : isWorsening ? '#DC2626' : '#F7931E';

  const gradientId = `idx-fade-${connectionId.slice(0, 8)}`;

  const periodLabel =
    range === '1M' ? '30 days' : range === '3M' ? '90 days' : '1 year';

  const arrow = netDelta < -0.05 ? '↓' : netDelta > 0.05 ? '↑' : '—';
  const minDateLabel = formatMinDate(minDate);

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="INDEX HISTORY"
        right={<RangePills value={range} onChange={setRange} />}
      />
      <DarkCard>
        <div style={{ padding: '16px 18px', fontFamily: FONT }}>
          {/* Inner header — big delta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  color: lineColorHex,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {arrow} {Math.abs(netDelta).toFixed(1)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--hcp-t-60)',
                }}
              >
                over {periodLabel}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--hcp-t-40)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtHcp(firstHcp)} → {fmtHcp(lastHcp)}
            </span>
          </div>

          {/* Chart */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            preserveAspectRatio="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColorHex} stopOpacity={0.18} />
                <stop offset="100%" stopColor={lineColorHex} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={lineColorHex}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Start marker (hollow) */}
            <circle
              cx={firstX}
              cy={firstY}
              r={4}
              fill="var(--hcp-bg-2, #0d0d0d)"
              stroke={lineColorHex}
              strokeWidth={1.5}
            />

            {/* End marker (filled) */}
            <circle cx={lastX} cy={lastY} r={4} fill={lineColorHex} />

          </svg>

          {/* Dot value labels — anchored above start/end date labels */}
          <div style={{ position: 'relative', height: 16, marginTop: 4 }}>
            <span
              style={{
                position: 'absolute',
                left: `${(firstX / W) * 100}%`,
                transform: 'translateX(0)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtHcp(firstHcp)}
            </span>
            <span
              style={{
                position: 'absolute',
                left: `${(lastX / W) * 100}%`,
                transform: 'translateX(-100%)',
                fontSize: 11,
                fontWeight: 800,
                color: lineColorHex,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtHcp(lastHcp)}
            </span>
          </div>

          {/* X-axis labels */}
          <div
            style={{
              position: 'relative',
              height: 14,
              marginTop: 4,
            }}
          >
            {xLabels.map((l, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${(l.x / W) * 100}%`,
                  transform:
                    i === 0
                      ? 'translateX(0)'
                      : i === xLabels.length - 1
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                  fontSize: 9.5,
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                  color: 'var(--hcp-t-40)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {l.text}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 0 0',
              borderTop: '1px solid var(--hcp-line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: 'var(--hcp-t-60)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: lineColorHex,
                }}
              />
              <span>
                Lowest{' '}
                <strong
                  style={{
                    color: 'var(--hcp-t-100)',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtHcp(minHcp)}
                </strong>{' '}
                on {minDateLabel}
              </span>
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--hcp-t-40)' }}>
              {points.length} snapshots
            </span>
          </div>
        </div>
      </DarkCard>
    </section>
  );
};

// ── Subcomponents ───────────────────────────────────────────

const RangePills: React.FC<{
  value: Range;
  onChange: (r: Range) => void;
}> = ({ value, onChange }) => {
  const options: Range[] = ['1M', '3M', '1Y'];
  return (
    <div style={{ display: 'inline-flex', gap: 4, padding: 3, background: 'var(--hcp-bg-2)', borderRadius: 999 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '5px 12px',
              background: active ? 'var(--hcp-bg-3)' : 'transparent',
              color: active ? '#0A0E14' : 'var(--hcp-t-60)',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 160ms ease, color 160ms ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────

function fmtMonth(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
}

function fmtMonthDay(ts: number): string {
  return new Date(ts)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toUpperCase();
}

function uniqueMonthsBetween(start: number, end: number): number[] {
  const result: number[] = [];
  const cursor = new Date(start);
  cursor.setUTCDate(1);
  while (cursor.getTime() <= end) {
    result.push(cursor.getTime());
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return result;
}

function formatMinDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const ageDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (ageDays < 14) {
    return d.toLocaleDateString('en-GB', { weekday: 'long' });
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default IndexHistoryCard;

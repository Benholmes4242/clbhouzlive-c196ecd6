import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHandicapHistory } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { DarkSectionHeader } from './_shared/darkAtoms';
import { formatDayMonthShortGB } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const NUM: React.CSSProperties = { fontFamily: FONT, fontVariantNumeric: 'tabular-nums lining-nums' };

// ── Tokens ────────────────────────────────────────────────────────────────
const GOOD = '#34D399';
const BAD = 'var(--hcp-bad, #EF4444)';
const INK = 'var(--hcp-t-100)';
const DIM = 'var(--hcp-t-60)';
const FAINT = 'var(--hcp-t-40)';
const LINE = 'var(--hcp-line)';

// ── Chart geometry ────────────────────────────────────────────────────────
const W = 358;
const H = 118;
const PADX = 8;
const PADR = 32;

type Range = '1M' | '3M' | '1Y';

interface Props {
  connectionId: string;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const fmtDateShort = (iso: string) => {
  try {
    return formatDayMonthShortGB(iso).toUpperCase();
  } catch {
    return '';
  }
};

const IndexHistoryCard: React.FC<Props> = ({ connectionId }) => {
  const [range, setRange] = useState<Range>('3M');
  // Scope changes are tracked, never awaited.
  const scopeRange = (next: Range) => {
    if (next === range) return;
    analyticsEvents.track('handicap_chart_scoped', {
      chart: 'index_history',
      from: range,
      to: next,
    });
    setRange(next);
  };

  const daysBack = range === '1M' ? 30 : range === '3M' ? 90 : 365;
  const { data: history, isLoading } = useHandicapHistory(connectionId, daysBack);

  const points = useMemo(() => {
    if (!history || history.length === 0) return [];
    type HistoryPoint = { observed_at: string; handicap_index: number | null };
    return (history as ReadonlyArray<HistoryPoint>)
      .filter((p): p is { observed_at: string; handicap_index: number } => p.handicap_index != null)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime(),
      );
  }, [history]);

  const n = points.length;

  const [sel, setSel] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset selection when the period changes.
  useEffect(() => {
    setSel(null);
  }, [range]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="INDEX HISTORY" right={<RangePills value={range} onChange={scopeRange} />} />
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'var(--hcp-bg-1)', border: `1px solid ${LINE}`,
            borderRadius: 18, padding: '16px 14px 12px',
          }}>
            <Skeleton variant="dark" style={{ height: 10, borderRadius: 2 }} />
            <Skeleton variant="dark" style={{ height: 26, borderRadius: 4, margin: '12px 0 8px' }} />
            <Skeleton variant="dark" style={{ height: 118, borderRadius: 4 }} />
            <Skeleton variant="dark" style={{ height: 12, borderRadius: 2, marginTop: 12 }} />
          </div>
        </div>
      </section>
    );
  }

  if (n < 2) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="INDEX HISTORY" right={<RangePills value={range} onChange={scopeRange} />} />
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'var(--hcp-bg-1)', border: `1px solid ${LINE}`,
            borderRadius: 18, padding: '16px 14px', textAlign: 'center',
            color: DIM, fontFamily: FONT, fontSize: 12,
          }}>
            Not enough snapshots in this period yet.
          </div>
        </div>
      </section>
    );
  }

  const values = points.map((p) => p.handicap_index);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range01 = Math.max(dataMax - dataMin, 0.1);
  const first = points[0];
  const last = points[n - 1];
  const netDelta = last.handicap_index - first.handicap_index;

  const isImproving = netDelta < -0.05;
  const isWorsening = netDelta > 0.05;
  const tone = isImproving ? GOOD : isWorsening ? BAD : DIM;

  const x = (i: number) => PADX + (i / (n - 1)) * (W - PADX - PADR);
  const y = (v: number) => 12 + (1 - (v - dataMin) / range01) * (H - 36);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(p.handicap_index).toFixed(2)}`)
    .join(' ');
  const baselineY = H - 20;
  const areaPath = `${linePath} L ${x(n - 1).toFixed(2)} ${baselineY} L ${x(0).toFixed(2)} ${baselineY} Z`;

  // Ticks — [max, mid, min] to 1dp; collapse to min/max when range < 0.5.
  const ticks: number[] = range01 < 0.5
    ? [dataMax, dataMin]
    : [dataMax, (dataMin + dataMax) / 2, dataMin];

  // Period minimum (first occurrence if tied).
  const minIdx = values.indexOf(dataMin);
  const minPoint = points[minIdx];

  const selIdx = clamp(sel ?? n - 1, 0, n - 1);
  const selected = points[selIdx];
  const isSelectedMin = selIdx === minIdx;

  const pick = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const t = clamp((px - PADX) / (W - PADX - PADR), 0, 1);
    setSel(Math.round(t * (n - 1)));
  };

  const periodLabel =
    range === '1M' ? 'LAST 30 DAYS' : range === '3M' ? 'LAST 90 DAYS' : 'LAST 12 MONTHS';

  const arrow = isImproving ? '↓' : isWorsening ? '↑' : '';
  const chipColor = isImproving ? GOOD : isWorsening ? BAD : DIM;

  const gradId = `idx-fade-${connectionId.slice(0, 8)}-${range}`;

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="INDEX HISTORY"
        right={<RangePills value={range} onChange={scopeRange} />}
      />
      <div style={{ padding: '0 16px' }}>
        <div style={{
          background: 'var(--hcp-bg-1)',
          border: `1px solid ${LINE}`,
          borderRadius: 18,
          padding: '16px 14px 12px',
          fontFamily: FONT,
        }}>
          {/* 1. Header row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', padding: '0 4px',
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: DIM,
            }}>
              {periodLabel}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: chipColor, ...NUM }}>
              {arrow ? `${arrow} ` : ''}{Math.abs(netDelta).toFixed(1)}
            </span>
          </div>

          {/* 2. Readout row — UNBOXED */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', margin: '12px 4px 4px', minHeight: 26,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontSize: 20, fontWeight: 700, color: INK, lineHeight: 1,
                letterSpacing: '-0.01em', ...NUM,
              }}>
                {selected.handicap_index.toFixed(1)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: FAINT,
                letterSpacing: '0.06em', ...NUM,
              }}>
                {fmtDateShort(selected.observed_at)}
              </span>
            </span>
            {isSelectedMin && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: GOOD,
              }}>
                LOWEST OF THE PERIOD
              </span>
            )}
          </div>

          {/* 3. Chart */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            preserveAspectRatio="none"
            style={{ display: 'block', touchAction: 'none' }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setScrubbing(true);
              pick(e.clientX);
            }}
            onPointerMove={(e) => { if (scrubbing) pick(e.clientX); }}
            onPointerUp={() => setScrubbing(false)}
            onPointerLeave={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
          >
            {/* a. Area gradient */}
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tone} stopOpacity={0.10} />
                <stop offset="100%" stopColor={tone} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* b. Gridlines */}
            {ticks.map((t, i) => (
              <g key={`tick-${i}`}>
                <line
                  x1={PADX} x2={W - PADR + 4}
                  y1={y(t)} y2={y(t)}
                  stroke="rgba(255,255,255,0.05)" strokeWidth={1}
                />
                <text
                  x={W - 2} y={y(t) + 3}
                  textAnchor="end" fill={FAINT}
                  style={{ fontSize: 9, fontWeight: 700, ...NUM }}
                >
                  {t.toFixed(1)}
                </text>
              </g>
            ))}

            {/* c. Scrub hairline */}
            <line
              x1={x(selIdx)} x2={x(selIdx)}
              y1={8} y2={H - 22}
              stroke="rgba(242,244,247,0.22)" strokeWidth={1}
            />

            {/* d. Area */}
            <path d={areaPath} fill={`url(#${gradId})`} />

            {/* e. Line */}
            <path
              d={linePath} fill="none" stroke={tone} strokeWidth={1.6}
              strokeLinecap="round" strokeLinejoin="round"
            />

            {/* f. Lowest marker */}
            <circle
              cx={x(minIdx)} cy={y(minPoint.handicap_index)}
              r={3} fill="var(--hcp-bg-1)"
              stroke={GOOD} strokeWidth={1.6}
            />

            {/* g. Selected dot */}
            <circle
              cx={x(selIdx)} cy={y(selected.handicap_index)}
              r={4.6} fill={tone}
            />

            {/* h. Extent labels */}
            <text
              x={PADX} y={H - 6} fill={FAINT}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {fmtDateShort(first.observed_at)}
            </text>
            <text
              x={W - PADR} y={H - 6} textAnchor="end" fill={FAINT}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {fmtDateShort(last.observed_at)}
            </text>
          </svg>

          {/* 4. Footer row */}
          <div style={{
            borderTop: `1px solid ${LINE}`,
            marginTop: 10, paddingTop: 10, paddingLeft: 4, paddingRight: 4,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'transparent', border: `1.6px solid ${GOOD}`,
                boxSizing: 'border-box',
              }} />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: FAINT,
              }}>
                LOWEST{' '}
                <span style={{ color: GOOD, ...NUM }}>{dataMin.toFixed(1)}</span>
                {' · '}
                {fmtDateShort(minPoint.observed_at)}
              </span>
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: FAINT, ...NUM,
            }}>
              {n} SNAPSHOTS
            </span>
          </div>
        </div>
      </div>
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
              color: active ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 700,
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

export default IndexHistoryCard;

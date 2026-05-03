import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useHandicapHistory, useHandicapTrend } from '@/lib/whs/hooks';
import type { WhsConnection, HandicapPoint } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
}

type Range = 90 | 365 | 'all';

// ── Tokens ────────────────────────────────────────────────────────────────
const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const INK_MUTE_40 = 'rgba(15,23,42,0.40)';
const INK_HAIR = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const GREEN = '#059669';
const RED = '#9F1D1D';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// Ring
const RING_SIZE = 200;
const RING_R = 76;
const RING_STROKE = 10;
const RING_C = 2 * Math.PI * RING_R;

// Sparkline
const W = 340;
const H = 64;
const PAD_TOP = 6;
const PAD_BOTTOM = 6;

// Number
const NUMBER_SIZE = 64;
const NUMBER_WEIGHT = 700;

// ── Career-low badge — kept for analytics / future use ────────────────────
function useCareerLowBadge(
  currentValue: number | null | undefined,
  yearHistory: HandicapPoint[] | undefined,
): string | null {
  return useMemo(() => {
    if (currentValue === null || currentValue === undefined) return null;
    if (!yearHistory || yearHistory.length === 0) return null;
    const min = yearHistory.reduce(
      (acc, p) =>
        p.handicap_index < acc.value
          ? { value: p.handicap_index, at: p.observed_at }
          : acc,
      { value: Infinity, at: '' },
    );
    if (min.value === Infinity) return null;
    if (Math.abs(min.value - currentValue) > 0.05) return null;
    const observed = new Date(min.at).getTime();
    const now = Date.now();
    const days = Math.floor((now - observed) / 86_400_000);
    if (days < 0) return null;
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    if (days <= 7) return `${days} DAYS AGO`;
    const d = new Date(min.at);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }, [currentValue, yearHistory]);
}

// ── Scrub date label ──────────────────────────────────────────────────────
function scrubDateLabel(point: HandicapPoint, range: Range): string {
  const d = new Date(point.observed_at);
  if (range === 365 || range === 'all') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ── Component ─────────────────────────────────────────────────────────────
const HeroHandicapCard: React.FC<Props> = ({ connection }) => {
  const [range, setRange] = useState<Range>('all');
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history, isLoading: historyLoading } = useHandicapHistory(connection.id, range);
  const { data: yearHistory } = useHandicapHistory(connection.id, 'all');

  const current = trend?.current ?? null;
  // Kept for analytics — not rendered in hero anymore
  useCareerLowBadge(current, yearHistory);

  const points: HandicapPoint[] = history ?? [];

  const coords = useMemo(() => {
    if (points.length === 0) return [] as { x: number; y: number; idx: number }[];
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    return points.map((p, i) => {
      const x = points.length === 1 ? W / 2 : (i / (points.length - 1)) * W;
      const y = H - PAD_BOTTOM - ((max - p.handicap_index) / r) * (H - PAD_TOP - PAD_BOTTOM);
      return { x, y, idx: i };
    });
  }, [points]);

  const pathD = useMemo(() => {
    if (coords.length === 0) return '';
    return coords.reduce(
      (acc, c, i) => acc + (i === 0 ? `M ${c.x} ${c.y}` : ` L ${c.x} ${c.y}`),
      '',
    );
  }, [coords]);

  const areaD = useMemo(() => {
    if (coords.length === 0) return '';
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${pathD} L ${last.x} ${H} L ${first.x} ${H} Z`;
  }, [coords, pathD]);

  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 50);
    return () => clearTimeout(t);
  }, [range, points.length]);

  const updateScrubFromEvent = (clientX: number) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xInViewBox = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - xInViewBox);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setScrubIdx(nearest);
  };

  const handlePointerMove = (e: React.PointerEvent) => updateScrubFromEvent(e.clientX);
  const handlePointerDown = (e: React.PointerEvent) => updateScrubFromEvent(e.clientX);
  const clearScrub = () => setScrubIdx(null);

  // ── Loading state ───────────────────────────────────────────────────────
  if (trendLoading || historyLoading) {
    return (
      <section style={{ padding: '24px 12px 20px', marginBottom: 24 }}>
        <div style={{ height: 12, width: 80, background: INK_HAIR, borderRadius: 2, marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ height: RING_SIZE, width: RING_SIZE, background: INK_HAIR, borderRadius: '50%' }} />
        </div>
        <div style={{ height: 64, width: '100%', background: INK_HAIR, borderRadius: 4 }} />
      </section>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (current === null) {
    return (
      <section style={{ padding: '24px 12px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '0 4px' }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%', background: AMBER,
              animation: 'liveDot 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 800, color: INK, letterSpacing: '0.18em' }}>
            YOUR INDEX
          </span>
        </div>
        <p style={{ fontSize: 14, color: INK_MUTE, fontStyle: 'italic', lineHeight: 1.5, margin: 0, padding: '0 4px' }}>
          We're waiting for your first handicap snapshot. Play a round and your index will appear here.
        </p>
        <style>{keyframes}</style>
      </section>
    );
  }

  const scrubPoint = scrubIdx !== null ? points[scrubIdx] : null;
  const scrubValue = scrubPoint?.handicap_index ?? current;
  const isScrubbing = scrubIdx !== null && scrubPoint !== null;

  // Ring math — 0 = scratch (full ring), 28 = max (empty ring)
  const ringPct = Math.max(0, Math.min(1, 1 - scrubValue / 28));
  const ringDash = ringPct * RING_C;

  // ── Trend pill ──────────────────────────────────────────────────────────
  const trendNode =
    trend && trend.delta !== null && trend.delta !== undefined && Math.abs(trend.delta) >= 0.05
      ? (() => {
          const isImprovement = trend.delta < 0;
          const Arrow = isImprovement ? ArrowDown : ArrowUp;
          const color = isImprovement ? GREEN : RED;
          const bgColor = isImprovement ? 'rgba(5,150,105,0.10)' : 'rgba(159,29,29,0.10)';
          const borderColor = isImprovement ? 'rgba(5,150,105,0.25)' : 'rgba(159,29,29,0.25)';
          return (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999,
                background: bgColor, border: `1px solid ${borderColor}`,
                color, fontSize: 13, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              <Arrow size={14} strokeWidth={2.5} />
              <span>{Math.abs(trend.delta).toFixed(1)} past 30d</span>
            </div>
          );
        })()
      : null;

  return (
    <section style={{ padding: '24px 12px 20px', marginBottom: 24 }}>
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%', background: AMBER,
              animation: 'liveDot 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 800, color: INK, letterSpacing: '0.18em' }}>
            YOUR INDEX
          </span>
        </div>
        <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: 'rgba(15,23,42,0.04)', borderRadius: 999 }}>
          {([90, 365, 'all'] as Range[]).map(r => {
            const active = r === range;
            const label = r === 'all' ? 'ALL' : r === 365 ? '1Y' : '90D';
            return (
              <button
                key={String(r)}
                onClick={() => setRange(r)}
                style={{
                  padding: '4px 10px', fontSize: 10, fontWeight: 800,
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                  background: active ? INK : 'transparent',
                  color: active ? '#fff' : INK_MUTE,
                  letterSpacing: '0.02em',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ring with handicap inside */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            {/* Track */}
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
              fill="none" stroke={INK_06} strokeWidth={RING_STROKE}
            />
            {/* Progress */}
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
              fill="none" stroke={AMBER} strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${ringDash} ${RING_C}`}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22, 0.61, 0.36, 1)' }}
            />
          </svg>
          {/* Number centered in ring */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontSize: NUMBER_SIZE, fontWeight: NUMBER_WEIGHT, lineHeight: 1,
              color: isScrubbing ? INK : AMBER,
              letterSpacing: '-0.025em',
              transition: 'color 200ms ease',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}>
              {scrubValue.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Delta row */}
      <div style={{
        display: 'flex', justifyContent: 'center', minHeight: 28, marginBottom: 14,
        opacity: isScrubbing ? 0 : 1,
        transition: 'opacity 200ms ease',
      }}>
        {trendNode}
      </div>

      {/* Sparkline strip */}
      <div style={{ padding: '0 4px' }}>
        <svg
          ref={svgRef}
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerLeave={clearScrub}
          onPointerCancel={clearScrub}
        >
          <defs>
            <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AMBER} stopOpacity={0.28} />
              <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
            </linearGradient>
          </defs>

          {coords.length >= 2 && (
            <>
              <path d={areaD} fill="url(#heroSparkFill)" />
              <path
                d={pathD}
                fill="none"
                stroke={AMBER}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 2000,
                  strokeDashoffset: drawn ? 0 : 2000,
                  transition: 'stroke-dashoffset 1200ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                }}
              />
            </>
          )}

          {coords.length === 1 && (
            <line
              x1={0} y1={coords[0].y} x2={W} y2={coords[0].y}
              stroke={AMBER} strokeWidth={2} strokeLinecap="round" opacity={0.7}
            />
          )}

          {coords.length === 0 && (
            <line
              x1={0} y1={H / 2} x2={W} y2={H / 2}
              stroke={INK} strokeWidth={1} opacity={0.3}
            />
          )}

          {/* Endpoint dot — live mode (no pulse) */}
          {!isScrubbing && coords.length > 0 && (() => {
            const last = coords[coords.length - 1];
            return (
              <circle
                cx={last.x} cy={last.y} r={4}
                fill={AMBER} stroke="#fff" strokeWidth={2}
              />
            );
          })()}

          {/* Scrub crosshair */}
          {isScrubbing && coords[scrubIdx!] && (
            <g>
              <line
                x1={coords[scrubIdx!].x} y1={0}
                x2={coords[scrubIdx!].x} y2={H}
                stroke={INK} strokeWidth={1}
                strokeDasharray="3 3" opacity={0.4}
              />
              <circle
                cx={coords[scrubIdx!].x} cy={coords[scrubIdx!].y} r={5}
                fill="#fff" stroke={INK} strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Timeline */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 8, fontSize: 10, fontWeight: 700, color: INK_MUTE_40,
          letterSpacing: '0.12em',
        }}>
          {isScrubbing && scrubPoint ? (
            <>
              <span />
              <span style={{ color: INK_MUTE }}>{scrubDateLabel(scrubPoint, range)}</span>
              <span />
            </>
          ) : points.length >= 2 ? (
            <>
              <span>{scrubDateLabel(points[0], range)}</span>
              <span>{scrubDateLabel(points[Math.floor(points.length / 2)], range)}</span>
              <span>{scrubDateLabel(points[points.length - 1], range)}</span>
            </>
          ) : null}
        </div>
      </div>

      <style>{keyframes}</style>
    </section>
  );
};

const keyframes = `
@keyframes liveDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
`;

export default HeroHandicapCard;
export { HeroHandicapCard };

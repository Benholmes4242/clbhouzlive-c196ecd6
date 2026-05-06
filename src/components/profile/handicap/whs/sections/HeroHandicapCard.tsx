import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useHandicapHistory, useHandicapTrend, useAllScores } from '@/lib/whs/hooks';
import { whsDisplayedHcp, formatDisplayedHcp, fmtDiff } from '@/lib/whs/format';
import type { WhsConnection, HandicapPoint } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
}

type Range = 90 | 365 | 'all';

// ── Tokens ────────────────────────────────────────────────────────────────
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const INK_04 = 'rgba(15,23,42,0.04)';
const GREEN = '#059669';
const RED = '#9F1D1D';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// Ring composition
const RING_SIZE = 280;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;
const R_OUTER = 124;
const STROKE_OUTER = 14;
const C_OUTER = 2 * Math.PI * R_OUTER;
const R_INNER = 102;
const STROKE_INNER = 8;
const C_INNER = 2 * Math.PI * R_INNER;

// Sparkline
const W = 340;
const H = 110;
const PAD_TOP = 22;
const PAD_BOTTOM = 22;

// ── Milestone progress ────────────────────────────────────────────────────
function calcMilestoneProgress(h: number) {
  const displayed = whsDisplayedHcp(h);
  const windowTop = displayed + 0.4;
  const windowBottom = displayed - 0.5;
  const progress = (windowTop - h) / (windowTop - windowBottom);
  return {
    displayed,
    windowTop,
    windowBottom,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

// ── Form calculation ──────────────────────────────────────────────────────
function calcForm(hcp: number, last5Diffs: number[]) {
  if (last5Diffs.length === 0) {
    return { formStrokes: 0, fillFraction: 0, direction: 'neutral' as const };
  }
  const avg = last5Diffs.reduce((s, v) => s + v, 0) / last5Diffs.length;
  const formStrokes = hcp - avg;
  const capped = Math.max(-2, Math.min(2, formStrokes));
  const fillFraction = Math.abs(capped) / 2;
  return {
    formStrokes,
    fillFraction,
    direction:
      formStrokes > 0.05 ? ('positive' as const)
      : formStrokes < -0.05 ? ('negative' as const)
      : ('neutral' as const),
  };
}

// ── Monthly movement calculation (replaces form for inner ring) ─────────
function calcMonthlyMovement(delta: number | null) {
  if (delta == null) {
    return { delta: null, fillFraction: 0, direction: 'neutral' as const };
  }
  const capped = Math.max(-1, Math.min(1, delta));
  const fillFraction = Math.abs(capped);
  return {
    delta,
    fillFraction,
    direction:
      delta < -0.05 ? ('cut' as const)
      : delta > 0.05 ? ('up' as const)
      : ('neutral' as const),
  };
}

const HeroHandicapCard: React.FC<Props> = ({ connection }) => {
  const [range, setRange] = useState<Range>('all');
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history, isLoading: historyLoading } = useHandicapHistory(connection.id, range);
  const { data: recent } = useAllScores(connection.id);


  const current = trend?.current ?? null;
  const points: HandicapPoint[] = history ?? [];

  const last5Diffs = useMemo(() => {
    if (!recent) return [];
    return recent
      .slice(0, 5)
      .map((r: any) => r.handicap_differential)
      .filter((d: any): d is number => typeof d === 'number');
  }, [recent]);

  const coords = useMemo(() => {
    if (points.length === 0) return [] as { x: number; y: number; idx: number }[];
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    return points.map((p, i) => {
      const x = points.length === 1 ? W / 2 : (i / (points.length - 1)) * W;
      const y = PAD_TOP + ((max - p.handicap_index) / r) * (H - PAD_TOP - PAD_BOTTOM);
      return { x, y, idx: i };
    });
  }, [points]);

  const bestPoint = useMemo(() => {
    if (coords.length === 0) return null;
    let bestIdx = 0;
    let bestVal = points[0].handicap_index;
    for (let i = 1; i < points.length; i++) {
      if (points[i].handicap_index < bestVal) {
        bestVal = points[i].handicap_index;
        bestIdx = i;
      }
    }
    return { coord: coords[bestIdx], value: bestVal };
  }, [coords, points]);

  const worstPoint = useMemo(() => {
    if (coords.length === 0) return null;
    let worstIdx = 0;
    let worstVal = points[0].handicap_index;
    for (let i = 1; i < points.length; i++) {
      if (points[i].handicap_index > worstVal) {
        worstVal = points[i].handicap_index;
        worstIdx = i;
      }
    }
    return { coord: coords[worstIdx], value: worstVal };
  }, [coords, points]);

  const zeroLineY = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    if (0 < min - r * 0.1 || 0 > max + r * 0.1) return null;
    return PAD_TOP + ((max - 0) / r) * (H - PAD_TOP - PAD_BOTTOM);
  }, [points]);

  // Scratch zone band (y=0 to y=1.5). Always render, even if user's min > 1.5
  // — band acts as goal target.
  const scratchBand = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    const project = (v: number) =>
      PAD_TOP + ((max - v) / r) * (H - PAD_TOP - PAD_BOTTOM);
    const yTop = Math.max(0, Math.min(H, project(1.5)));
    const yBottom = Math.max(0, Math.min(H, project(0)));
    if (yBottom <= yTop) return null;
    return { yTop, height: yBottom - yTop };
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
        <div style={{ height: 12, width: 80, background: INK_10, borderRadius: 2, marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ height: RING_SIZE, width: RING_SIZE, background: INK_06, borderRadius: '50%' }} />
        </div>
        <div style={{ height: 50, width: '100%', background: INK_06, borderRadius: 4 }} />
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
          <span style={{ fontSize: 10, fontWeight: 800, color: INK_55, letterSpacing: '0.22em' }}>
            HANDICAP INDEX
          </span>
        </div>
        <p style={{ fontSize: 14, color: INK_55, fontStyle: 'italic', lineHeight: 1.5, margin: 0, padding: '0 4px' }}>
          Your handicap will appear after your first 8 rounds.
        </p>
        <style>{keyframes}</style>
      </section>
    );
  }

  const scrubPoint = scrubIdx !== null ? points[scrubIdx] : null;
  const scrubValue = scrubPoint?.handicap_index ?? current;
  const isScrubbing = scrubIdx !== null && scrubPoint !== null;

  // Milestone math — outer ring
  const milestone = calcMilestoneProgress(scrubValue);
  const outerDash = milestone.progress * C_OUTER;

  // Monthly movement math — inner ring (replaces form)
  const monthly = calcMonthlyMovement(trend?.delta ?? null);
  const useMonthlyRing = monthly.delta != null;
  const fallbackForm = calcForm(current, last5Diffs);

  const innerFillLength = useMonthlyRing
    ? (monthly.fillFraction * C_INNER) / 2
    : (fallbackForm.fillFraction * C_INNER) / 2;

  const showGreenArc = useMonthlyRing
    ? monthly.direction === 'cut'
    : fallbackForm.direction === 'positive';

  const showRedArc = useMonthlyRing
    ? monthly.direction === 'up'
    : fallbackForm.direction === 'negative';

  // Form delta UI
  const formNode = (() => {
    if (trend?.delta != null) {
      const STEADY_THRESHOLD = 0.05;
      const delta = trend.delta;
      const absDelta = Math.abs(delta);
      if (absDelta < STEADY_THRESHOLD) {
        return <span style={{ color: INK_40 }}>Steady · last month</span>;
      }
      if (delta < 0) {
        return (
          <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowDown size={13} strokeWidth={2.5} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {absDelta.toFixed(1)} last month
            </span>
          </span>
        );
      }
      return (
        <span style={{ color: RED, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowUp size={13} strokeWidth={2.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {absDelta.toFixed(1)} last month
          </span>
        </span>
      );
    }

    // FALLBACK — form-last-5
    if (last5Diffs.length < 5) {
      return <span style={{ color: INK_40 }}>Steady form · last 5</span>;
    }
    if (fallbackForm.direction === 'positive') {
      return (
        <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowDown size={13} strokeWidth={2.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtDiff(-Math.abs(fallbackForm.formStrokes))} form
          </span>
          <span style={{ color: INK_40 }}>· last 5</span>
        </span>
      );
    }
    if (fallbackForm.direction === 'negative') {
      return (
        <span style={{ color: RED, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowUp size={13} strokeWidth={2.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            +{Math.abs(fallbackForm.formStrokes).toFixed(1)} form
          </span>
          <span style={{ color: INK_40 }}>· last 5</span>
        </span>
      );
    }
    return <span style={{ color: INK_40 }}>Steady form · last 5</span>;
  })();

  // ── Status word (driven by 8-round form direction) ───────────────────────
  const statusWord =
    fallbackForm.direction === 'negative' && Math.abs(fallbackForm.formStrokes) > 0.5 ? 'EXCELLENT FORM'
    : fallbackForm.direction === 'negative' ? 'TRENDING DOWN'
    : fallbackForm.direction === 'positive' && Math.abs(fallbackForm.formStrokes) > 0.5 ? 'DRIFTING UP'
    : fallbackForm.direction === 'positive' ? 'STEADY'
    : 'STEADY';
  const statusColor =
    fallbackForm.direction === 'negative' ? GREEN
    : fallbackForm.direction === 'positive' && Math.abs(fallbackForm.formStrokes) > 0.5 ? '#9F1239'
    : INK_55;

  // ── Combined delta inline ────────────────────────────────────────────────
  const deltaInline = (() => {
    const d = trend?.delta;
    if (d == null || Math.abs(d) < 0.05) {
      return <span style={{ color: INK_55, fontWeight: 600 }}>Steady</span>;
    }
    const isDown = d < 0;
    return (
      <span style={{
        color: isDown ? GREEN : RED, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        {isDown ? <ArrowDown size={13} strokeWidth={2.5} /> : <ArrowUp size={13} strokeWidth={2.5} />}
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.abs(d).toFixed(1)}</span>
      </span>
    );
  })();

  // ── 6-point sparkline from history points ────────────────────────────────
  const sparkPolyline = (() => {
    if (points.length < 2) return null;
    let samples: HandicapPoint[];
    if (points.length <= 6) {
      samples = points;
    } else {
      const out: HandicapPoint[] = [];
      const n = 6;
      for (let i = 0; i < n; i++) {
        const idx = Math.round((i / (n - 1)) * (points.length - 1));
        out.push(points[idx]);
      }
      samples = out;
    }
    const values = samples.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    const headroom = range * 0.08;
    const yMin = min - headroom;
    const yMax = max + headroom;
    const yRange = yMax - yMin || 1;
    const w = 48;
    const h = 14;
    const coordsLocal = samples.map((p, i) => {
      const x = (i / (samples.length - 1)) * w;
      const y = ((yMax - p.handicap_index) / yRange) * h;
      return { x, y };
    });
    return {
      points: coordsLocal.map(c => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' '),
      lastX: coordsLocal[coordsLocal.length - 1].x,
      lastY: coordsLocal[coordsLocal.length - 1].y,
    };
  })();

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
          <span style={{ fontSize: 10, fontWeight: 800, color: INK_55, letterSpacing: '0.22em' }}>
            HANDICAP INDEX
          </span>
        </div>
        <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: INK_04, borderRadius: 999 }}>
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
                  color: active ? '#fff' : INK_55,
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

      {/* Multi-stream Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, paddingBottom: 56, position: 'relative' }}>
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
          {/* Milestone labels around top of ring */}
          <div style={{
            position: 'absolute', top: -4, left: 16, fontSize: 10.5, fontWeight: 700,
            color: INK_40, letterSpacing: '0.14em',
          }}>
            {formatDisplayedHcp(milestone.displayed)} HCP
          </div>
          <div style={{
            position: 'absolute', top: -4, right: 16, fontSize: 10.5, fontWeight: 700,
            color: AMBER_DEEP, letterSpacing: '0.14em',
          }}>
            {formatDisplayedHcp(milestone.displayed - 1)} HCP →
          </div>

          <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            {/* Outer track */}
            <circle
              cx={CX} cy={CY} r={R_OUTER}
              fill="none" stroke={INK_06} strokeWidth={STROKE_OUTER}
            />
            {/* Outer milestone progress (amber) */}
            <circle
              cx={CX} cy={CY} r={R_OUTER}
              fill="none" stroke={AMBER} strokeWidth={STROKE_OUTER}
              strokeLinecap="round"
              strokeDasharray={`${outerDash} ${C_OUTER}`}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22, 0.61, 0.36, 1)' }}
            />

            {/* Inner track */}
            <circle
              cx={CX} cy={CY} r={R_INNER}
              fill="none" stroke={INK_06} strokeWidth={STROKE_INNER}
            />

            {/* Inner positive form (green, clockwise from 12) */}
            {showGreenArc && (
              <circle
                cx={CX} cy={CY} r={R_INNER} fill="none"
                stroke={GREEN} strokeWidth={STROKE_INNER}
                strokeDasharray={`${innerFillLength} ${C_INNER}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22, 0.61, 0.36, 1)' }}
              />
            )}
            {/* Inner negative form (red, counter-clockwise from 12) */}
            {showRedArc && (
              <g transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}>
                <circle
                  cx={CX} cy={CY} r={R_INNER} fill="none"
                  stroke={RED} strokeWidth={STROKE_INNER}
                  strokeDasharray={`${innerFillLength} ${C_INNER}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CX} ${CY})`}
                  style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22, 0.61, 0.36, 1)' }}
                />
              </g>
            )}

            {/* Neutral 12 o'clock tick */}
            <line
              x1={CX} y1={CY - R_INNER - STROKE_INNER / 2 - 1}
              x2={CX} y2={CY - R_INNER + STROKE_INNER / 2 + 1}
              stroke={INK_40} strokeWidth={1.5}
            />
          </svg>

          {/* Center stack */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', gap: 0,
          }}>
            <span style={{
              fontSize: 9.5, fontWeight: 800, color: statusColor,
              letterSpacing: '0.18em', marginBottom: 4, textTransform: 'uppercase',
            }}>
              {statusWord}
            </span>
            <span style={{
              fontSize: 76, fontWeight: 700, color: INK,
              letterSpacing: '-0.04em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'center', display: 'block',
            }}>
              {scrubValue.toFixed(1)}
            </span>
            <div style={{
              marginTop: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, fontVariantNumeric: 'tabular-nums',
              opacity: isScrubbing ? 0 : 1,
              transition: 'opacity 200ms ease',
            }}>
              {deltaInline}
              {sparkPolyline && (
                <>
                  <span style={{ width: 1, height: 12, background: INK_10, display: 'inline-block' }} />
                  <svg width={48} height={14} viewBox="0 0 48 14" style={{ display: 'block' }}>
                    <polyline
                      points={sparkPolyline.points}
                      fill="none"
                      stroke={AMBER}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={sparkPolyline.lastX} cy={sparkPolyline.lastY} r={2} fill={AMBER} />
                  </svg>
                  <span style={{ fontSize: 11, color: INK_55, fontWeight: 500 }}>vs last 30d</span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: -38, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 18,
            fontSize: 10.5, fontWeight: 600, color: INK_55, letterSpacing: '0.06em',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER }} />
              INDEX TRAJECTORY
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
              8-ROUND FORM
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline strip */}
      <div style={{ padding: '0 4px', marginTop: 24 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="auto"
          viewBox={`0 0 ${W} ${H}`}
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

          {scratchBand && (
            <g>
              <rect
                x={0}
                y={scratchBand.yTop}
                width={W}
                height={scratchBand.height}
                fill={GREEN}
                opacity={0.05}
              />
              <text
                x={6}
                y={scratchBand.yTop + scratchBand.height - 4}
                fontSize={9}
                fontWeight={700}
                fill={GREEN}
                opacity={0.7}
                letterSpacing={1.3}
              >
                SCRATCH ZONE
              </text>
            </g>
          )}

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
                vectorEffect="non-scaling-stroke"
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

          {!isScrubbing && zeroLineY !== null && (
            <g>
              <line
                x1={0} y1={zeroLineY} x2={W} y2={zeroLineY}
                stroke={INK_40}
                strokeWidth={0.5}
                strokeDasharray="3 3"
                opacity={0.4}
              />
              <text
                x={W - 4} y={zeroLineY - 3}
                fontSize={9}
                fontWeight={500}
                fill={INK_40}
                textAnchor="end"
              >
                0
              </text>
            </g>
          )}

          {!isScrubbing && bestPoint && coords.length > 1 && bestPoint.coord !== coords[coords.length - 1] && (
            <g>
              <circle
                cx={bestPoint.coord.x}
                cy={bestPoint.coord.y}
                r={3.5}
                fill={GREEN}
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text
                x={bestPoint.coord.x}
                y={bestPoint.coord.y < 16 ? bestPoint.coord.y + 16 : bestPoint.coord.y - 8}
                fontSize={9}
                fontWeight={700}
                fill={GREEN}
                textAnchor="middle"
              >
                {formatDisplayedHcp(bestPoint.value)}
              </text>
            </g>
          )}

          {!isScrubbing && worstPoint && coords.length > 1 && worstPoint.coord !== coords[coords.length - 1] && worstPoint.coord !== bestPoint?.coord && (
            <g>
              <circle
                cx={worstPoint.coord.x}
                cy={worstPoint.coord.y}
                r={3.5}
                fill={RED}
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text
                x={worstPoint.coord.x}
                y={worstPoint.coord.y < 16 ? worstPoint.coord.y + 16 : worstPoint.coord.y - 8}
                fontSize={9}
                fontWeight={700}
                fill={RED}
                textAnchor="middle"
              >
                {formatDisplayedHcp(worstPoint.value)}
              </text>
            </g>
          )}

          {!isScrubbing && coords.length > 0 && (() => {
            const last = coords[coords.length - 1];
            const lastValue = points[points.length - 1].handicap_index;
            const labelAbove = last.y > 18;
            return (
              <g>
                <circle cx={last.x} cy={last.y} r={5} fill={AMBER} stroke="#fff" strokeWidth={2} />
                <text
                  x={last.x - 10}
                  y={labelAbove ? last.y - 8 : last.y + 16}
                  fontSize={11}
                  fontWeight={700}
                  fill={INK}
                  textAnchor="end"
                >
                  {formatDisplayedHcp(lastValue)}
                </text>
              </g>
            );
          })()}

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
          marginTop: 8, fontSize: 10.5, fontWeight: 700, color: INK_40,
          letterSpacing: '0.12em',
        }}>
          {isScrubbing && scrubPoint ? (
            <>
              <span />
              <span style={{ color: INK_55 }}>{shortDate(scrubPoint)}</span>
              <span />
            </>
          ) : points.length >= 2 ? (
            <>
              <span>{shortMonth(points[0])}</span>
              <span>{shortMonth(points[Math.floor(points.length / 2)])}</span>
              <span>{shortMonth(points[points.length - 1])}</span>
            </>
          ) : null}
        </div>
      </div>

      <style>{keyframes}</style>
    </section>
  );
};

function shortMonth(point: HandicapPoint): string {
  const d = new Date(point.observed_at);
  return MONTHS[d.getMonth()];
}
function shortDate(point: HandicapPoint): string {
  const d = new Date(point.observed_at);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const keyframes = `
@keyframes liveDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
`;

export default HeroHandicapCard;
export { HeroHandicapCard };

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TrendingDown, AlertTriangle, Minus } from 'lucide-react';
import { useCounters, useAllScores } from '@/lib/whs/hooks';
import { fmtDiff, fmtAxis } from '@/lib/whs/format';
import { projectNextRound } from '@/lib/whs/handicapMath';
import HandicapExplainerSheet from './HandicapExplainerSheet';
import { SectionHeader } from './_shared/atoms';
import type { WhsScore } from '@/lib/whs/types';
import RoundDetailSheet from './round-detail/RoundDetailSheet';



interface Props {
  connectionId: string;
  currentHandicap: number | null;
  /** 'owner' (default) shows first-person copy; 'friend' uses third-person + ownerFirstName. */
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

// ── Tokens ────────────────────────────────────────────────────────────────
const INK = 'var(--hcp-t-100)';
const INK_70 = 'var(--hcp-t-60)';
const INK_55 = 'var(--hcp-t-60)';
const INK_40 = 'var(--hcp-t-40)';
const INK_10 = 'var(--hcp-line)';
const INK_06 = 'var(--hcp-line)';
const AMBER = 'var(--hcp-amber)';
const AMBER_DEEP = 'var(--hcp-amber)';
const AMBER_TINT_06 = 'rgba(247,147,30,0.06)';
const AMBER_TINT_08 = 'rgba(247,147,30,0.08)';
const AMBER_BORDER = 'rgba(247,147,30,0.30)';
const AMBER_GOLD_GRAD = 'var(--hcp-amber)';
const GREEN = 'var(--hcp-good-deep)';
const RED = 'var(--hcp-bad)';
const D_BG    = 'var(--hcp-bg-1)';
const D_LINE  = 'var(--hcp-line)';
const D_T100  = 'var(--hcp-t-100)';
const D_T60   = 'var(--hcp-t-60)';
const D_T40   = 'var(--hcp-t-40)';


const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


// Chart geometry
const CHART_H = 150;
const Y_AXIS_W = 30;
const CHART_TOP = 14;
const CHART_BOTTOM = 14;

/**
 * Compute clean axis bounds and ticks for a differential chart.
 * - Both bounds snap to step multiples so ticks land cleanly
 *   on both top and bottom edges (no orphan ticks).
 * - Step picked based on data span: 1 (≤4), 2 (≤10), 5 (≤25), 10 (larger).
 * - No padding above or below the data range.
 */
function computeAxis(dataMin: number, dataMax: number): {
  yMin: number;
  yMax: number;
  ticks: number[];
  step: number;
} {
  const rawMin = Math.floor(dataMin);
  const rawMax = Math.ceil(dataMax);
  const rawSpan = Math.max(rawMax - rawMin, 1);

  let step: number;
  if (rawSpan <= 4) step = 1;
  else if (rawSpan <= 10) step = 2;
  else if (rawSpan <= 25) step = 5;
  else step = 10;

  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(rawMax / step) * step;

  const ticks: number[] = [];
  for (let v = yMax; v >= yMin; v -= step) ticks.push(v);

  return { yMin, yMax, ticks, step };
}

const Skeleton: React.FC<{ title: string }> = ({ title }) => (
  <section style={{ marginTop: 32 }}>
    <SectionHeader eyebrow="ROUNDS THAT COUNT" title={title} />
    <div style={{ padding: '0 20px' }}>
    <div style={{ height: 12, width: 140, background: 'var(--hcp-bg-3)', borderRadius: 2, marginBottom: 10 }} />
    <div style={{ height: 56, background: 'var(--hcp-bg-3)', borderRadius: 12, marginBottom: 12 }} />
    <div style={{
      background: D_BG, border: `1px solid ${D_LINE}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ height: 220, background: 'var(--hcp-bg-3)' }} />
      <div style={{ height: 60, background: 'var(--hcp-bg-3)', borderTop: `1px solid ${D_LINE}` }} />
      <div style={{ height: 110, background: 'var(--hcp-bg-3)', borderTop: `1px solid ${D_LINE}` }} />
    </div>
    </div>
  </section>
);

export const RoundsThatCountCard: React.FC<Props> = ({
  connectionId,
  currentHandicap,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { data: counters, isLoading: loadingCounters } = useCounters(connectionId);
  const { data: allScores } = useAllScores(connectionId);

  const headerTitle =
    viewMode === 'friend'
      ? `The 8 best of ${ownerFirstName ?? 'their'} last 20`
      : 'The 8 best of your last 20';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [sheetScoreId, setSheetScoreId] = useState<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrubIdx === null) return;
    const handlePointerDown = (e: PointerEvent) => {
      const plot = plotRef.current;
      if (!plot) return;
      if (plot.contains(e.target as Node)) return;
      setScrubIdx(null);
      setSelectedId(null);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [scrubIdx]);

  const projection = useMemo(() => {
    if (!allScores || allScores.length < 8 || currentHandicap == null) return null;
    const last20 = allScores.slice(0, 20);
    return projectNextRound(last20, currentHandicap);
  }, [allScores, currentHandicap]);

  const last5Avg = useMemo(() => {
    if (!allScores) return null;
    const diffs = allScores
      .slice(0, 5)
      .map((r) => r.handicap_differential)
      .filter((d): d is number => typeof d === 'number');
    if (diffs.length === 0) return null;
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }, [allScores]);

  const oldest = useMemo(() => {
    if (!allScores || allScores.length < 20) return null;
    const sorted = [...allScores].sort(
      (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
    );
    const o = sorted[0];
    if (!o || typeof o.handicap_differential !== 'number') return null;
    return {
      diff: o.handicap_differential,
      date: new Date(o.play_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  }, [allScores]);

  const enriched = useMemo(() => {
    if (!allScores || allScores.length < 8) return null;
    if (!counters || counters.length === 0) return null;
    const counterIds = new Set(counters.map(c => c.id));
    const last20 = [...allScores].slice(0, 20);
    const sorted = [...last20].sort(
      (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
    );
    const allDiffs = sorted
      .map(r => r.handicap_differential)
      .filter((d): d is number => d != null);
    const counterDiffs = sorted
      .filter(r => counterIds.has(r.id))
      .map(c => c.handicap_differential)
      .filter((d): d is number => d != null);
    if (counterDiffs.length === 0) return null;
    const minDiff = Math.min(...counterDiffs);
    const maxDiff = Math.max(...counterDiffs);
    const avgDiff = counterDiffs.reduce((s, d) => s + d, 0) / counterDiffs.length;
    const allDiffsMin = Math.min(...allDiffs);
    const allDiffsMax = Math.max(...allDiffs);
    return {
      rounds: sorted.map(c => ({
        ...c,
        is_counter: counterIds.has(c.id),
        is_best: counterIds.has(c.id) && c.handicap_differential === minDiff,
        is_worst: counterIds.has(c.id) && c.handicap_differential === maxDiff,
      })),
      minDiff, maxDiff, avgDiff,
      allDiffsMin, allDiffsMax,
    };
  }, [allScores, counters]);

  const colCount = enriched?.rounds.length ?? 0;

  const idxFromX = useCallback((clientX: number): number => {
    const plot = plotRef.current;
    if (!plot) return 0;
    const rect = plot.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < colCount; i++) {
      const dist = Math.abs(((i + 0.5) / colCount) * 100 - xPct);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [colCount]);

  if (loadingCounters) return <Skeleton title={headerTitle} />;
  if (!enriched || currentHandicap == null) return null;

  const defaultSelected = enriched.rounds[enriched.rounds.length - 1];
  const selectedRound =
    enriched.rounds.find(r => r.id === selectedId) ?? defaultSelected;
  const selectedIdx = enriched.rounds.findIndex(r => r.id === selectedRound.id);
  const bestRound = enriched.rounds.find(r => r.is_best)!;
  const worstRound = enriched.rounds.find(r => r.is_worst)!;

  // Option A: honest axis. Include ALL rounds, not just counters.
  // Non-counters with big differentials no longer get clipped — the
  // chart range expands to fit them, so the line stays inside.
  const cutTarget = projection?.hasData ? projection.cutTarget : null;
  const allDiffs = enriched.rounds.map(r => r.handicap_differential ?? 0);
  const dataMin = Math.min(...allDiffs);
  const dataMax = Math.max(...allDiffs, cutTarget ?? -Infinity);

  const { yMin, yMax, ticks } = computeAxis(dataMin, dataMax);
  const ySpan = yMax - yMin;
  const innerH = CHART_H - CHART_TOP - CHART_BOTTOM;
  const yFor = (diff: number) => CHART_TOP + ((yMax - diff) / ySpan) * innerH;

  // X positions
  const xFor = (idx: number) => ((idx + 0.5) / colCount) * 100; // % within plot area

  // SVG path
  const linePath = enriched.rounds
    .map((r, i) => {
      const d = r.handicap_differential ?? 0;
      const x = xFor(i);
      const y = yFor(d);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <>
    <section style={{ marginTop: 32 }}>
      <SectionHeader
        eyebrow="ROUNDS THAT COUNT"
        title={headerTitle}
      />

      <div style={{ padding: '0 20px' }}>

      {/* ── NEXT-ROUND HERO BAND (merged from former NextRoundWatch) ───────── */}
      {projection && projection.hasData && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(247,147,30,0.10), rgba(247,147,30,0.03))',
          border: `1px solid ${AMBER_BORDER}`,
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 18,
          fontFamily: FONT_GEIST,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--hcp-amber-d)',
          }}>
            Next round · Target to cut
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <div style={{
              fontSize: 52, fontWeight: 800, color: GREEN,
              letterSpacing: '-0.03em', lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtDiff(projection.cutTarget)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3 }}>
              or better
              <br />
              <span style={{ fontWeight: 500, color: INK_70, fontSize: 12 }}>
                drops your index
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex', marginTop: 14,
            borderTop: `1px solid ${AMBER_BORDER}`, paddingTop: 12,
          }}>
            <div style={{ flex: 1, borderRight: `1px solid ${AMBER_BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: INK_70 }}>Last 5 avg</div>
              <div style={{
                fontSize: 20, fontWeight: 800, color: AMBER,
                fontVariantNumeric: 'tabular-nums', marginTop: 2,
              }}>
                {last5Avg != null ? fmtDiff(last5Avg) : '—'}
              </div>
            </div>
            <div style={{ flex: 1, paddingLeft: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: INK_70 }}>If you don't</div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: projection.isAtRisk ? RED : INK,
                fontVariantNumeric: 'tabular-nums', marginTop: 2,
              }}>
                {projection.isAtRisk
                  ? `rises ${projection.settleAt.toFixed(1)}`
                  : `stays ${projection.settleAt.toFixed(1)}`}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── END HERO BAND ─────────────────────────────────────────────────── */}

      {/* Chart — full-bleed on page background, no card wrapper */}
      <div style={{ padding: '0 0 8px' }}>
        <style>{`
          @keyframes pulseHeartbeat {
            0%, 100% { opacity: 0.20; }
            50% { opacity: 0.45; }
          }
          .latestHalo { animation: pulseHeartbeat 2.4s ease-in-out infinite; transform-origin: center; }
        `}</style>
        <div style={{ padding: '0 4px' }}>
          {/* Y-axis unit label + LATEST legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
            paddingLeft: 4,
            gap: 8,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: D_T60,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}>
              SCORE DIFF · LAST{' '}
              <span style={{ color: D_T100, fontVariantNumeric: 'tabular-nums' }}>
                {colCount}
              </span>{' '}
              ROUNDS
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 9, fontWeight: 700, color: D_T60,
              letterSpacing: '0.04em',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: AMBER_GOLD_GRAD, border: 'none',
                }} />
                COUNTER
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--hcp-bg-0)', border: `1.5px solid ${AMBER}`,
                }} />
                NON
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: GREEN, fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}>
                <span style={{
                  width: 10, height: 2, background: GREEN, borderRadius: 1,
                }} />
                CUT {projection && projection.hasData ? `<${fmtDiff(projection.cutTarget)}` : ''}
              </span>
            </div>
          </div>

          <div style={{
            position: 'relative', display: 'flex', height: CHART_H,
          }}>
            {/* Y-axis ticks */}
            <div style={{
              width: Y_AXIS_W, position: 'relative', flexShrink: 0,
            }}>
              {ticks.map(t => (
                <div key={t} style={{
                  position: 'absolute', top: yFor(t) - 7,
                  right: 6, fontSize: 11.5, fontWeight: 700,
                  color: D_T60, fontFamily: FONT_GEIST,
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right', width: '100%',
                }}>
                  {fmtAxis(t)}
                </div>
              ))}
            </div>

            {/* Plot area */}
            <div
              ref={plotRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setIsScrubbing(true);
                const idx = idxFromX(e.clientX);
                setScrubIdx(idx);
                setSelectedId(enriched.rounds[idx].id);
                pointerStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
              }}
              onPointerMove={(e) => {
                if (!isScrubbing) return;
                const idx = idxFromX(e.clientX);
                setScrubIdx(idx);
                setSelectedId(enriched.rounds[idx].id);
              }}
              onPointerUp={(e) => {
                setIsScrubbing(false);
                const start = pointerStartRef.current;
                pointerStartRef.current = null;
                if (!start) return;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                const dist = Math.hypot(dx, dy);
                const elapsed = Date.now() - start.t;
                if (dist < 6 && elapsed < 500) {
                  const idx = idxFromX(e.clientX);
                  const round = enriched.rounds[idx];
                  if (round) setSheetScoreId(round.id);
                }
              }}
              onPointerCancel={() => {
                setIsScrubbing(false);
                pointerStartRef.current = null;
              }}
              style={{
                flex: 1,
                position: 'relative',
                height: CHART_H,
                touchAction: 'pan-y',
                cursor: isScrubbing ? 'grabbing' : 'pointer',
                userSelect: 'none',
              }}
            >
              {/* Permanent latest emphasis band — centered on the last dot */}
              {(() => {
                const latestIdx = enriched.rounds.length - 1;
                if (latestIdx < 0) return null;
                const colWidth = 100 / enriched.rounds.length;
                const bandWidth = colWidth * 0.9;
                const centerPct = xFor(latestIdx);
                return (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${centerPct - bandWidth / 2}%`,
                    width: `${bandWidth}%`,
                    background: 'rgba(247,147,30,0.08)',
                    opacity: 1,
                    borderRadius: 6,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                );
              })()}

              {/* Selected highlight column */}
              {selectedIdx >= 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  left: `${xFor(selectedIdx)}%`,
                  marginLeft: -18, width: 36,
                  background: AMBER_TINT_08,
                  borderLeft: `0.5px solid ${AMBER_BORDER}`,
                  borderRight: `0.5px solid ${AMBER_BORDER}`,
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
              )}

              {/* Gridlines */}
              <svg width="100%" height={CHART_H} style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
              }}>
                {ticks.map(t => (
                  <line key={t}
                    x1="0" y1={yFor(t)} x2="100%" y2={yFor(t)}
                    stroke="var(--hcp-line)" strokeWidth={1}
                    strokeDasharray="2 4"
                    opacity={0.6}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              {/* Line + dots */}
              <svg width="100%" height={CHART_H}
                viewBox={`0 0 100 ${CHART_H}`} preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0 }}
              >
                <path d={linePath} fill="none"
                  stroke={AMBER} strokeWidth={1.5}
                  strokeLinecap="round" strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke" />
              </svg>

              {/* Cut target horizontal line */}
              {projection && projection.hasData &&
                projection.cutTarget >= yMin && projection.cutTarget <= yMax && (
                <>
                  <svg width="100%" height={CHART_H}
                    viewBox={`0 0 100 ${CHART_H}`} preserveAspectRatio="none"
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                  >
                    <line
                      x1="0" y1={yFor(projection.cutTarget)}
                      x2="100" y2={yFor(projection.cutTarget)}
                      stroke={GREEN} strokeWidth={1.5}
                      strokeDasharray="4 3"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </>
              )}

              {/* Scrub guide line */}
              {scrubIdx !== null && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: `${xFor(scrubIdx)}%`,
                    top: CHART_TOP,
                    bottom: CHART_BOTTOM,
                    width: 1,
                    background: AMBER,
                    opacity: 0.35,
                    pointerEvents: 'none',
                    transform: 'translateX(-0.5px)',
                  }}
                />
              )}

              {/* Dots — separate so we can use HTML for sizing */}
              {enriched.rounds.map((r, i) => {
                const d = r.handicap_differential ?? 0;
                const isSel = r.id === selectedRound.id;
                const isLatest = i === enriched.rounds.length - 1;
                const isActiveScrub = scrubIdx === i;
                let dotSize: number;
                let background: string;
                let borderStyle: string;
                if (r.is_best) {
                  dotSize = 12;
                  background = 'var(--hcp-bg-0)';
                  borderStyle = `2.5px solid ${GREEN}`;
                } else if (r.is_worst) {
                  dotSize = 12;
                  background = 'var(--hcp-bg-0)';
                  borderStyle = `2.5px solid ${RED}`;
                } else if (isLatest) {
                  dotSize = 12;
                  background = 'var(--hcp-bg-0)';
                  borderStyle = `2.5px solid ${AMBER}`;
                } else if (r.is_counter) {
                  dotSize = 9;
                  background = AMBER_GOLD_GRAD;
                  borderStyle = `none`;
                } else {
                  dotSize = 8;
                  background = 'var(--hcp-bg-0)';
                  borderStyle = `1.5px solid ${AMBER}`;
                }
                if (isActiveScrub) {
                  dotSize = Math.max(dotSize, 12);
                }
                return (
                  <div
                    key={r.id}
                    aria-label={`Round at ${r.course?.name ?? 'course'} (${r.is_counter ? 'counter' : 'non-counter'})`}
                    style={{
                      position: 'absolute',
                      left: `${xFor(i)}%`,
                      top: yFor(d),
                      width: dotSize, height: dotSize,
                      marginLeft: -dotSize / 2, marginTop: -dotSize / 2,
                      borderRadius: '50%',
                      background,
                      border: borderStyle,
                      // Skip the ink selection halo for the latest dot —
                      // its own border is already ink, so the halo would
                      // double-stack and render as a thicker ring than
                      // the green BEST / red WORST equivalents.
                      boxShadow: isActiveScrub
                        ? `0 0 0 3px rgba(247,147,30,0.18)`
                        : isSel && !isLatest ? `0 0 0 2px ${INK}` : 'none',
                      padding: 0,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                );
              })}

              {/* Pulsing halo behind the latest dot — removed to match best/worst ring weight */}

              {/* Scrub tooltip */}
              {scrubIdx !== null && (() => {
                const round = enriched.rounds[scrubIdx];
                if (!round) return null;
                const d = round.handicap_differential ?? 0;
                const x = xFor(scrubIdx);
                const y = yFor(d);
                const flipBelow = y < CHART_TOP + innerH * 0.3;

                let transform: string;
                if (x < 18) {
                  transform = flipBelow ? 'translate(0, 12px)' : 'translate(0, calc(-100% - 12px))';
                } else if (x > 82) {
                  transform = flipBelow ? 'translate(-100%, 12px)' : 'translate(-100%, calc(-100% - 12px))';
                } else {
                  transform = flipBelow ? 'translate(-50%, 12px)' : 'translate(-50%, calc(-100% - 12px))';
                }

                const courseName = round.course?.name ?? 'Unknown course';
                const playedAt = round.play_date
                  ? new Date(round.play_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  : '';

                return (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: y,
                      transform,
                      pointerEvents: 'none',
                      zIndex: 5,
                    }}
                  >
                    <div style={{
                      background: INK,
                      color: '#fff',
                      borderRadius: 10,
                      padding: '8px 12px',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.20)',
                      minWidth: 140,
                      fontFamily: FONT_GEIST,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 8, marginBottom: 3,
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em',
                        }}>
                          ROUND {scrubIdx + 1}/{enriched.rounds.length}
                        </span>
                        <span style={{
                          fontSize: 8.5, fontWeight: 800,
                          color: round.is_counter ? AMBER : 'rgba(255,255,255,0.55)',
                          letterSpacing: '0.10em',
                        }}>
                          {round.is_counter ? 'COUNTER' : 'DISCARDED'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#fff',
                        letterSpacing: '-0.01em', marginBottom: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 200,
                      }}>
                        {courseName}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'baseline',
                        justifyContent: 'space-between', gap: 8, marginTop: 2,
                      }}>
                        <span style={{
                          fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 600,
                        }}>
                          {playedAt}
                        </span>
                        <span style={{
                          fontSize: 14, fontWeight: 800, color: '#fff',
                          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                        }}>
                          {fmtDiff(d)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Date labels — thinned. Every column keeps its slot for click-targets,
              but only N labels render text to prevent rotated overlap. */}
          <div style={{
            display: 'flex', marginTop: 6, marginLeft: Y_AXIS_W,
            paddingBottom: 2,
          }}>
            {(() => {
              const total = enriched.rounds.length;
              const targetCount = 5;
              const stride = Math.max(1, Math.floor(total / targetCount));
              const visibleIdx = new Set<number>();
              for (let i = 0; i < total; i += stride) visibleIdx.add(i);
              visibleIdx.add(total - 1);
              return enriched.rounds.map((r, i) => {
                const d = new Date(r.play_date);
                const isLatest = i === total - 1;
                const showLabel = visibleIdx.has(i);
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedId(r.id);
                      setSheetScoreId(r.id);
                    }}
                    aria-label={`Round on ${d.toLocaleDateString()}, tap to see details`}
                    style={{
                      flex: 1, textAlign: 'center',
                      background: 'transparent', border: 'none',
                      padding: '4px 0', cursor: 'pointer',
                      visibility: showLabel ? 'visible' : 'hidden',
                    }}
                  >
                    <div style={{
                      fontSize: 9, fontWeight: isLatest ? 700 : 600,
                      color: isLatest ? D_T100 : D_T40,
                      letterSpacing: '0.04em',
                    }}>
                      {WEEKDAY[d.getDay()]}
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: isLatest ? 700 : 600,
                      color: isLatest ? D_T100 : D_T40,
                      fontFamily: FONT_GEIST,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '0.04em',
                      marginTop: 1,
                    }}>
                      {d.getDate()}
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Tick connectors — slim, anchor stat row to chart */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '0 1px', marginTop: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 8, background: GREEN, opacity: 0.55 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 8, background: INK_40 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 8, background: RED, opacity: 0.55 }} />
        </div>
      </div>

      {/* 3-up stat row — chromeless, hairline-divided */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: `0.5px solid ${INK_10}`,
        borderBottom: `1px solid ${D_LINE}`,
      }}>
        <StatCell
          label="BEST" value={enriched.minDiff} dotColor={GREEN} valueColor={GREEN}
          active={selectedRound.id === bestRound.id}
          onClick={() => setSelectedId(bestRound.id)}
          withRightBorder
        />
        <StatCell
          label="AVG" value={enriched.avgDiff} dotColor="var(--hcp-t-60)" valueColor="var(--hcp-t-100)"
          disabled withRightBorder
        />
        <StatCell
          label="WORST" value={enriched.maxDiff} dotColor={RED} valueColor={RED}
          active={selectedRound.id === worstRound.id}
          onClick={() => setSelectedId(worstRound.id)}
        />
      </div>


      {/* NOTE: Next-round target pair + oldest-round caption moved to NextRoundWatch.
          The SafeState/AtRiskState component definitions remain below as a one-cycle
          safety net but are no longer rendered here. */}


      <HandicapExplainerSheet
        open={showExplainer}
        onClose={() => setShowExplainer(false)}
        currentHandicap={currentHandicap}
        cutTarget={projection?.cutTarget ?? null}
        settleAt={projection?.settleAt ?? null}
        isAtRisk={projection?.isAtRisk ?? false}
      />

      </div>
    </section>
    {(() => {
      const sheetIdx = sheetScoreId
        ? enriched.rounds.findIndex((r) => r.id === sheetScoreId)
        : -1;
      const sheetRound = sheetIdx >= 0 ? enriched.rounds[sheetIdx] : null;
      const prevRound = sheetIdx > 0 ? enriched.rounds[sheetIdx - 1] : null;
      const delta =
        sheetRound?.is_counter &&
        sheetRound.handicap_index_at_time != null &&
        prevRound?.handicap_index_at_time != null
          ? Number(
              (sheetRound.handicap_index_at_time - prevRound.handicap_index_at_time).toFixed(1),
            )
          : null;
      return (
        <RoundDetailSheet
          open={sheetScoreId != null}
          onClose={() => setSheetScoreId(null)}
          scoreId={sheetScoreId}
          connectionId={connectionId}
          handicapDelta={delta}
        />
      );
    })()}
    </>
  );
};

// ── Stat cell ─────────────────────────────────────────────────────────────
const StatCell: React.FC<{
  label: string;
  value: number | null;
  dotColor: string;
  valueColor: string;
  active?: boolean;
  disabled?: boolean;
  withRightBorder?: boolean;
  onClick?: () => void;
  /** When set, the value is rendered as a raw integer followed by this unit suffix
   *  (e.g. "pts") instead of via fmtDiff(). */
  unit?: string;
}> = ({ label, value, dotColor, valueColor, active, disabled, withRightBorder, onClick, unit }) => {
  const display =
    value == null
      ? '—'
      : unit
        ? String(Math.round(value))
        : fmtDiff(value);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '10px 8px 12px',
        background: active ? AMBER_TINT_06 : 'transparent',
        border: 'none',
        borderRight: withRightBorder ? `1px solid ${D_LINE}` : 'none',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'center',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        marginBottom: 3,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor }} />
        <span style={{
          fontSize: 9, fontWeight: 800, color: D_T60, letterSpacing: '0.14em',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </span>
      <span style={{
        fontSize: 28, fontWeight: 800, color: valueColor,
        fontFamily: FONT_GEIST, fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        {display}
        {unit && value != null && (
          <span style={{ fontSize: 11, fontWeight: 600, color: D_T60, marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </span>
    </button>
  );
};



// ── Next-round state cards ────────────────────────────────────────────────
const AtRiskState: React.FC<{ cutTarget: number; settleAt: number }> = ({
  cutTarget,
  settleAt,
}) => (
  <>
    <div style={{
      background: 'rgba(159,29,29,0.05)',
      border: '1px solid rgba(159,29,29,0.18)',
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'rgba(159,29,29,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={11} strokeWidth={2.4} color={RED} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, color: RED, letterSpacing: '0.14em',
        }}>
          HEADS UP
        </span>
      </div>
      <div style={{ fontSize: 13, color: D_T100, lineHeight: 1.45 }}>
        A good counter is dropping off. Handicap rises to{' '}
        <strong style={{
          fontWeight: 700, color: RED, fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtDiff(settleAt)}
        </strong>{' '}
        next round unless the next score beats the cut target.
      </div>
    </div>

    <CutTargetCard cutTarget={cutTarget} />
  </>
);

const SafeState: React.FC<{ cutTarget: number; settleAt: number }> = ({
  cutTarget,
  settleAt,
}) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
  }}>
    {/* FOR A CUT */}
    <div style={{
      background: 'var(--hcp-good-tint)',
      border: '1px solid rgba(34,197,94,0.30)',
      borderLeft: `3px solid ${GREEN}`,
      borderRadius: 10,
      padding: '8px 11px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2,
        }}>
          <TrendingDown size={11} strokeWidth={2.4} color={GREEN} />
          <span style={{
            fontSize: 9, fontWeight: 800, color: GREEN,
            letterSpacing: '0.12em',
          }}>FOR A CUT</span>
        </div>
        <p style={{
          margin: 0, fontSize: 10.5, color: D_T60, lineHeight: 1.35,
        }}>
          A score under this drops the handicap.
        </p>
      </div>
      <div style={{
        fontSize: 16, fontWeight: 700, color: GREEN,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em', lineHeight: 1,
        fontFamily: FONT_GEIST, flexShrink: 0,
      }}>
        {fmtDiff(cutTarget)}
      </div>
    </div>
    {/* OTHERWISE */}
    <div style={{
      background: D_BG,
      border: `1px solid ${D_LINE}`,
      borderLeft: `3px solid ${D_LINE}`,
      borderRadius: 10,
      padding: '8px 11px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2,
        }}>
          <Minus size={11} strokeWidth={2.4} color="var(--hcp-t-60)" />
          <span style={{
            fontSize: 9, fontWeight: 800, color: D_T60,
            letterSpacing: '0.12em',
          }}>OTHERWISE</span>
        </div>
        <p style={{
          margin: 0, fontSize: 10.5, color: D_T60, lineHeight: 1.35,
        }}>
          Settles here · no risk of going up.
        </p>
      </div>
      <div style={{
        fontSize: 16, fontWeight: 700, color: D_T100,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em', lineHeight: 1,
        fontFamily: FONT_GEIST, flexShrink: 0,
      }}>
        {fmtDiff(settleAt)}
      </div>
    </div>
  </div>
);

const CutTargetCard: React.FC<{ cutTarget: number }> = ({ cutTarget }) => (
  <div style={{
    display: 'flex',
    background: 'var(--hcp-good-tint)',
    border: '1px solid rgba(34,197,94,0.30)',
    borderRadius: 12,
    overflow: 'hidden',
  }}>
    <div style={{ width: 3, background: GREEN, flexShrink: 0 }} />
    <div style={{ flex: 1, padding: '14px 14px 14px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={16} strokeWidth={2.2} color={GREEN} />
          <span style={{
            fontSize: 11, fontWeight: 800, color: GREEN,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>FOR A CUT</span>
        </div>
        <span style={{
          fontSize: 22, fontWeight: 700, color: GREEN,
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
          fontFamily: FONT_GEIST,
        }}>
          {fmtDiff(cutTarget)}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: D_T60, marginTop: 6, lineHeight: 1.4 }}>
        A score under this differential drops the handicap.
      </div>
    </div>
  </div>
);

export default RoundsThatCountCard;

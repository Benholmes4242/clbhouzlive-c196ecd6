import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, TrendingDown, AlertTriangle, Minus } from 'lucide-react';
import { useCounters, useAllScores } from '@/lib/whs/hooks';
import { fmtDiff, fmtAxis } from '@/lib/whs/format';
import { projectNextRound } from '@/lib/whs/handicapMath';
import HandicapExplainerSheet from './HandicapExplainerSheet';
import SectionHeader from './SectionHeader';

const fmtDiffPlus = (n: number) => fmtDiff(n, { plus: true });

interface Props {
  connectionId: string;
  currentHandicap: number | null;
}

// ── Tokens ────────────────────────────────────────────────────────────────
const INK = '#0F172A';
const INK_70 = 'rgba(15,23,42,0.70)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const AMBER_TINT_06 = 'rgba(247,147,30,0.06)';
const AMBER_TINT_08 = 'rgba(247,147,30,0.08)';
const AMBER_BORDER = 'rgba(247,147,30,0.30)';
const GREEN = '#059669';
const RED = '#9F1D1D';

const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


// Chart geometry
const CHART_H = 240;
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

const Skeleton: React.FC = () => (
  <section style={{ marginTop: 28 }}>
    <SectionHeader eyebrow="ROUNDS THAT COUNT" title="The 8 best of your last 20" />
    <div style={{ padding: '0 20px' }}>
    <div style={{ height: 12, width: 140, background: INK_06, borderRadius: 2, marginBottom: 10 }} />
    <div style={{ height: 56, background: INK_06, borderRadius: 12, marginBottom: 12 }} />
    <div style={{
      background: '#fff', border: `0.5px solid ${INK_10}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ height: 220, background: INK_06 }} />
      <div style={{ height: 60, background: INK_06, borderTop: `0.5px solid ${INK_10}` }} />
      <div style={{ height: 110, background: INK_06, borderTop: `0.5px solid ${INK_10}` }} />
    </div>
    </div>
  </section>
);

export const RoundsThatCountCard: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data: counters, isLoading: loadingCounters } = useCounters(connectionId);
  const { data: allScores } = useAllScores(connectionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
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

  if (loadingCounters) return <Skeleton />;
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
  const colCount = enriched.rounds.length;
  const xFor = (idx: number) => ((idx + 0.5) / colCount) * 100; // % within plot area

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
    <section style={{ marginTop: 28 }}>
      <SectionHeader eyebrow="ROUNDS THAT COUNT" title="The 8 best of your last 20" />
      <div style={{ padding: '0 20px' }}>

      {/* Chart — full-bleed on page background, no card wrapper */}
      <div style={{ padding: '4px 0 12px' }}>
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
            marginBottom: 8,
            paddingLeft: 4,
            gap: 8,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: INK_55,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}>DIFFERENTIAL</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 9, fontWeight: 700, color: INK_55,
              letterSpacing: '0.04em',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: AMBER, border: `1.5px solid ${AMBER}`,
                }} />
                COUNTER
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#fff', border: `1.5px solid ${AMBER}`,
                }} />
                NON
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: GREEN, fontWeight: 800,
              }}>
                <span style={{
                  width: 10, height: 2, background: GREEN, borderRadius: 1,
                }} />
                CUT
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
                  color: INK_55, fontFamily: FONT_DISPLAY,
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
              }}
              onPointerMove={(e) => {
                if (!isScrubbing) return;
                const idx = idxFromX(e.clientX);
                setScrubIdx(idx);
                setSelectedId(enriched.rounds[idx].id);
              }}
              onPointerUp={() => setIsScrubbing(false)}
              onPointerCancel={() => setIsScrubbing(false)}
              style={{
                flex: 1,
                position: 'relative',
                height: CHART_H,
                touchAction: 'pan-y',
                cursor: isScrubbing ? 'grabbing' : 'crosshair',
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
                    stroke={INK_06} strokeWidth={1}
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
                  <div style={{
                    position: 'absolute',
                    top: yFor(projection.cutTarget) - 9,
                    right: 4,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: GREEN,
                    color: '#fff',
                    fontSize: 8.5, fontWeight: 800,
                    letterSpacing: '0.06em',
                    fontFamily: FONT_DISPLAY,
                    pointerEvents: 'none',
                    zIndex: 3,
                    whiteSpace: 'nowrap',
                  }}>
                    CUT IF BELOW
                  </div>
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
                  background = '#fff';
                  borderStyle = `2.5px solid ${GREEN}`;
                } else if (r.is_worst) {
                  dotSize = 12;
                  background = '#fff';
                  borderStyle = `2.5px solid ${RED}`;
                } else if (isLatest) {
                  dotSize = 14;
                  background = r.is_counter ? AMBER : '#fff';
                  borderStyle = `2px solid ${INK}`;
                } else if (r.is_counter) {
                  dotSize = 9;
                  background = AMBER;
                  borderStyle = `2px solid ${AMBER}`;
                } else {
                  dotSize = 8;
                  background = '#fff';
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
                      boxShadow: isActiveScrub
                        ? `0 0 0 3px rgba(247,147,30,0.18)`
                        : isSel ? `0 0 0 2px ${INK}` : 'none',
                      padding: 0,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                );
              })}

              {/* Pulsing halo behind the latest dot */}
              {(() => {
                const last = enriched.rounds[enriched.rounds.length - 1];
                if (!last) return null;
                return (
                  <div
                    aria-hidden
                    className="latestHalo"
                    style={{
                      position: 'absolute',
                      left: `${xFor(enriched.rounds.length - 1)}%`,
                      top: yFor(last.handicap_differential ?? 0),
                      width: 28, height: 28,
                      marginLeft: -14, marginTop: -14,
                      borderRadius: '50%',
                      background: 'rgba(247,147,30,0.20)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                );
              })()}

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
                      fontFamily: FONT_DISPLAY,
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
                          {fmtDiff(d, { plus: true })}
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
            paddingBottom: 14,
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
                    onClick={() => setSelectedId(r.id)}
                    aria-label={`Round on ${d.toLocaleDateString()}`}
                    style={{
                      flex: 1, textAlign: 'center',
                      background: 'transparent', border: 'none',
                      padding: '4px 0', cursor: 'pointer',
                      visibility: showLabel ? 'visible' : 'hidden',
                    }}
                  >
                    <div style={{
                      fontSize: 9.5, fontWeight: 600,
                      color: isLatest ? INK : INK_40,
                      letterSpacing: '0.04em',
                    }}>
                      {WEEKDAY[d.getDay()]}
                    </div>
                    <div style={{
                      fontSize: 9.5, fontWeight: isLatest ? 700 : 600,
                      color: isLatest ? INK : INK_40,
                      fontFamily: FONT_DISPLAY,
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

      {/* Connector lines from chart bottom to chips top */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        marginBottom: -1, padding: '0 1px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 12, background: GREEN }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 12, background: INK_40 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 12, background: RED }} />
        </div>
      </div>

      {/* Chips + next-round + footer card */}
      <div style={{
        background: '#fff',
        border: `0.5px solid ${INK_10}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* 3-up stat row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          <StatCell
            label="BEST" value={enriched.minDiff} dotColor={GREEN} valueColor={GREEN}
            active={selectedRound.id === bestRound.id}
            onClick={() => setSelectedId(bestRound.id)}
            withRightBorder
          />
          <StatCell
            label="AVG" value={enriched.avgDiff} dotColor={INK_40} valueColor={INK}
            disabled withRightBorder
          />
          <StatCell
            label="WORST" value={enriched.maxDiff} dotColor={RED} valueColor={RED}
            active={selectedRound.id === worstRound.id}
            onClick={() => setSelectedId(worstRound.id)}
          />
        </div>

        {/* Next-round targets — dynamic based on projection */}
        {projection?.hasData && (
          <div style={{
            background: 'rgba(15,23,42,0.015)',
            borderTop: `0.5px solid ${INK_10}`,
            padding: '14px 14px 16px',
          }}>
            <div style={{
              textAlign: 'center', fontSize: 9, fontWeight: 800,
              color: INK_55, letterSpacing: '0.22em', marginBottom: 12,
            }}>
              NEXT ROUND
            </div>

            {projection.isAtRisk ? (
              <AtRiskState cutTarget={projection.cutTarget} settleAt={projection.settleAt} />
            ) : (
              <SafeState cutTarget={projection.cutTarget} settleAt={projection.settleAt} />
            )}

            <div style={{
              textAlign: 'center', fontSize: 10, color: INK_55, marginTop: 12,
            }}>
              Your current index is{' '}
              <strong style={{
                color: INK, fontWeight: 700, fontFamily: FONT_DISPLAY,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {currentHandicap.toFixed(1)}
              </strong>.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderTop: `0.5px solid ${INK_10}`,
        }}>
          <span style={{ fontSize: 10, color: INK_40 }}>
            New rounds enter the calculation tomorrow
          </span>
          <button
            onClick={() => setShowExplainer(true)}
            style={{
              background: 'transparent', border: 'none', padding: 0,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 700, color: AMBER_DEEP,
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={11} strokeWidth={2.4} />
            How does this work?
          </button>
        </div>
      </div>

      <HandicapExplainerSheet
        open={showExplainer}
        onClose={() => setShowExplainer(false)}
        currentHandicap={currentHandicap}
        cutTarget={projection?.cutTarget ?? null}
        settleAt={projection?.settleAt ?? null}
        isAtRisk={projection?.isAtRisk ?? false}
      />

      {/* Vulnerability callout — which round drops off next */}
      {(() => {
        const oldest = enriched.rounds[0];
        if (!oldest || oldest.handicap_differential == null) return null;
        const oldestDate = new Date(oldest.play_date);
        const dateLabel = `${WEEKDAY[oldestDate.getDay()]} ${oldestDate.getDate()} ${
          oldestDate.toLocaleDateString('en-GB', { month: 'short' })
        }`;
        const diffStr = fmtDiffPlus(oldest.handicap_differential);
        const willDropCounter = oldest.is_counter;
        return (
          <div style={{
            marginTop: 12,
            padding: '11px 12px',
            background: willDropCounter ? AMBER_TINT_06 : INK_06,
            border: `0.5px solid ${willDropCounter ? AMBER_BORDER : INK_10}`,
            borderRadius: 10,
            borderLeft: `3px solid ${willDropCounter ? AMBER : INK_40}`,
            display: 'flex', alignItems: 'flex-start', gap: 9,
          }}>
            {willDropCounter ? (
              <AlertTriangle size={14} color={AMBER_DEEP} strokeWidth={2.4}
                style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <Minus size={14} color={INK_40} strokeWidth={2.4}
                style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <p style={{
              margin: 0, fontSize: 11.5, color: INK_70, lineHeight: 1.5,
              fontFamily: FONT_DISPLAY,
            }}>
              {willDropCounter ? (
                <>
                  Your <strong style={{ color: INK, fontWeight: 700 }}>{diffStr} from {dateLabel}</strong>
                  {' '}is currently a counter. When it drops off the 20-round window, your handicap could shift.
                </>
              ) : (
                <>
                  Your oldest round (<strong style={{ color: INK, fontWeight: 700 }}>{diffStr} from {dateLabel}</strong>)
                  {' '}isn't a counter — its drop-off won't change your handicap.
                </>
              )}
            </p>
          </div>
        );
      })()}
      </div>
    </section>
  );
};

// ── Stat cell ─────────────────────────────────────────────────────────────
const StatCell: React.FC<{
  label: string;
  value: number;
  dotColor: string;
  valueColor: string;
  active?: boolean;
  disabled?: boolean;
  withRightBorder?: boolean;
  onClick?: () => void;
}> = ({ label, value, dotColor, valueColor, active, disabled, withRightBorder, onClick }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '14px 8px',
        background: active ? AMBER_TINT_06 : 'transparent',
        border: 'none',
        borderRight: withRightBorder ? `0.5px solid ${INK_10}` : 'none',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'center',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginBottom: 2 }} />
      <span style={{
        fontSize: 9, fontWeight: 800, color: INK_55, letterSpacing: '0.16em',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 22, fontWeight: 700, color: valueColor,
        fontFamily: FONT_DISPLAY, fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {fmtDiff(value, { plus: true })}
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
      <div style={{ fontSize: 13, color: INK, lineHeight: 1.45 }}>
        A good counter is dropping off. Your handicap rises to{' '}
        <strong style={{
          fontWeight: 700, color: RED, fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtDiff(settleAt, { plus: true })}
        </strong>{' '}
        next round unless you beat your cut target.
      </div>
    </div>

    <CutTargetCard cutTarget={cutTarget} />
  </>
);

const SafeState: React.FC<{ cutTarget: number; settleAt: number }> = ({
  cutTarget,
  settleAt,
}) => (
  <>
    <div style={{ marginBottom: 8 }}>
      <CutTargetCard cutTarget={cutTarget} />
    </div>

    <div style={{
      display: 'flex',
      background: '#fff',
      border: `0.5px solid ${INK_10}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{ width: 3, background: INK_10, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '14px 14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Minus size={16} strokeWidth={2.2} color={INK_55} />
            <span style={{
              fontSize: 11, fontWeight: 800, color: INK_55,
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>OTHERWISE</span>
          </div>
          <span style={{
            fontSize: 22, fontWeight: 700, color: INK,
            letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            fontFamily: FONT_DISPLAY,
          }}>
            {fmtDiff(settleAt, { plus: true })}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: INK_55, marginTop: 6, lineHeight: 1.4 }}>
          Anything else and your handicap settles at{' '}
          <strong style={{
            fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtDiff(settleAt, { plus: true })}
          </strong>{' '}
          — no risk of going up this round.
        </div>
      </div>
    </div>
  </>
);

const CutTargetCard: React.FC<{ cutTarget: number }> = ({ cutTarget }) => (
  <div style={{
    display: 'flex',
    background: '#fff',
    border: `0.5px solid rgba(5,150,105,0.14)`,
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
          fontFamily: FONT_DISPLAY,
        }}>
          {fmtDiff(cutTarget, { plus: true })}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: INK_55, marginTop: 6, lineHeight: 1.4 }}>
        Beat this differential and your handicap drops.
      </div>
    </div>
  </div>
);

export default RoundsThatCountCard;

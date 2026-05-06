import React, { useMemo, useState } from 'react';
import { ChevronRight, HelpCircle, TrendingDown, AlertTriangle, Minus } from 'lucide-react';
import { useCounters, useAllScores } from '@/lib/whs/hooks';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import { fmtDiff, fmtAxis } from '@/lib/whs/format';
import { projectNextRound } from '@/lib/whs/handicapMath';
import HandicapExplainerSheet from './HandicapExplainerSheet';

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
const MONTHS_LONG = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Chart geometry
const CHART_H = 220;
const Y_AXIS_W = 30;
const CHART_TOP = 14;
const CHART_BOTTOM = 14;

function generateTicks(yMin: number, yMax: number): number[] {
  const ticks: number[] = [];
  for (let v = yMax; v >= yMin; v--) ticks.push(v);
  return ticks;
}

function renderBoldMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? (
        <strong key={i} style={{
          fontFamily: FONT_DISPLAY, fontWeight: 600, color: INK,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {part}
        </strong>
      )
      : <span key={i}>{part}</span>
  );
}

const Skeleton: React.FC = () => (
  <section style={{ padding: '0 16px', marginBottom: 28 }}>
    <div style={{ height: 12, width: 140, background: INK_06, borderRadius: 2, marginBottom: 10 }} />
    <div style={{ height: 56, background: INK_06, borderRadius: 12, marginBottom: 12 }} />
    <div style={{
      background: '#fff', border: `0.5px solid ${INK_10}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ height: 220, background: INK_06 }} />
      <div style={{ height: 60, background: INK_06, borderTop: `0.5px solid ${INK_10}` }} />
      <div style={{ height: 110, background: INK_06, borderTop: `0.5px solid ${INK_10}` }} />
    </div>
  </section>
);

export const RoundsThatCountCard: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data: counters, isLoading: loadingCounters } = useCounters(connectionId);
  const { data: insights } = useHandicapInsights(connectionId);
  const { data: allScores } = useAllScores(connectionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);

  const projection = useMemo(() => {
    if (!allScores || allScores.length < 8 || currentHandicap == null) return null;
    const last20 = allScores.slice(0, 20);
    return projectNextRound(last20, currentHandicap);
  }, [allScores, currentHandicap]);

  const enriched = useMemo(() => {
    if (!counters || counters.length < 8) return null;
    const sorted = [...counters].sort(
      (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
    );
    const validDiffs = sorted
      .map(c => c.handicap_differential)
      .filter((d): d is number => d != null);
    if (validDiffs.length === 0) return null;
    const minDiff = Math.min(...validDiffs);
    const maxDiff = Math.max(...validDiffs);
    const avgDiff = validDiffs.reduce((s, d) => s + d, 0) / validDiffs.length;
    return {
      rounds: sorted.map(c => ({
        ...c,
        is_best: c.handicap_differential === minDiff,
        is_worst: c.handicap_differential === maxDiff,
      })),
      minDiff, maxDiff, avgDiff,
    };
  }, [counters]);

  if (loadingCounters) return <Skeleton />;
  if (!enriched || currentHandicap == null) return null;

  const defaultSelected = enriched.rounds[enriched.rounds.length - 1];
  const selectedRound =
    enriched.rounds.find(r => r.id === selectedId) ?? defaultSelected;
  const selectedIdx = enriched.rounds.findIndex(r => r.id === selectedRound.id);
  const bestRound = enriched.rounds.find(r => r.is_best)!;
  const worstRound = enriched.rounds.find(r => r.is_worst)!;

  // Y-axis range
  const yMin = Math.min(-1, Math.floor(enriched.minDiff - 0.5));
  const yMax = Math.max(4, Math.ceil(enriched.maxDiff + 0.5));
  const ticks = generateTicks(yMin, yMax);
  const ySpan = yMax - yMin;
  const innerH = CHART_H - CHART_TOP - CHART_BOTTOM;
  const yFor = (diff: number) => CHART_TOP + ((yMax - diff) / ySpan) * innerH;

  // X positions
  const colCount = enriched.rounds.length;
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

  // Banner content
  const bannerText = insights?.rounds_pattern
    || 'Your handicap is built from these 8 rounds.';

  return (
    <section style={{ padding: '0 16px', marginBottom: 28 }}>
      {/* Eyebrow */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 2px',
      }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: INK_40 }} />
        <span style={{
          fontSize: 10, fontWeight: 800, color: INK_55, letterSpacing: '0.22em',
        }}>
          ROUNDS THAT COUNT
        </span>
      </div>

      {/* Echo insight banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: AMBER_TINT_06,
        border: `0.5px solid ${AMBER_BORDER}`,
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 12,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DEEP})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(247,147,30,0.30)',
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            {[1, 3, 5, 7, 9].map((x, i) => {
              const heights = [3, 6, 9, 6, 3];
              const h = heights[i];
              return (
                <rect key={x} x={x - 0.5} y={(11 - h) / 2} width="1.4" height={h}
                  rx="0.7" fill="#fff" />
              );
            })}
          </svg>
        </div>
        <p style={{
          margin: 0, fontSize: 12, color: INK_70, lineHeight: 1.45,
        }}>
          {renderBoldMarkdown(bannerText)}
        </p>
      </div>

      {/* Parent card */}
      <div style={{
        background: '#fff',
        border: `0.5px solid ${INK_10}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Chart */}
        <div style={{ padding: '14px 14px 0' }}>
          {/* Y-axis unit label */}
          <div style={{
            fontSize: 10, fontWeight: 700, color: AMBER_DEEP,
            letterSpacing: '0.04em', marginBottom: 4, paddingLeft: 4,
          }}>
            differential
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
                  position: 'absolute', top: yFor(t) - 6,
                  right: 6, fontSize: 10, fontWeight: 700,
                  color: INK_40, fontFamily: FONT_DISPLAY,
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right', width: '100%',
                }}>
                  {fmtAxis(t)}
                </div>
              ))}
            </div>

            {/* Plot area */}
            <div style={{
              flex: 1, position: 'relative', height: CHART_H,
            }}>
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

              {/* Dots — separate so we can use HTML for sizing */}
              {enriched.rounds.map((r, i) => {
                const d = r.handicap_differential ?? 0;
                const isSel = r.id === selectedRound.id;
                const stroke = r.is_best ? GREEN : r.is_worst ? RED : AMBER;
                const dotSize = isSel ? 14 : 10;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    aria-label={`Round at ${r.course?.name ?? 'course'}`}
                    style={{
                      position: 'absolute',
                      left: `${xFor(i)}%`,
                      top: yFor(d),
                      width: dotSize, height: dotSize,
                      marginLeft: -dotSize / 2, marginTop: -dotSize / 2,
                      borderRadius: '50%',
                      background: '#fff',
                      border: `2.5px solid ${stroke}`,
                      boxShadow: isSel ? `0 0 0 2px ${INK}` : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      zIndex: 2,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Date labels */}
          <div style={{
            display: 'flex', marginTop: 6, marginLeft: Y_AXIS_W,
          }}>
            {enriched.rounds.map((r, i) => {
              const d = new Date(r.play_date);
              const isSel = r.id === selectedRound.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    flex: 1, textAlign: 'center',
                    background: 'transparent', border: 'none',
                    padding: '4px 0', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    fontSize: 9, fontWeight: 700,
                    color: isSel ? INK : INK_55,
                    letterSpacing: 0,
                  }}>
                    {WEEKDAY[d.getDay()]}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: isSel ? INK : INK_40,
                    fontFamily: FONT_DISPLAY,
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 1,
                  }}>
                    {d.getDate()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-up stat row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: `0.5px solid ${INK_10}`,
          marginTop: 6,
        }}>
          <StatCell
            label="BEST" value={enriched.minDiff} color={GREEN}
            active={selectedRound.id === bestRound.id}
            onClick={() => setSelectedId(bestRound.id)}
          />
          <StatCell
            label="AVG" value={enriched.avgDiff} color={INK_40}
            disabled
          />
          <StatCell
            label="WORST" value={enriched.maxDiff} color={RED}
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

      {/* Selected detail card */}
      <button
        onClick={() => { /* no-op v1 */ }}
        style={{
          marginTop: 12, width: '100%',
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#fff', border: `0.5px solid ${INK_10}`,
          borderRadius: 12, padding: '10px 12px',
          textAlign: 'left', cursor: 'pointer',
        }}
      >
        <div style={{
          flexShrink: 0,
          minWidth: 56, padding: '6px 10px', borderRadius: 8,
          background:
            selectedRound.is_best ? 'rgba(5,150,105,0.10)'
            : selectedRound.is_worst ? 'rgba(159,29,29,0.10)'
            : INK_06,
          color:
            selectedRound.is_best ? GREEN
            : selectedRound.is_worst ? RED
            : INK,
          textAlign: 'center',
          fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {selectedRound.handicap_differential != null
            ? fmtDiff(selectedRound.handicap_differential, { plus: true })
            : '—'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: INK,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedRound.course?.name ?? 'Unknown course'}
          </div>
          <div style={{ fontSize: 11, color: INK_55, marginTop: 1 }}>
            {(() => {
              const d = new Date(selectedRound.play_date);
              const dateStr = `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
              const gross = selectedRound.adjusted_gross != null ? ` · ${selectedRound.adjusted_gross}` : '';
              return `${dateStr}${gross}`;
            })()}
          </div>
        </div>
        <ChevronRight size={16} color={INK_40} />
      </button>

      <HandicapExplainerSheet
        open={showExplainer}
        onClose={() => setShowExplainer(false)}
        maxDiff={enriched.maxDiff}
        avgDiff={enriched.avgDiff}
      />
    </section>
  );
};

// ── Stat cell ─────────────────────────────────────────────────────────────
const StatCell: React.FC<{
  label: string;
  value: number;
  color: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ label, value, color, active, disabled, onClick }) => {
  const valueColor = label === 'WORST' ? RED : label === 'BEST' ? GREEN : INK;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '12px 6px',
        background: active ? AMBER_TINT_06 : 'transparent',
        border: 'none',
        borderRight: label !== 'WORST' ? `0.5px solid ${INK_10}` : 'none',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      <span style={{
        fontSize: 9, fontWeight: 800, color: INK_55, letterSpacing: '0.22em',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 22, fontWeight: 600, color: valueColor,
        fontFamily: FONT_DISPLAY, fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}>
        {fmtDiff(value, { plus: true })}
      </span>
    </button>
  );
};

// ── Target card ───────────────────────────────────────────────────────────
const TargetCard: React.FC<{
  direction: 'cut' | 'hold';
  eyebrow: string;
  preposition: string;
  value: number;
  description: string;
}> = ({ direction, eyebrow, preposition, value, description }) => {
  const accent = direction === 'cut' ? GREEN : RED;
  const Arrow = direction === 'cut' ? ArrowDown : ArrowUp;
  return (
    <div style={{
      background: '#fff',
      borderTop: `2px solid ${accent}`,
      borderRight: `0.5px solid ${INK_10}`,
      borderBottom: `0.5px solid ${INK_10}`,
      borderLeft: `0.5px solid ${INK_10}`,
      borderRadius: 10,
      padding: 12,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 9, fontWeight: 800, color: accent,
        letterSpacing: '0.22em', marginBottom: 6,
      }}>
        <Arrow size={10} strokeWidth={2.5} />
        {eyebrow}
      </div>
      <div style={{ fontSize: 11, color: INK_55, marginBottom: 2 }}>
        {preposition}
      </div>
      <div style={{
        fontSize: 26, fontWeight: 600, color: INK,
        fontFamily: FONT_DISPLAY, fontVariantNumeric: 'tabular-nums',
        lineHeight: 1, marginBottom: 8,
      }}>
        {fmtDiff(value, { plus: true })}
      </div>
      <div style={{ fontSize: 10, color: INK_55, lineHeight: 1.4 }}>
        {description}
      </div>
    </div>
  );
};

export default RoundsThatCountCard;

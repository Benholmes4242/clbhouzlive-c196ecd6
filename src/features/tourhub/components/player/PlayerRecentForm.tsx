/**
 * FormSection — three-branch form treatment.
 *
 * Branches:
 *   ≥ 3 events  → full card: detail-slot + full-width interactive sparkline
 *   1-2 events  → simpler card: dot strip only
 *   0 events    → returns null
 */

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { usePlayerResults, formatPositionShort, formatScore, type PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_07, SCORE_UNDER_PAR_LIGHT, SLATE_50, SURFACE, TREND_DOWN } from '../../_shared/tokens';

interface FormSectionProps {
  playerId: string;
}

interface FormVerdict {
  label: string;
  textColor: string;
  Arrow: typeof ArrowUpRight;
  arrowColor: string;
}

function deriveVerdict(avgPos: number, mostRecentPos: number): FormVerdict {
  if (avgPos <= 10 && mostRecentPos <= 3) {
    return { label: 'Heating up', textColor: AMBER, Arrow: ArrowUpRight, arrowColor: AMBER };
  }
  if (avgPos <= 20) {
    return { label: 'In form', textColor: AMBER, Arrow: ArrowUpRight, arrowColor: AMBER };
  }
  if (avgPos <= 50) {
    return { label: 'Steady', textColor: INK_FAINT, Arrow: ArrowRight, arrowColor: INK_FAINT };
  }
  return { label: 'Out of form', textColor: TREND_DOWN, Arrow: ArrowDownRight, arrowColor: TREND_DOWN };
}

function dotColorForPosition(pos: number, status: string | null): string {
  const s = status?.toUpperCase();
  if (s === 'CUT' || s === 'WD' || s === 'DQ' || s === 'MC') return TREND_DOWN;
  if (pos <= 10) return SCORE_UNDER_PAR_LIGHT;
  if (pos <= 40) return AMBER;
  return TREND_DOWN;
}

function formatFinishLabel(evt: PlayerTournamentResult): string {
  const s = evt.status?.toUpperCase();
  if (s === 'CUT' || s === 'MC') return 'MC';
  if (s === 'WD' || s === 'DQ') return s;
  const pos = evt.position;
  if (pos == null) return '—';
  if (pos === 1) return '1';
  return evt.position_tied ? `T${pos}` : `${pos}`;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface DotStripProps {
  events: PlayerTournamentResult[];
}

function DotStrip({ events }: DotStripProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
      {events.map((evt, i) => {
        const pos = evt.position;
        const color = dotColorForPosition(pos ?? 999, evt.status);
        const label = formatFinishLabel(evt);
        return (
          <div
            key={evt.id ?? i}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
            <div
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface InteractiveSparklineProps {
  /** Events ordered oldest → newest (index-aligned with positions). */
  events: PlayerTournamentResult[];
  positions: number[];
  activeIdx: number | null;
  setActiveIdx: (i: number | null) => void;
}

function InteractiveSparkline({ events, positions, activeIdx, setActiveIdx }: InteractiveSparklineProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const pathLenRef = useRef<number>(0);
  const [drawn, setDrawn] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (lineRef.current) {
      try { pathLenRef.current = lineRef.current.getTotalLength(); } catch { pathLenRef.current = 0; }
    }
    if (reduced) {
      setDrawn(true);
      return;
    }
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  if (positions.length < 2) return null;

  const VB_W = 1000;
  const VB_H = 150;
  const PAD_X = 8;

  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const range = Math.max(1, maxPos - minPos);

  const yForPos = (p: number) =>
    ((Math.max(minPos, Math.min(maxPos, p)) - minPos) / range) * (VB_H - 20) + 10;
  const zoneBottom = yForPos(10);

  const coords = positions.map((pos, i) => {
    const x = PAD_X + (i / (positions.length - 1)) * (VB_W - PAD_X * 2);
    const y = yForPos(pos);
    return { x, y };
  });

  const polyPoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const lastIdx = positions.length - 1;
  const len = pathLenRef.current;

  const updateFromPointer = (clientX: number) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (positions.length - 1));
    setActiveIdx(idx);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: 78,
        touchAction: 'none',
        cursor: 'pointer',
        position: 'relative',
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        updateFromPointer(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 0 && e.pointerType === 'mouse') return;
        if (!(e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) return;
        updateFromPointer(e.clientX);
      }}
      onPointerUp={(e) => {
        try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
        setActiveIdx(null);
      }}
      onPointerCancel={() => setActiveIdx(null)}
      onPointerLeave={() => setActiveIdx(null)}
    >
      {activeIdx != null && coords[activeIdx] && events[activeIdx] && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: `${(coords[activeIdx].x / VB_W) * 100}%`,
            transform: 'translateX(-50%)',
            background: INK,
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 7,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 2,
            boxShadow: '0 4px 12px rgba(15,23,42,0.18)',
          }}
        >
          {formatFinishLabel(events[activeIdx])}
        </div>
      )}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="formFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AMBER} stopOpacity={0.22} />
            <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* In-form (top-10) zone */}
        <rect
          x={PAD_X}
          y={2}
          width={VB_W - PAD_X * 2}
          height={Math.max(0, zoneBottom - 2)}
          fill={SCORE_UNDER_PAR_LIGHT}
          opacity={0.05}
        />
        <line
          x1={PAD_X}
          x2={VB_W - PAD_X}
          y1={zoneBottom}
          y2={zoneBottom}
          stroke={SCORE_UNDER_PAR_LIGHT}
          strokeWidth={1}
          strokeDasharray="2 7"
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
        />

        {/* Area fade */}
        <polygon
          points={`${PAD_X},${VB_H} ${polyPoints} ${VB_W - PAD_X},${VB_H}`}
          fill="url(#formFill)"
          style={
            reduced
              ? undefined
              : { opacity: drawn ? 1 : 0, transition: 'opacity 600ms ease 250ms' }
          }
        />

        {activeIdx != null && coords[activeIdx] && (
          <line
            x1={coords[activeIdx].x}
            x2={coords[activeIdx].x}
            y1={0}
            y2={VB_H}
            stroke={AMBER}
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          ref={lineRef}
          points={polyPoints}
          fill="none"
          stroke={AMBER}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={
            reduced || !len
              ? undefined
              : {
                  strokeDasharray: len,
                  strokeDashoffset: drawn ? 0 : len,
                  transition: 'stroke-dashoffset 700ms cubic-bezier(.33,1,.68,1)',
                }
          }
        />
        {coords.map((c, i) => {
          const isActive = i === activeIdx;
          const isLatest = i === lastIdx;
          const c_ = dotColorForPosition(positions[i], events[i]?.status ?? null);
          const isAmberTier = c_ === AMBER;
          const groupStyle = reduced
            ? undefined
            : { opacity: drawn ? 1 : 0, transition: `opacity 300ms ease ${300 + i * 35}ms` };
          if (isActive) {
            return (
              <g key={i} style={groupStyle}>
                <circle cx={c.x} cy={c.y} r={11} fill={c_} fillOpacity={0.16} />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={7}
                  fill={c_}
                  stroke={SURFACE}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }
          if (isLatest) {
            return (
              <g key={i} style={groupStyle}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={5}
                  fill={c_}
                  stroke={SURFACE}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }
          return (
            <g key={i} style={groupStyle}>
              <circle
                cx={c.x}
                cy={c.y}
                r={3.5}
                fill={isAmberTier ? SURFACE : c_}
                stroke={c_}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}


export function FormSection({ playerId }: FormSectionProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 10);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (isLoading) return null;

  const visible = (results ?? []).slice(0, 4);
  const trend = (results ?? []).slice(0, 10);

  if (visible.length === 0) return null;

  const isFinished = (r: PlayerTournamentResult) => {
    const s = r.status?.toUpperCase();
    return r.position !== null && s !== 'CUT' && s !== 'WD' && s !== 'DQ' && s !== 'MC';
  };
  const finishedRows = visible.filter(isFinished);
  const trendFinishes = trend.filter(isFinished);

  // Branch 1 — 1-2 events: dot strip only
  if (visible.length < 3 || finishedRows.length < 2) {
    return (
      <div
        style={{
          background: SLATE_50,
          borderTop: `0.5px solid ${INK_TINT_07}`,
          padding: '14px 16px 16px',
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: INK_MUTE,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
            }}
          >
            Recent Results
          </span>
        </div>
        <DotStrip events={visible} />
      </div>
    );
  }

  // Branch 2 — ≥3 finished events: full card with interactive sparkline
  const positions = trendFinishes.map(r => r.position!);
  const avgPos = Math.round(positions.reduce((s, p) => s + p, 0) / positions.length);
  const mostRecentPos = positions[0];
  const verdict = deriveVerdict(avgPos, mostRecentPos);
  const { Arrow } = verdict;

  // Oldest → newest, index-aligned with the sparkline
  const sparkPositions = positions.slice().reverse();
  const sparkEvents = trendFinishes.slice().reverse();
  const activeEvent = activeIdx != null ? sparkEvents[activeIdx] : null;

  return (
    <div
      style={{
        background: SLATE_50,
        borderTop: `0.5px solid ${INK_TINT_07}`,
        padding: '14px 16px 16px',
      }}
    >
      {/* Eyebrow */}
      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: INK_MUTE,
            letterSpacing: '0.16em',
            textTransform: 'uppercase' as const,
          }}
        >
          Form · last {Math.min(10, trend.length)} events
        </span>
      </div>

      {/* Fixed-height detail slot ABOVE the line (44px) so layout never jumps */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        {activeEvent ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: INK,
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.01em',
              }}
            >
              {activeEvent.tournament_name}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: INK_MUTE,
                marginTop: 3,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {[
                activeEvent.tournament_end_date
                  ? format(new Date(activeEvent.tournament_end_date), 'MMM d')
                  : null,
                `Finish ${formatPositionShort(activeEvent.position, activeEvent.position_tied, activeEvent.status)}`,
                activeEvent.score != null ? formatScore(activeEvent.score) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        ) : (
          <>
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: verdict.textColor,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {verdict.label}
                </span>
                <Arrow size={16} color={verdict.arrowColor} strokeWidth={2.5} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: INK_FAINT,
                  fontWeight: 600,
                  marginTop: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                avg finish {avgPos === 1 ? '1' : `T${avgPos}`}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Full-width interactive sparkline */}
      <InteractiveSparkline
        events={sparkEvents}
        positions={sparkPositions}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
      />

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 16,
          paddingTop: 14,
          borderTop: `0.5px solid ${INK_TINT_07}`,
        }}
      >
        {([
          ['In form · Top-10', SCORE_UNDER_PAR_LIGHT],
          ['Solid', AMBER],
          ['Off week', TREND_DOWN],
        ] as const).map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: INK_MUTE }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Backwards-compat
export const PlayerRecentForm = FormSection;

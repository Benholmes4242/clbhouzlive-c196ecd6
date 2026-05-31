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
import { AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_07, SCORE_UNDER_PAR_LIGHT, SURFACE, TREND_DOWN } from '../../_shared/tokens';

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
        const status = evt.status?.toUpperCase();
        const isMissed = status === 'CUT' || status === 'WD' || status === 'DQ' || status === 'MC';
        const pos = evt.position;
        const color = dotColorForPosition(pos ?? 999, evt.status);
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
  if (positions.length < 2) return null;

  const VB_W = 1000;
  const VB_H = 150;
  const PAD_X = 8;

  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const range = Math.max(1, maxPos - minPos);

  const coords = positions.map((pos, i) => {
    const x = PAD_X + (i / (positions.length - 1)) * (VB_W - PAD_X * 2);
    const y = ((pos - minPos) / range) * (VB_H - 20) + 10;
    return { x, y };
  });

  const polyPoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const lastIdx = positions.length - 1;

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
        height: 64,
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
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
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
          points={polyPoints}
          fill="none"
          stroke={AMBER}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => {
          const isActive = i === activeIdx;
          const isLatest = i === lastIdx;
          if (isActive) {
            return (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={11} fill={AMBER} fillOpacity={0.18} />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={7}
                  fill={AMBER}
                  stroke={SURFACE}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }
          if (isLatest) {
            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={5}
                fill={AMBER}
                stroke={SURFACE}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          }
          return (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={3.5}
              fill={SURFACE}
              stroke={AMBER}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
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
          background: SURFACE,
          borderBottom: `1px solid ${INK_TINT_07}`,
          marginTop: 8,
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
        background: SURFACE,
        borderBottom: `1px solid ${INK_TINT_07}`,
        marginTop: 8,
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
    </div>
  );
}

// Backwards-compat
export const PlayerRecentForm = FormSection;

/**
 * FormSection — three-branch form treatment.
 *
 * Branches (D9):
 *   ≥ 3 events  → full card: trend label + sparkline + dot strip
 *   1-2 events  → simpler card: dot strip only
 *   0 events    → returns null (Career Highlights deferred)
 *
 * Form labels (D14):
 *   avgPos ≤ 10 AND mostRecent ≤ 3 → "Heating up"  (amber ↗)
 *   avgPos ≤ 20                    → "In form"     (amber ↗)
 *   avgPos 21-50                   → "Steady"      (slate →)
 *   avgPos > 50                    → "Out of form" (red ↘)
 *
 * Tour code sublabels under dots (D15): only render when the visible 4 events
 * span more than one tour. Single-tour majority renders dots without codes.
 */

import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { usePlayerResults, type PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { AMBER, INK_FAINT, INK_LIGHT, INK_MUTE, INK_TINT_07, SURFACE, TREND_DOWN } from '../../_shared/tokens';

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
  if (pos <= 10) return AMBER;
  if (pos <= 30) return INK_FAINT;
  if (pos <= 70) return INK_LIGHT;
  return TREND_DOWN;
}

interface SparklineProps {
  positions: number[];
}

/**
 * SVG path with Y-axis inverted so winning trends UP. Uses normalized 0..100
 * coords with preserveAspectRatio="none" for fluid scaling. Width is fixed by
 * the consumer's container.
 */
function Sparkline({ positions }: SparklineProps) {
  if (positions.length < 2) return null;
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const range = Math.max(1, maxPos - minPos);

  // Lower position (better) maps to lower Y → top of SVG. We flip by mapping
  // (pos - min) / range directly; lower position → 0 → top.
  const points = positions.map((pos, i) => {
    const x = (i / (positions.length - 1)) * 100;
    const y = ((pos - minPos) / range) * 100;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const path = `M ${points[0]} L ${points.slice(1).join(' ')}`;

  return (
    <svg
      width="100%"
      height="36"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <path
        d={path}
        fill="none"
        stroke={AMBER}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface DotStripProps {
  events: PlayerTournamentResult[];
  showTourCodes: boolean;
}

function DotStrip({ events, showTourCodes }: DotStripProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
      {events.map((evt, i) => {
        const status = evt.status?.toUpperCase();
        const isMissed = status === 'CUT' || status === 'WD' || status === 'DQ' || status === 'MC';
        const pos = evt.position;
        const color = dotColorForPosition(pos ?? 999, evt.status);
        const label = isMissed
          ? status
          : pos === null
          ? '—'
          : pos === 1
          ? '1'
          : `T${pos}`;

        return (
          <div
            key={evt.id ?? i}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: color,
              }}
            />
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
            {showTourCodes && (
              <div
                style={{
                  fontSize: '7.5px',
                  fontWeight: 700,
                  color: INK_FAINT,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}
              >
                {/* Tour code is not on the result row today; placeholder kept
                 * for D15 schema follow-up. Render '—' rather than guess. */}
                —
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FormSection({ playerId }: FormSectionProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 10);

  if (isLoading) return null;

  // Slice to the most recent 4 (D17).
  const visible = (results ?? []).slice(0, 4);

  // Branch 0 — 0 events: render nothing (D9). Career Highlights deferred.
  if (visible.length === 0) return null;

  // For the trend label and sparkline, use only "real finishes" (exclude
  // CUT/WD/DQ/MC where position is meaningless).
  const finishedRows = visible.filter((r) => {
    const s = r.status?.toUpperCase();
    return r.position !== null && s !== 'CUT' && s !== 'WD' && s !== 'DQ' && s !== 'MC';
  });

  // Branch 1 — 1-2 events: dot strip only, no sparkline, no label.
  // This branch also handles "all 4 were missed cuts" by treating it as 1-2 quality data.
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
        <DotStrip events={visible} showTourCodes={false} />
      </div>
    );
  }

  // Branch 2 — ≥3 finished events: full card.
  const positions = finishedRows.map((r) => r.position!);
  const avgPos = Math.round(
    positions.reduce((sum, p) => sum + p, 0) / positions.length,
  );
  const mostRecentPos = positions[0];
  const verdict = deriveVerdict(avgPos, mostRecentPos);
  const { Arrow } = verdict;

  return (
    <div
      style={{
        background: SURFACE,
        borderBottom: `1px solid ${INK_TINT_07}`,
        marginTop: 8,
        padding: '14px 16px 16px',
      }}
    >
      {/* Section eyebrow — canonical §6 slate-caps */}
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
          Form · last {visible.length} events
        </span>
      </div>

      {/* Verdict + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
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
              color: '#94A3B8',
              fontWeight: 600,
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            avg finish {avgPos === 1 ? '1' : `T${avgPos}`}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 80, maxWidth: 160 }}>
          <Sparkline positions={positions} />
        </div>
      </div>

      {/* Dot strip */}
      <DotStrip events={visible} showTourCodes={false} />
    </div>
  );
}

// Backwards-compat named export — page imports `PlayerRecentForm`.
export const PlayerRecentForm = FormSection;

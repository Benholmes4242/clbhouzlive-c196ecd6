import React from 'react';
import { A, LABEL, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { beadForScore } from '@/features/courses/_shared/beadForScore';

/**
 * Cumulative to-par across the round.
 *
 * Two series: the viewing member (or the player) in AMBER, and the field in a
 * muted grey. The gap between the lines is the story, so no copy is needed.
 * Over par plots UP.
 *
 * Beads mark only the holes that swung the round:
 *   birdie or better -> TOPAR_UNDER red, good in golf (eagle+ drawn larger)
 *   double or worse  -> TOPAR_OVER ink
 *   bogey            -> no bead at all (a normal outcome; marking every one
 *                       turns the line into noise)
 *
 * The to-par tokens come from `tourhub/_shared/tokens` so a member card and a
 * tour card colour the same score identically. Course difficulty (red harder /
 * green easier) is a different semantic surface and is not used here.
 */

const FIELD_LINE = '#C3CAD2';
const BASELINE = 'rgba(15,23,42,0.10)';

export interface TrajectoryHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  /** Optional field average for the hole. Absent = the field line stops. */
  fieldAvg?: number | null;
}

interface Props {
  holes: TrajectoryHole[];
  height?: number;
}

export const TrajectoryLine: React.FC<Props> = ({ holes, height = 104 }) => {
  const plottable = holes.filter(
    (h) => h.par != null && h.strokes != null && (h.strokes as number) > 0,
  );
  if (plottable.length < 2) return null;

  const w = 340;
  const padX = 4;
  const padY = 14;
  const n = plottable.length;

  let cumYou = 0;
  let cumField = 0;
  const you: number[] = [];
  const field: number[] = [];
  const beads: { i: number; cum: number; tone: string; big: boolean }[] = [];

  // The field series stops at the first hole with no field average — a live
  // tournament round gates holes the field has not finished, and interpolating
  // (or extending flat) would invent data.
  let fieldOpen = true;
  plottable.forEach((h, i) => {
    const d = (h.strokes as number) - (h.par as number);
    cumYou += d;
    you.push(cumYou);

    if (fieldOpen && h.fieldAvg != null) {
      cumField += (h.fieldAvg as number) - (h.par as number);
      field.push(cumField);
    } else {
      fieldOpen = false;
    }

    if (d <= -1) beads.push({ i, cum: cumYou, tone: TOPAR_UNDER_LIGHT, big: d <= -2 });
    else if (d >= 2) beads.push({ i, cum: cumYou, tone: TOPAR_OVER_LIGHT, big: false });
  });

  const hasField = field.length >= 2;
  const all = hasField ? [...you, ...field, 0] : [...you, 0];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(max - min, 1);

  const x = (i: number) => padX + (i / (n - 1)) * (w - padX * 2);
  const y = (v: number) => padY + ((max - v) / span) * (height - padY * 2);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const ticks = [...new Set([0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1])];

  return (
    <>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        {/* level par */}
        <line
          x1={padX}
          x2={w - padX}
          y1={y(0)}
          y2={y(0)}
          stroke={BASELINE}
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        {hasField && (
          <path
            d={path(field)}
            fill="none"
            stroke={FIELD_LINE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        <path
          d={path(you)}
          fill="none"
          stroke={A.AMBER}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {beads.map((b) => (
          <circle
            key={b.i}
            cx={x(b.i)}
            cy={y(b.cum)}
            r={b.big ? 5 : 3.6}
            fill={b.tone}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 2px 0' }}>
        {ticks.map((i) => (
          <span
            key={i}
            style={{ ...LABEL, ...FIGS, fontSize: 8.5, color: i === n - 1 ? A.INK : A.DIM }}
          >
            {plottable[i].holeNo}
          </span>
        ))}
      </div>
    </>
  );
};

export default TrajectoryLine;

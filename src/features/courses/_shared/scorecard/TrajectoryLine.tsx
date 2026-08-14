import React from 'react';
import { A, LABEL, FIGS, TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { beadForScore } from '@/features/courses/_shared/beadForScore';
import { monotonePath } from '@/lib/charts/monotonePath';

/**
 * Cumulative to-par across the round.
 *
 * THE PLAYER LINE IS SPLIT AT LEVEL PAR — RED (TOPAR_UNDER_LIGHT) where the
 * round sat BELOW level, INK (TOPAR_OVER_LIGHT) where it sat above — and is
 * FILLED TO THE LEVEL RULE so the distance from par is the story. This matches
 * the friends tile exactly: one fill, one meaning, across both surfaces.
 * The old amber "own round" tone is GONE; amber meant the viewer, and the
 * to-par split now owns the colour.
 *
 * RED IS EARNED: a round that never went under par draws in one tone with one
 * fill and no red anywhere.
 *
 * The field average stays ONE grey stroke — unfilled, unsplit, behind the
 * player's white halo. Over par plots UP.
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
const OVER_TONE = A.INK;
const UNDER_TONE = TOPAR_RED;

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
  /** Retained for callers; the line's colour is now the to-par split. */
  own?: boolean;
}

let uidSeq = 0;

export const TrajectoryLine: React.FC<Props> = ({ holes, height = 104 }) => {

  const plottable = holes.filter(
    (h) => h.par != null && h.strokes != null && (h.strokes as number) > 0,
  );
  if (plottable.length < 2) return null;

  const w = 340;
  const padX = 4;
  const padY = 14;
  /** Holes plotted. The SERIES carry ONE MORE POINT than this: a round starts
   *  at LEVEL PAR before the first tee (BRIEF_UNIFY_ROUND_CURVE_BEADS §4), so
   *  hole n sits at series index n and index 0 is the tee. */
  const m = plottable.length;
  const n = m + 1;

  let cumYou = 0;
  let cumField = 0;
  // THE LEADING LEVEL-PAR POINT. The two series are often DIFFERENT LENGTHS
  // (the field stops early), so each gets its own leading zero.
  const you: number[] = [0];
  const field: number[] = [0];
  const beads: { i: number; cum: number; tone: string; r: number }[] = [];

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

    const bead = beadForScore(h.strokes, h.par, 'light');
    // hole at plottable index i is at SERIES index i + 1.
    if (bead) beads.push({ i: i + 1, cum: cumYou, tone: bead.tone, r: bead.radius });
  });

  // >= 3: the leading level-par point does not on its own make a series.
  const hasField = field.length >= 3;
  const all = hasField ? [...you, ...field, 0] : [...you, 0];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(max - min, 1);

  // RED IS EARNED, NOT RESERVED — same rule as the friends tile.
  const wentUnder = Math.min(...you) < 0;

  const x = (i: number) => padX + (i / (n - 1)) * (w - padX * 2);
  const y = (v: number) => padY + ((max - v) / span) * (height - padY * 2);
  const zeroY = y(0);

  // THE FILL IS BUILT FROM THE PLAYER SERIES ONLY. The field series is often
  // SHORTER (see fieldOpen), so it must never enter this geometry.
  const youPts = you.map((v, i) => ({ x: x(i), y: y(v) }));
  const youD = monotonePath(youPts);
  const fillD = `${youD} L${youPts[youPts.length - 1].x.toFixed(2)},${zeroY.toFixed(2)} L${youPts[0].x.toFixed(2)},${zeroY.toFixed(2)} Z`;
  const fieldD = hasField
    ? monotonePath(field.map((v, i) => ({ x: x(i), y: y(v) })))
    : '';

  const uid = `traj-${(uidSeq = (uidSeq + 1) % 100000)}`;
  const clipAbove = `${uid}-ca`;
  const clipBelow = `${uid}-cb`;
  const gradAbove = `${uid}-ga`;
  const gradBelow = `${uid}-gb`;

  // TICKS INDEX `plottable`, NOT THE SERIES — the leading point is not a hole,
  // so every tick must still resolve to plottable[i].holeNo (1 / 5 / 10 / 14 / 18
  // on a full round).
  const ticks = [...new Set([0, Math.floor(m / 4), Math.floor(m / 2), Math.floor((3 * m) / 4), m - 1])];

  return (
    <>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipAbove}>
            <rect x={0} y={0} width={w} height={Math.max(zeroY, 0)} />
          </clipPath>
          {wentUnder && (
            <clipPath id={clipBelow}>
              <rect x={0} y={zeroY} width={w} height={Math.max(height - zeroY, 0)} />
            </clipPath>
          )}
          {/* ABOVE LEVEL: density at the TOP, fading down to the level rule. */}
          <linearGradient id={gradAbove} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={OVER_TONE} stopOpacity={0.2} />
            <stop offset="100%" stopColor={OVER_TONE} stopOpacity={0.02} />
          </linearGradient>
          {wentUnder && (
            /* BELOW LEVEL: density at the LOW POINT, fading UP to the rule. */
            <linearGradient id={gradBelow} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={UNDER_TONE} stopOpacity={0.26} />
              <stop offset="100%" stopColor={UNDER_TONE} stopOpacity={0.02} />
            </linearGradient>
          )}
        </defs>

        {/* fill to the level line */}
        <path d={fillD} fill={`url(#${gradAbove})`} stroke="none" clipPath={`url(#${clipAbove})`} />
        {wentUnder && (
          <path d={fillD} fill={`url(#${gradBelow})`} stroke="none" clipPath={`url(#${clipBelow})`} />
        )}

        {/* level par — unconditional: the field line needs a reference even on
            an all-over-par round. */}
        <line
          x1={padX}
          x2={w - padX}
          y1={zeroY}
          y2={zeroY}
          stroke={BASELINE}
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        {/* the field: one grey stroke, BEHIND the player's halo */}
        {hasField && (
          <path
            d={fieldD}
            fill="none"
            stroke={FIELD_LINE}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* WHITE HALO — drawn ONCE, unclipped. Without it the stroke
            disappears into its own fill. */}
        <path
          d={youD}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.85}
          strokeWidth={6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* the player, split at level par */}
        <path
          d={youD}
          fill="none"
          stroke={OVER_TONE}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={wentUnder ? `url(#${clipAbove})` : undefined}
        />
        {wentUnder && (
          <path
            d={youD}
            fill="none"
            stroke={UNDER_TONE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            clipPath={`url(#${clipBelow})`}
          />
        )}

        {/* beads last, so they sit on top */}
        {beads.map((b) => (
          <circle
            key={b.i}
            cx={x(b.i)}
            cy={y(b.cum)}
            r={b.r}
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
            style={{ ...LABEL, ...FIGS, fontSize: 8.5, color: i === m - 1 ? A.INK : A.DIM }}
          >
            {plottable[i].holeNo}
          </span>
        ))}
      </div>
    </>
  );
};

export default TrajectoryLine;

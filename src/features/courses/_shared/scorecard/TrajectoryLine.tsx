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

/**
 * SURFACE TOKENS (BRIEF_TRAJECTORY_CONTINUITY_AND_REUSE §2.3). The component
 * used to hardcode the light surface, so the dark feed card drew ink on
 * near-black and a white halo over a dark panel. Both surfaces now come from
 * one map and `surface` defaults to 'light', so every existing caller is
 * unchanged.
 */
const SURFACE_TOKENS = {
  light: {
    field: '#C3CAD2',
    baseline: 'rgba(15,23,42,0.10)',
    over: A.INK,
    under: TOPAR_RED,
    halo: '#FFFFFF',
    haloOpacity: 0.85,
    beadStroke: '#FFFFFF',
    tickInk: A.INK,
    tickDim: A.DIM,
    // The signed-off LIGHT values. They do not move: the friends rail, the
    // scorecard sheet and the course analytics all draw on light.
    fillAbove: 0.2,
    fillBelow: 0.26,
  },
  dark: {
    field: 'rgba(255,255,255,0.34)',
    baseline: 'rgba(255,255,255,0.18)',
    over: '#E8EDF2',
    under: '#FF6B60',
    halo: '#0B0D10',
    haloOpacity: 0.7,
    beadStroke: '#0B0D10',
    tickInk: 'rgba(255,255,255,0.82)',
    tickDim: 'rgba(255,255,255,0.40)',
    // BRIEF_ROUND_POST_ENRICHMENT §5: the light figures read far fainter on
    // near-black, so the dark surface carries its own, richer pair — here in
    // the map, never as a caller-side prop override.
    fillAbove: 0.3,
    fillBelow: 0.42,
  },
} as const;

export interface TrajectoryHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  /** Optional field average for the hole. Absent = the field line stops. */
  fieldAvg?: number | null;
  /**
   * false = NEVER STARTED. Such a hole takes no strokes and no par, so the line
   * carries straight past it: no point, no bead, NO BREAK. Absent = played.
   */
  played?: boolean;
}

interface Props {
  holes: TrajectoryHole[];
  height?: number;
  /** Retained for callers; the line's colour is now the to-par split. */
  own?: boolean;
  /** Which surface the chart is drawn on. Defaults to light. */
  surface?: 'light' | 'dark';
}

let uidSeq = 0;

interface Pt {
  pos: number;
  cum: number;
}

export const TrajectoryLine: React.FC<Props> = ({ holes, height = 104, surface = 'light' }) => {
  const T = SURFACE_TOKENS[surface];

  /**
   * X IS DERIVED FROM HOLE POSITION, NOT ARRAY INDEX INTO A FILTERED LIST
   * (§3.3). A hole with no value keeps its slot and the line BREAKS there — two
   * segments, no bridge, no interpolation. Previously the unscored holes were
   * filtered out and the axis compressed, so a partial round plotted seventeen
   * holes across an eighteen-hole axis and ended at the wrong to-par.
   *
   * Position 0 is the tee (level par); the hole at array index i sits at
   * position i + 1. On a complete round this is identical to the old geometry.
   */
  const m = holes.length;
  if (m < 2) return null;

  const segments: Pt[][] = [];
  const beads: { pos: number; cum: number; tone: string; r: number }[] = [];
  const fieldPts: Pt[] = [{ pos: 0, cum: 0 }];
  let cumYou = 0;
  let cumField = 0;
  let fieldOpen = true;
  let current: Pt[] | null = [{ pos: 0, cum: 0 }];

  holes.forEach((h, i) => {
    const pos = i + 1;
    // NEVER STARTED: not a gap. Skip it entirely.
    if (h.played === false) return;

    const plottable = h.par != null && h.strokes != null && (h.strokes as number) > 0;
    if (!plottable) {
      // THE BREAK. Close the open segment; the next scored hole starts a new one.
      if (current && current.length >= 2) segments.push(current);
      current = null;
      fieldOpen = false;
      return;
    }

    cumYou += (h.strokes as number) - (h.par as number);
    if (!current) current = [];
    current.push({ pos, cum: cumYou });

    if (fieldOpen && h.fieldAvg != null) {
      cumField += (h.fieldAvg as number) - (h.par as number);
      fieldPts.push({ pos, cum: cumField });
    } else {
      fieldOpen = false;
    }

    const bead = beadForScore(h.strokes, h.par, surface);
    if (bead) beads.push({ pos, cum: cumYou, tone: bead.tone, r: bead.radius });
  });
  if (current && current.length >= 2) segments.push(current);

  const allPts = segments.flat();
  if (allPts.length < 2) return null;

  const w = 340;
  const padX = 4;
  const padY = 14;

  // >= 3: the leading level-par point does not on its own make a series.
  const hasField = fieldPts.length >= 3;
  const all = [...allPts.map((p) => p.cum), ...(hasField ? fieldPts.map((p) => p.cum) : []), 0];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(max - min, 1);

  // RED IS EARNED, NOT RESERVED — same rule as the friends tile.
  const wentUnder = min < 0;

  const x = (pos: number) => padX + (pos / m) * (w - padX * 2);
  const y = (v: number) => padY + ((max - v) / span) * (height - padY * 2);
  const zeroY = y(0);

  const toPts = (seg: Pt[]) => seg.map((p) => ({ x: x(p.pos), y: y(p.cum) }));
  const lineDs = segments.map((seg) => monotonePath(toPts(seg)));
  // THE FILL IS BUILT FROM THE PLAYER SERIES ONLY, one closed shape per segment.
  const fillDs = segments.map((seg, i) => {
    const pts = toPts(seg);
    return `${lineDs[i]} L${pts[pts.length - 1].x.toFixed(2)},${zeroY.toFixed(2)} L${pts[0].x.toFixed(2)},${zeroY.toFixed(2)} Z`;
  });
  const fieldD = hasField
    ? monotonePath(fieldPts.map((p) => ({ x: x(p.pos), y: y(p.cum) })))
    : '';

  const uid = `traj-${(uidSeq = (uidSeq + 1) % 100000)}`;
  const clipAbove = `${uid}-ca`;
  const clipBelow = `${uid}-cb`;
  const gradAbove = `${uid}-ga`;
  const gradBelow = `${uid}-gb`;

  // TICKS INDEX `holes` — the leading point is not a hole, so every tick
  // resolves to holes[i].holeNo (1 / 5 / 10 / 14 / 18 on a full round).
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
            <stop offset="0%" stopColor={T.over} stopOpacity={T.fillAbove} />
            <stop offset="100%" stopColor={T.over} stopOpacity={0.02} />
          </linearGradient>
          {wentUnder && (
            /* BELOW LEVEL: density at the LOW POINT, fading UP to the rule. */
            <linearGradient id={gradBelow} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={T.under} stopOpacity={T.fillBelow} />
              <stop offset="100%" stopColor={T.under} stopOpacity={0.02} />
            </linearGradient>
          )}
        </defs>

        {/* fill to the level line */}
        {fillDs.map((d, i) => (
          <React.Fragment key={`fill-${i}`}>
            <path d={d} fill={`url(#${gradAbove})`} stroke="none" clipPath={`url(#${clipAbove})`} />
            {wentUnder && (
              <path d={d} fill={`url(#${gradBelow})`} stroke="none" clipPath={`url(#${clipBelow})`} />
            )}
          </React.Fragment>
        ))}

        {/* level par — unconditional: the field line needs a reference even on
            an all-over-par round. */}
        <line
          x1={padX}
          x2={w - padX}
          y1={zeroY}
          y2={zeroY}
          stroke={T.baseline}
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        {/* the field: one grey stroke, BEHIND the player's halo */}
        {hasField && (
          <path
            d={fieldD}
            fill="none"
            stroke={T.field}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* HALO — drawn ONCE per segment, unclipped. Without it the stroke
            disappears into its own fill. */}
        {lineDs.map((d, i) => (
          <path
            key={`halo-${i}`}
            d={d}
            fill="none"
            stroke={T.halo}
            strokeOpacity={T.haloOpacity}
            strokeWidth={6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* the player, split at level par */}
        {lineDs.map((d, i) => (
          <React.Fragment key={`line-${i}`}>
            <path
              d={d}
              fill="none"
              stroke={T.over}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              clipPath={wentUnder ? `url(#${clipAbove})` : undefined}
            />
            {wentUnder && (
              <path
                d={d}
                fill="none"
                stroke={T.under}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                clipPath={`url(#${clipBelow})`}
              />
            )}
          </React.Fragment>
        ))}

        {/* beads last, so they sit on top */}
        {beads.map((b) => (
          <circle
            key={b.pos}
            cx={x(b.pos)}
            cy={y(b.cum)}
            r={b.r}
            fill={b.tone}
            stroke={T.beadStroke}
            strokeWidth={1.5}
          />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 2px 0' }}>
        {ticks.map((i) => (
          <span
            key={i}
            style={{ ...LABEL, ...FIGS, fontSize: 8.5, color: i === m - 1 ? T.tickInk : T.tickDim }}
          >
            {holes[i].holeNo}
          </span>
        ))}
      </div>
    </>
  );
};

export default TrajectoryLine;

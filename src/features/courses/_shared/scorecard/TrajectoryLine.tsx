import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { A, LABEL, FIGS, NUM, TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { TOPAR_EVEN_LIGHT } from '@/features/tourhub/_shared/tokens';
import { beadForScore } from '@/features/courses/_shared/beadForScore';
import { smoothPath } from '@/lib/charts/smoothPath';

/**
 * Cumulative to-par across the round.
 *
 * THE STROKE IS GRADED PER HOLE (BRIEF_SCORECARD_TRAJECTORY_WHOOP §4). One path,
 * one horizontal gradient, one pair of stops per hole, coloured by THAT HOLE'S
 * to-par using the same four buckets the sheet's breakdown panel counts:
 * birdie-or-better / par / bogey / double-or-worse. The stroke therefore says
 * WHAT HAPPENED ON EACH HOLE — eighteen facts.
 *
 * THE FILL KEEPS ITS LEVEL-PAR SPLIT and its clip paths: red below level, ink
 * above, so distance from par is still the story. Stroke and fill answer
 * different questions and that is intended.
 *
 * OVERTURNED: the old comment claimed this chart matched the friends tile
 * exactly ("one fill, one meaning, across both surfaces"). THAT CLAIM IS NOW
 * FALSE — the friends tile still draws a single level-par split stroke, this
 * chart grades its stroke per hole. Do not restore the parity claim.
 *
 * RED IS EARNED: a round that never went under par draws no under-par fill. The
 * graded stroke may still show birdie red on a hole in such a round, because a
 * birdie happened.
 *
 * THE FIELD LINE IS NOT DRAWN (§0.2). THE REASON IS GEOMETRY, NOT TASTE: the
 * y-scale used to pool both series, the field's cumulative to-par reaches around
 * +8 over eighteen holes, and a -1 round travels between -2 and 0 — so the
 * subject of the sheet got about a fifth of the plot height and could not move.
 * Saturating a line that cannot travel changes nothing. THE FIELD IS NOT DELETED
 * AS DATA: it moves to the scrub readout, where the comparison is actually
 * decided per hole, and the sheet still carries it in prose and in the hero.
 *
 * Beads mark ONLY an ace or an albatross (BRIEF_ROUND_CURVE_BEADS_GOLD_ONLY).
 * Every other outcome is carried by the graded stroke. The rule lives in
 * beadForScore, which THIS component shares with the Discover tile's
 * useRoundHoleShapes — the Clubhouse feed is not a separate consumer, because
 * feed/PostRoundCard renders this very component.
 *
 * The to-par tokens come from `tourhub/_shared/tokens` so a member card and a
 * tour card colour the same score identically. Course difficulty (red harder /
 * green easier) is a different semantic surface and is not used here.
 */

/**
 * SURFACE TOKENS (BRIEF_TRAJECTORY_CONTINUITY_AND_REUSE §2.3). The component
 * used to hardcode the light surface, so the dark feed card drew ink on
 * near-black. Both surfaces now come from one map and `surface` defaults to
 * 'light', so every existing caller is unchanged.
 *
 * `halo` NO LONGER STROKES THE CURVE (BRIEF_ROUND_CURVE_REFINEMENT §S0.2); it
 * survives only as the PANEL colour used to ring the beads and the scrub dot.
 * IT MUST NEVER BE WHITE ON DARK — that was a real bug.
 *
 * SOLID FILL TONES, PRE-MIXED ON THE SURFACE (§2.1 / §2.4). NOT the to-par
 * colours at an alpha — a tint reads as failed, a solid tone at the same
 * lightness reads as deliberate. Opaque, so the fill never interacts with
 * whatever sits behind the card. The dark pair is derived the same way, mixed
 * on the panel colour #0B0D10 instead of white.
 */
const SURFACE_TOKENS = {
  light: {
    baseline: 'rgba(15,23,42,0.10)',
    over: A.INK,
    under: TOPAR_RED,
    halo: '#FFFFFF',
    beadStroke: '#FFFFFF',
    tickInk: A.INK,
    tickDim: A.DIM,
    rule: 'rgba(15,23,42,0.28)',
    readInk: A.INK,
    readDim: A.DIM,
    // THE GRADED STROKE's four buckets.
    gradeUnder: TOPAR_RED,
    gradeEven: TOPAR_EVEN_LIGHT,
    gradeBogey: A.MUTE,
    gradeOver: A.INK,
    // SOLID, OPAQUE. Pre-mixed on WHITE.
    fillOver: '#DEE1E6',
    fillUnder: '#EFC6C3',
  },
  dark: {
    baseline: 'rgba(255,255,255,0.18)',
    over: '#E8EDF2',
    under: '#FF6B60',
    halo: '#0B0D10',
    beadStroke: '#0B0D10',
    tickInk: 'rgba(255,255,255,0.82)',
    tickDim: 'rgba(255,255,255,0.40)',
    rule: 'rgba(255,255,255,0.34)',
    readInk: '#F4F7F9',
    readDim: 'rgba(255,255,255,0.40)',
    gradeUnder: '#FF6B60',
    gradeEven: 'rgba(255,255,255,0.40)',
    gradeBogey: 'rgba(255,255,255,0.68)',
    gradeOver: '#E8EDF2',
    // SOLID, OPAQUE. Pre-mixed on the PANEL #0B0D10, same lightness step the
    // light pair takes off white. NEVER the light values on dark.
    fillOver: '#31353C',
    fillUnder: '#3C2225',
  },
} as const;


export interface TrajectoryHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  /** Optional field average for the hole. Read PER HOLE in the scrub readout. */
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
  /**
   * THE SCRUB MUST NOT SHIP TO THE FEED (§1): a drag target inside a vertically
   * scrolling feed steals the scroll. Default FALSE; only the scorecard sheet
   * passes true.
   */
  interactive?: boolean;
  /**
   * Hole-number tick row. Default TRUE (feed card + sheet). The Discover
   * friends tile is 34px tall and has its own meta row, so it passes false —
   * the CURVE is identical either way.
   */
  showTicks?: boolean;
  /**
   * Vertical breathing room INSIDE the plot, in px per side. Default 10 (feed
   * card + sheet, where the band is 150px tall). The Discover friends tile is
   * 60px and sits flush under the photograph, so 10 + 10 ate a third of the
   * band and read as dead space: it passes 5.
   */
  padY?: number;
  /**
   * VIEWBOX WIDTH, in px (CORRECTION_SHEET_TRACE_HEIGHT §4). The svg scales its
   * viewBox UNIFORMLY, so a 340-wide viewBox rendered into a 96px column shrank
   * the vertical axis to 28% too — every round drew a near-flat line whatever
   * its range. Narrow callers pass their OWN pixel width so the scale is 1:1 and
   * the height they asked for is the height they get. Beads and strokes stay
   * circular and true-width because the aspect is never distorted.
   */
  viewWidth?: number;
}


let uidSeq = 0;

interface Pt {
  pos: number;
  cum: number;
}

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const fmtRel = (n: number) =>
  n === 0 ? 'E' : n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`;

export const TrajectoryLine: React.FC<Props> = ({
  holes,
  height = 150,
  surface = 'light',
  interactive = false,
  showTicks = true,
  padY = 10,
  viewWidth = 340,
}) => {
  const T = SURFACE_TOKENS[surface];
  const { t } = useTranslation(['courses']);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  /**
   * X IS DERIVED FROM HOLE POSITION, NOT ARRAY INDEX INTO A FILTERED LIST
   * (§3.3). A hole with no value keeps its slot and the line BREAKS there — two
   * segments, no bridge, no interpolation.
   *
   * Position 0 is the tee (level par); the hole at array index i sits at
   * position i + 1, and is NOT selectable by the scrub.
   */
  const model = useMemo(() => {
    const m = holes.length;
    const segments: Pt[][] = [];
    const beads: { pos: number; cum: number; tone: string; r: number }[] = [];
    /** pos -> { d, cum } for every SCORED hole. Drives the gradient + readout. */
    const scored = new Map<number, { d: number; cum: number }>();
    let cumYou = 0;
    let lastScored = 0;
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
        return;
      }

      const d = (h.strokes as number) - (h.par as number);
      cumYou += d;
      lastScored = pos;
      if (!current) current = [];
      current.push({ pos, cum: cumYou });
      scored.set(pos, { d, cum: cumYou });

      // The bead rule lives in beadForScore and nowhere else. It was filtered
      // here once, when the two call sites wanted different thresholds; they no
      // longer do, and a shared function whose meaning depends on its caller is
      // not a shared function.
      const bead = beadForScore(h.strokes, h.par, surface);
      if (bead) beads.push({ pos, cum: cumYou, tone: bead.tone, r: bead.radius });
    });
    if (current && current.length >= 2) segments.push(current);

    return { m, segments, beads, scored, lastScored, finalToPar: cumYou };
  }, [holes, surface]);

  const { m, segments, beads, scored, lastScored, finalToPar } = model;
  const allPts = segments.flat();

  const beatField = useMemo(() => {
    const pool = holes.filter(
      (h) => h.fieldAvg != null && h.strokes != null && (h.strokes as number) > 0,
    );
    if (pool.length < 2) return null;
    return pool.filter((h) => (h.strokes as number) <= (h.fieldAvg as number)).length;
  }, [holes]);

  if (m < 2 || allPts.length < 2) return null;

  const w = viewWidth;
  const padX = 0;

  /**
   * THE SCALE IS THE PLAYER'S OWN RANGE AND ZERO (§2). The field term is gone
   * unconditionally. Zero stays in the pool: level par must remain on the chart
   * even for a round entirely over or under it, because the fill and the
   * earned-red rule both reference it.
   */
  const all = [...allPts.map((p) => p.cum), 0];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(max - min, 1);

  // RED IS EARNED, NOT RESERVED — same rule as the friends tile.
  const wentUnder = min < 0;

  const x = (pos: number) => padX + (pos / m) * (w - padX * 2);
  const y = (v: number) => padY + ((max - v) / span) * (height - padY * 2);
  const zeroY = y(0);

  const toPts = (seg: Pt[]) => seg.map((p) => ({ x: x(p.pos), y: y(p.cum) }));
  /* THE SHARED TANGENT CUBIC (tension 0.25), the same helper HcpStrip and
     RoundShape use. It PASSES THROUGH EVERY POINT and a flat run of pars draws
     flat; a basis spline does not interpolate and would draw a member under par
     on a hole they bogeyed. */
  const lineDs = segments.map((seg) => smoothPath(toPts(seg)));
  // THE FILL IS BUILT FROM THE SMOOTHED PLAYER PATH, one closed shape per
  // segment — never from a straight-edged copy, or the fill's corners poke
  // through the smoothed stroke.
  const fillDs = segments.map((seg, i) => {
    const pts = toPts(seg);
    return `${lineDs[i]} L${pts[pts.length - 1].x.toFixed(2)},${zeroY.toFixed(2)} L${pts[0].x.toFixed(2)},${zeroY.toFixed(2)} Z`;
  });

  const uid = `traj-${(uidSeq = (uidSeq + 1) % 100000)}`;
  const clipAbove = `${uid}-ca`;
  const clipBelow = `${uid}-cb`;
  const gradStroke = `${uid}-gs`;

  const gradeFor = (d: number) =>
    d <= -1 ? T.gradeUnder : d === 0 ? T.gradeEven : d === 1 ? T.gradeBogey : T.gradeOver;

  /**
   * ONE STOP PER HOLE at its segment MIDPOINT, linearly interpolated. The
   * colour is now an IMPRESSION of how the round went, not a per-hole reading —
   * a hole's grade is pure at one point and blends into both neighbours. That is
   * a deliberate trade: the scorecard grid below carries the hole-by-hole truth,
   * and this curve is read at a glance. DO NOT 'restore' hard stops.
   *
   * STOP PLACEMENT IS STILL LOAD-BEARING. Hole i owns the SEGMENT pts[i-1] to
   * pts[i] — position i is the cumulative AFTER hole i — and the midpoint is
   * computed from those two. A blend placed on the wrong segment is the old
   * off-by-one bug with soft edges. NO EPSILON, NO COINCIDENT STOPS: adjacent
   * stops at different offsets interpolate, which is the point.
   * A GAP (unplayed hole) simply widens the blend across it — the line there
   * crosses unplayed ground and has no grade of its own.
   */
  const strokeStops = (() => {
    const positions = [...scored.keys()].sort((a, b) => a - b);
    const out: { offset: number; color: string }[] = [];
    positions.forEach((pos, i) => {
      const c = gradeFor(scored.get(pos)!.d);
      // padX is 0, so x(0) === 0: the first scored hole runs from the tee.
      const from = i === 0 ? 0 : x(positions[i - 1]);
      // ANCHOR at offset 0 with the first hole's colour, so the left end does
      // not fade to nothing.
      if (i === 0) out.push({ offset: 0, color: c });
      out.push({ offset: (from + x(pos)) / 2 / w, color: c });
    });
    // ANCHOR at offset 1 with the last hole's colour, same reason.
    const last = out[out.length - 1];
    if (last) out.push({ offset: 1, color: last.color });
    return out;
  })();



  // TICKS INDEX `holes` — the leading point is not a hole, so every tick
  // resolves to holes[i].holeNo (1 / 5 / 10 / 14 / 18 on a full round).
  const ticks = [...new Set([0, Math.floor(m / 4), Math.floor(m / 2), Math.floor((3 * m) / 4), m - 1])];

  const hovered = hover != null ? holes[hover - 1] : null;
  const hoveredScored = hover != null ? scored.get(hover) ?? null : null;

  const pick = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return;
    const frac = (clientX - r.left) / r.width;
    // NEAREST HOLE, CLAMPED 1..m. Position 0 is the tee and is not a hole.
    const pos = Math.min(m, Math.max(1, Math.round(frac * m)));
    setHover(pos);
  };

  const plot = (
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
        {/* THE GRADED STROKE — userSpaceOnUse so the offsets are fractions of the
            PLOT, not of the path's bounding box. */}
        <linearGradient id={gradStroke} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={w} y2={0}>
          {strokeStops.map((s, i) => (
            <stop key={i} offset={`${(s.offset * 100).toFixed(4)}%`} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>

      {/* THE FILL IS ONE SOLID OPAQUE TONE, to the level line. No gradient, no
          fillOpacity, no rgba. THE LEVEL-PAR SPLIT KEEPS ITS STRUCTURE: each
          side of zero takes its own solid tone through its own clip, and RED IS
          EARNED — the under-par tone only appears when the round went under. */}
      {fillDs.map((d, i) => (
        <g key={`fill-${i}`}>
          <path d={d} fill={T.fillOver} stroke="none" clipPath={`url(#${clipAbove})`} />
          {wentUnder && (
            <path d={d} fill={T.fillUnder} stroke="none" clipPath={`url(#${clipBelow})`} />
          )}
        </g>
      ))}

      {/* level par — unconditional: the fill and the earned-red rule both
          reference it. */}
      <line
        x1={padX}
        x2={w - padX}
        y1={zeroY}
        y2={zeroY}
        stroke={T.baseline}
        strokeWidth={1}
        strokeDasharray="3 4"
      />

      {/* No halo. It existed so a 2.4px stroke read on top of a graduated fill.
          At 1.8px over a SOLID flat fill there is nothing to separate from, and
          a 5px halo under a thin line reads as a glow. If a halo is ever
          reintroduced it must be the PANEL colour, never white on dark — that
          was a real bug. */}

      {/* the player, graded per hole */}
      {lineDs.map((d, i) => (
        <path
          key={`line-${i}`}
          d={d}
          fill="none"
          stroke={`url(#${gradStroke})`}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
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

      {/* THE SCRUB MARKER — rule plus a point on the curve, gone on release. */}
      {hover != null && (
        <g>
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={0}
            y2={height}
            stroke={T.rule}
            strokeWidth={1}
          />
          {hoveredScored && (
            <circle
              cx={x(hover)}
              cy={y(hoveredScored.cum)}
              r={4}
              // The dot is graded per HOLE (stroke against par). The figure is a
              // RUNNING to-par total, so its tone is computed separately. Do NOT
              // merge these two rules; each quantity is coloured by its own logic.
              fill={gradeFor(hoveredScored.d)}
              stroke={T.halo}
              strokeWidth={1.5}
            />
          )}
        </g>
      )}
    </svg>
  );

  /* ---------------------------------------------------------- value row */

  // TONE FOR A RUNNING TO-PAR TOTAL: shared by the resting final figure and the
  // hovered cumulative figure. The dot above still uses gradeFor(hole.d) because
  // the dot marks a single stroke; the figure tracks the cumulative curve.
  const toneForCum = (cum: number) =>
    cum < 0 ? T.under : cum === 0 ? T.gradeEven : T.over;

  const figure = hoveredScored ? fmtRel(hoveredScored.cum) : fmtRel(finalToPar);
  const figureTone = hoveredScored
    ? toneForCum(hoveredScored.cum)
    : toneForCum(finalToPar);

  const subParts: string[] = [];
  if (hover != null && hovered) {
    subParts.push(t('courses:scorecard.trajHole', { n: hovered.holeNo }));
    if (hovered.par != null) subParts.push(t('courses:scorecard.trajPar', { n: hovered.par }));
    // NEVER print a field figure for a hole with no fieldAvg — omit the segment.
    if (hovered.fieldAvg != null) {
      subParts.push(t('courses:scorecard.trajField', { n: fmt1(hovered.fieldAvg) }));
    }
  } else {
    subParts.push(t('courses:scorecard.trajThrough', { n: lastScored }));
  }

  // rightText is a whole-round fact; it deliberately empties during a scrub.
  const rightText =
    beatField != null
      ? t('courses:scorecard.trajBeatField', { n: beatField })
      : '';

  if (!interactive) {
    return (
      <>
        {plot}
        {showTicks && <TickRow ticks={ticks} holes={holes} m={m} x={x} w={w} T={T} />}
      </>
    );
  }


  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...NUM, fontSize: 26, lineHeight: 1.05, color: figureTone }}>{figure}</div>
          <div style={{ ...LABEL, ...FIGS, fontSize: 8.5, color: T.readDim, marginTop: 3 }}>
            {subParts.join(' \u00B7 ')}
          </div>
        </div>
        {!!rightText && (
          <div style={{ ...LABEL, ...FIGS, fontSize: 8.5, color: T.readInk, textAlign: 'right', flexShrink: 0 }}>
            {rightText}
          </div>
        )}
      </div>

      <div
        ref={wrapRef}
        role="img"
        aria-label={t('courses:scorecard.trajAria', { n: fmtRel(finalToPar) })}
        style={{ touchAction: 'pan-y', cursor: 'crosshair' }}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'mouse') pick(e.clientX);
        }}
        onPointerUp={() => setHover(null)}
        onPointerCancel={() => setHover(null)}
        onPointerLeave={() => setHover(null)}
      >
        {plot}
      </div>

      <TickRow ticks={ticks} holes={holes} m={m} x={x} w={w} T={T} />
    </>
  );
};

/**
 * TICK LABELS SIT UNDER THEIR OWN POINTS (§7). space-between put five labels at
 * 0/25/50/75/100%, while their holes sit at pos/m — hole 1's label landed ~19px
 * left of hole 1. Each label is now positioned at the SAME x() the curve uses,
 * translated back by half its width, clamped away from the container edges.
 */
const TickRow: React.FC<{
  ticks: number[];
  holes: TrajectoryHole[];
  m: number;
  x: (pos: number) => number;
  w: number;
  T: typeof SURFACE_TOKENS['light'] | typeof SURFACE_TOKENS['dark'];
}> = ({ ticks, holes, m, x, w, T }) => (
  <div
    style={{
      position: 'relative',
      height: 12,
      margin: '2px 0 0',
    }}
  >
    {ticks.map((i) => {
      const frac = x(i + 1) / w;
      const edgeLeft = frac <= 0.02;
      const edgeRight = frac >= 0.98;
      return (
        <span
          key={i}
          style={{
            position: 'absolute',
            /* ONE X-SCALE (BRIEF_SCORECARD_CHART_ALIGNMENT §3). The plot and
               this row are now the SAME width everywhere, so a label is simply
               its own fraction of the row — no 32px remap. That remap was the
               uneven spacing: it shifted every interior label ~16px left, which
               opened 1→5 and closed 14→18. Edge labels still pin inside the row
               so hole 18 cannot hang off the card. */
            left: edgeLeft ? 0 : edgeRight ? '100%' : `${(frac * 100).toFixed(3)}%`,
            transform: edgeLeft ? 'none' : edgeRight ? 'translateX(-100%)' : 'translateX(-50%)',

            ...LABEL,
            ...FIGS,
            fontSize: 8.5,
            color: i === m - 1 ? T.tickInk : T.tickDim,
          }}
        >
          {holes[i].holeNo}
        </span>
      );
    })}
  </div>
);

export default TrajectoryLine;

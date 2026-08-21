import { useTranslation } from 'react-i18next';
import type { CSSProperties, ReactNode } from 'react';
import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { HoleShape, ShapeBead } from './hooks/useRoundHoleShapes';
import { TOPAR_RED, RAMP_TOPAR, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { TOPAR_EVEN_LIGHT } from '@/features/tourhub/_shared/tokens';
import { smoothPath } from '@/lib/charts/smoothPath';

import { A } from './tokens';

/**
 * RoundShape — THE ONE round-shape renderer for the Discover friends surfaces
 * (BRIEF_WHOS_BEEN_PLAYING_SHEET §1.5).
 *
 * Extracted VERBATIM out of FriendsPlayedRail so the see-all sheet draws the
 * SAME trace the rail tile draws instead of a second look-alike renderer. The
 * only additions are the width / height / showMeta props: the rail keeps its
 * 224x60 band and birdie meta row by DEFAULT, the sheet row asks for 96x22 with
 * no meta.
 */

const SHAPE_PAD_X = 6;

const OVER_TONE = A.INK;
const UNDER_TONE = TOPAR_RED;

/* SOLID FILL TONES, PRE-MIXED ON WHITE (BRIEF_ROUND_CURVE_REFINEMENT §2.1).
   NOT the to-par colours at an alpha — a tint reads as failed, a solid tone at
   the same lightness reads as deliberate. Opaque, so the fill never interacts
   with whatever sits behind the tile. */
const FILL_UNDER_LIGHT = '#EFC6C3'; // went under par
const FILL_OVER_LIGHT = '#DEE1E6'; // stayed over par


/**
 * THE FOUR BUCKETS (BRIEF_FRIENDS_TILE_SHAPE_AND_BUCKETS §4). Derived by
 * DIFFERENCING the cumulative series the curve is already drawn from — one
 * client-side pass over data the tile has fetched, NO new query — and coloured
 * from RAMP_TOPAR, the shared red/grey four-bucket distribution ramp. NOT the
 * blue SC_BOGEY / SC_DOUBLE scale, which belongs to the Stableford card.
 */
const BUCKET_ORDER = ['birdie', 'par', 'bogey', 'double'] as const;
type BucketKey = (typeof BUCKET_ORDER)[number];
const BUCKET_LABEL: Record<BucketKey, string> = {
  birdie: 'BIRDIE+',
  par: 'PAR',
  bogey: 'BOGEY',
  double: 'DOUBLE+',
};

function bucketsFor(series: number[]): Record<BucketKey, number> {
  const out: Record<BucketKey, number> = { birdie: 0, par: 0, bogey: 0, double: 0 };
  for (let i = 0; i + 1 < series.length; i += 1) {
    const d = series[i + 1] - series[i];
    if (d <= -1) out.birdie += 1;
    else if (d === 0) out.par += 1;
    else if (d === 1) out.bogey += 1;
    else out.double += 1;
  }
  return out;
}

export function RoundShape({
  row,
  shape,
  width = 224,
  height = 60,
  showMeta = true,
  showBaseline = true,
  strokeWidth = 1.8,
}: {
  row: CircleRoundRow;
  shape: HoleShape | null;
  /** Viewport width of the trace. Rail tile 224; sheet row 96. */
  width?: number;
  /** Band height. Rail tile 60; sheet row 22. */
  height?: number;
  /** The meta row (bar + bucket counts) and the to-par figure. Rail only. */
  showMeta?: boolean;
  /**
   * The dashed level-par rule (§2). Default TRUE. The hole-series path renders
   * TrajectoryLine, which has drawn this rule unconditionally since
   * BRIEF_SCORECARD_TRAJECTORY_WHOOP; the flag governs the three-point fallback,
   * where the rule was computed to clip the fill and never drawn.
   */
  showBaseline?: boolean;
  /** Curve stroke. 1.8 by default; the rail tile passes 1.6 now that the
   *  MiniScorecard beneath it carries the hole-by-hole detail (§S2.2). */
  strokeWidth?: number;
}) {

  const front = row.front_nine_to_par;
  const back = row.back_nine_to_par;

  let values: number[] | null = null;
  let beads: ShapeBead[] = [];
  let holesPlayed: number | null = null;

  if (shape) {
    values = shape.series;
    beads = shape.beads;
    holesPlayed = shape.played;
  } else if (
    front != null &&
    back != null &&
    Number.isFinite(front) &&
    Number.isFinite(back)
  ) {
    values = [0, front, front + back];
  }

  if (!values || values.length < 2) return null;

  /* THE BUCKETS AND THE CHROME ARE SHARED BY BOTH PATHS. A tile with no hole
     data (the three-point fallback) gets NEITHER the bar NOR the count line —
     there is nothing to count — so its meta row stays exactly as today. */
  const buckets = shape ? bucketsFor(shape.series) : null;



  const withChrome = (plot: ReactNode) => (
    <>
      <div style={{ position: 'relative' }}>
        {plot}
        {/* NO TO-PAR LABEL ON THE BAND (BRIEF_ROUND_TILE_GLASS_CHIP §S1.1). It
            restated the score chip's own figure and competed for the top-right
            corner with an over-par curve's endpoint. The chip on the photograph
            is the single statement of the round's to-par. */}
      </div>

      {showMeta && buckets && <BucketBar buckets={buckets} />}
      {showMeta && shape && <ShapeMeta buckets={buckets} />}
    </>
  );

  /* ONE CHART, THREE SURFACES. When the hole-by-hole data is present the tile
     renders THE SAME TrajectoryLine the Clubhouse scorecard post and the
     scorecard sheet render — same grades, same solid fill, same bead filter,
     same 1.8px stroke and no halo — instead of a look-alike maintained here.
     Ticks are suppressed: the band carries its own meta row. */
  if (shape) {
    return withChrome(
      <TrajectoryLine
        holes={shape.holes}
        height={height}
        surface="light"
        showTicks={false}
        padY={1}
        /* THE VIEWBOX MATCHES THE COLUMN (CORRECTION_SHEET_TRACE_HEIGHT §4):
           at 96px wide a 340-wide viewBox scaled the whole chart to 28%, so a
           38px band drew as an 11px flat squiggle and a -3 looked like a +14.
           1:1 units mean the band is used in full and the beads stay round. */
        viewWidth={width}
        strokeWidth={strokeWidth}
      />,
    );
  }



  // A round that never went under par gets NO red treatment. The cumulative
  // series STARTS at level by construction, so zero is already in the domain;
  // the old clamp only added a dead pink band below it.
  const wentUnder = Math.min(...values) < 0;

  const top = 7;
  const bottom = height - 7;

  // When the round never went under, the scale uses the full band and a small
  // symmetric floor for breathing room. When it did go under, the scale still
  // keeps zero in the domain so the split line is meaningful.
  let lo: number;
  let hi: number;
  if (wentUnder) {
    lo = Math.min(0, ...values) - 0.7;
    hi = Math.max(0, ...values) + 0.7;
  } else {
    lo = Math.min(...values) - 0.7;
    hi = Math.max(...values) + 0.7;
  }
  const span = Math.max(hi - lo, 2);

  // MORE OVER PAR IS HIGHER: the larger value maps to the SMALLER y.
  const yFor = (v: number) => bottom - ((v - lo) / span) * (bottom - top);
  const zeroY = wentUnder ? yFor(0) : 0;
  /* §2 THE LEVEL-PAR RULE'S y. ONE derivation, reused — the clip uses zeroY and
     the rule uses this, both out of yFor(0). The cumulative series starts at 0
     by construction, so zero is ALWAYS inside the domain; the clamp is a guard,
     not a live case. */
  const baselineY = Math.min(height - 0.5, Math.max(0.5, yFor(0)));

  const innerW = width - SHAPE_PAD_X * 2;
  const pts = values.map((v, i) => ({
    x: SHAPE_PAD_X + (i / (values.length - 1)) * innerW,
    y: yFor(v),
  }));

  /* THE SHARED TANGENT CUBIC (tension 0.25). The fill path is built from THIS
     smoothed d, never from a straight-edged copy — a smoothed stroke over a
     straight fill shows the fill's corners poking through. */
  const d = smoothPath(pts);
  // THE FILL RUNS FLAT TO BOTH CARD EDGES so the colour stays full bleed,
  // while the POINTS are inset so the terminal dot cannot clip.
  const fillD = `M0,${height} L0,${pts[0].y.toFixed(2)} L${d.slice(1)} L${width},${pts[pts.length - 1].y.toFixed(2)} L${width},${height} Z`;

  // CLIP IDS MUST BE UNIQUE PER TILE — ten tiles sharing an id looks exactly
  // like the clip being ignored, and is the likeliest defect here.
  const uid = `fps-${String(row.round_id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clipAbove = `${uid}-ca`;
  const clipBelow = `${uid}-cb`;
  const gradStroke = `${uid}-gs`;

  /* ── THE HEAT-GRADED STROKE (same concept as the handicap index tile and the
     You tab's form panel, and identical grades to the scorecard sheet's
     trajectory): the LINE ITSELF carries the hole-by-hole quality, so a bad
     stretch reads deep ink and a good one reads red, instead of the whole
     curve being one flat colour split at the level line.
     Only available when the 19-point hole series is present — the three-point
     fallback has no per-hole differential to grade, so it keeps the split. */
  const gradeFor = (dh: number) =>
    dh <= -1 ? UNDER_TONE : dh === 0 ? TOPAR_EVEN_LIGHT : dh === 1 ? A.MUTE : A.INK;

  /* ONE STOP PER HOLE at its segment MIDPOINT, linearly interpolated. The
     colour is now an IMPRESSION of how the round went, not a per-hole reading —
     a hole's grade is pure at one point and blends into both neighbours. That
     is a deliberate trade: the scorecard grid below carries the hole-by-hole
     truth, and this curve is read at a glance. DO NOT 'restore' hard stops.

     STOP PLACEMENT IS STILL LOAD-BEARING. Hole i owns the SEGMENT pts[i-1] to
     pts[i] — position i is the cumulative AFTER hole i — and the midpoint is
     computed from those two points. A blend placed on the wrong segment is the
     old off-by-one bug with soft edges.
     The plot IS horizontally inset (SHAPE_PAD_X), so the offset-0 anchor and
     the offset-1 anchor STAY, or the padded ends fade to nothing. */
  const strokeStops = (() => {
    if (!shape) return null;
    const out: { offset: number; color: string }[] = [];
    for (let i = 1; i < values.length; i += 1) {
      const c = gradeFor(values[i] - values[i - 1]);
      if (i === 1) out.push({ offset: 0, color: c });
      out.push({ offset: (pts[i - 1].x + pts[i].x) / 2 / width, color: c });
    }
    if (out.length > 0) out.push({ offset: 1, color: out[out.length - 1].color });
    return out;
  })();




  return withChrome(
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
        aria-hidden
      >
        <defs>
          {wentUnder && (
            <>
              <clipPath id={clipAbove}>
                <rect x={0} y={0} width={width} height={Math.max(zeroY, 0)} />
              </clipPath>
              <clipPath id={clipBelow}>
                <rect x={0} y={zeroY} width={width} height={Math.max(height - zeroY, 0)} />
              </clipPath>
            </>
          )}
          {strokeStops && (
            <linearGradient
              id={gradStroke}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={width}
              y2={0}
            >
              {strokeStops.map((st, i) => (
                <stop key={i} offset={`${(st.offset * 100).toFixed(4)}%`} stopColor={st.color} />
              ))}
            </linearGradient>
          )}
        </defs>

        {/* THE FILL IS ONE SOLID OPAQUE TONE — no gradient, no fillOpacity.
            THE LEVEL-PAR SPLIT KEEPS ITS STRUCTURE: each side of zero takes its
            own solid tone through its own clip. RED IS EARNED — the under-par
            tone only appears when the round actually went under. */}
        {wentUnder ? (
          <>
            <g clipPath={`url(#${clipAbove})`}>
              <path d={fillD} fill={FILL_OVER_LIGHT} />
            </g>
            <g clipPath={`url(#${clipBelow})`}>
              <path d={fillD} fill={FILL_UNDER_LIGHT} />
            </g>
          </>
        ) : (
          <path d={fillD} fill={FILL_OVER_LIGHT} />
        )}

        {/* §2 THE LEVEL-PAR RULE, NOW UNCONDITIONAL. The curve's whole colour
            rule is "below this line red, above it ink"; on a round that never
            went under there is no red at all, so without the rule the drawing
            has no reference point. Behind the stroke and behind the beads —
            never the top layer. */}
        {showBaseline && (
          <line
            x1={0}
            x2={width}
            y1={baselineY}
            y2={baselineY}
            stroke={A.HAIRLINE}
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* No halo. It existed so a 2.4px stroke read on top of a graduated
            fill. At 1.8px over a SOLID flat fill there is nothing to separate
            from, and a 5px halo under a thin line reads as a glow. If a halo is
            ever reintroduced it must be the PANEL colour, never white on dark —
            that was a real bug. */}

        {strokeStops ? (
          /* ONE path, graded hole by hole. No clip split is needed: the colour
             already says where the round was good, and stacking a level-par
             split on top of a heat gradient would double-encode it. */
          <path
            d={d}
            fill="none"
            stroke={`url(#${gradStroke})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : wentUnder ? (
          <>
            <g clipPath={`url(#${clipAbove})`}>
              <path
                d={d}
                fill="none"
                stroke={OVER_TONE}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <g clipPath={`url(#${clipBelow})`}>
              <path
                d={d}
                fill="none"
                stroke={UNDER_TONE}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </>
        ) : (
          <path
            d={d}
            fill="none"
            stroke={OVER_TONE}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}


        {/* THE BEADS come from the SHARED beadForScore rule, positioned on the
            CUMULATIVE value AFTER the hole — identical tones and radii to the
            scorecard sheet. GOLD ONLY. Every other outcome is carried by the
            graded stroke. */}
        {beads.map((b) =>
          pts[b.i] ? (
            <circle
              key={b.i}
              cx={pts[b.i].x}
              cy={pts[b.i].y}
              r={b.r}
              fill={b.tone}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          ) : null,
        )}

        {/* NO ROUND-END MARKER. A dot where no event happened is a false
            positive — it read as a bogey on hole 18 that was never played.
            The curve simply ends, exactly as it does on the scorecard sheet.
            If hole 18 earned a bead, beadForScore already drew one above. */}

      </svg>,
  );
}

/** §4.2 THE DISTRIBUTION BAR. Sits directly under the band with a 7px gap,
 *  5px tall, bucket order birdie+ / par / bogey / double+, widths proportional
 *  to the counts, 1.5px gutters, and NO zero-width slivers. */
function BucketBar({ buckets }: { buckets: Record<BucketKey, number> }) {
  const live = BUCKET_ORDER.filter((k) => buckets[k] > 0);
  const total = live.reduce((s, k) => s + buckets[k], 0);
  if (total <= 0) return null;
  return (
    <div style={{ padding: '7px 11px 0' }}>
      <div style={{ display: 'flex', gap: 1.5, height: 5 }}>
        {live.map((k) => (
          <div
            key={k}
            style={{
              flexGrow: buckets[k],
              flexBasis: 0,
              background: RAMP_TOPAR[k],
              borderRadius: 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * THE META ROW carries the four-bucket count line (§4.3). It replaced the
 * suppressed "X birdies" text, spending exactly the height that div was already
 * holding open — which is why this addition costs the card almost nothing.
 * A zero count takes A.DIM rather than its bucket colour: nothing happened.
 */
function ShapeMeta({ buckets }: { buckets: Record<BucketKey, number> | null }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
        padding: '4px 11px 0',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {buckets &&
        BUCKET_ORDER.map((k) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
            <span
              style={{
                fontSize: 7.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: A.DIM,
              }}
            >
              {BUCKET_LABEL[k]}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                ...FIGS,
                color: buckets[k] > 0 ? RAMP_TOPAR[k] : A.DIM,
              }}
            >
              {buckets[k]}
            </span>
          </span>
        ))}
    </div>
  );
}

/* ===========================================================================
   THE MINI SCORECARD (BRIEF_ROUND_TILE_MINI_SCORECARD) — the Clubhouse card's
   grid at rail scale: two rows of nine, hole numbers above each cell, and per
   nine a HEADER LINE carrying the label left and the nine's total + to-par right
   (BRIEF_MINI_SCORECARD_NINE_HEADER), ported from CardScorecardSheet. The cells
   own their row outright, which is where their width came from.


   PAR IS NOT PRINTED. The MARKER is the par statement — circle birdie, box
   bogey, double box double-or-worse — so a par row would be the same fact
   twice. The full Clubhouse card prints par because it has the room and because
   it IS a scorecard; this is a summary.

   NO SCORING KEY: the shapes are conventional to golfers and a rail tile has no
   room for a legend.
   =========================================================================== */

/* THE MINI GRID'S OWN INK, from BRIEF_ROUND_TILE_LIGHT_REFINEMENT §S2. ONE
   genuinely dark ink and greys that are clearly different from each other, not
   four middling greys. The under-par red DEEPENS to #C8102E and the ace gold to
   #C99700: the previous values (SC_FILL_BIRDIE / SC_FILL_GOLD) were tuned
   against a near-white panel and go weak on the tinted well.

   LOCAL to this grid, which only the Discover round tile renders — the
   Clubhouse scorecard sheet keeps its own tokens untouched. */
const MINI_INK = '#0B0F14';
const MINI_FAINT = '#9AA5B1';
const MINI_GHOST = '#C8D0D8';
const ACE_GOLD = '#C99700';
const UNDER_INK = '#C8102E';

/** The surface the grid sits on. NO TINT: it is the white card, and the marker
 *  outer rings trace against exactly that, so a ring reads as clear air. */
export const MINI_WELL = '#FFFFFF';

/** §S1.3 — the Clubhouse card's own key, not a second vocabulary. */
type Marker = 'ace' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double';

function markerFor(strokes: number | null, par: number | null): Marker | null {
  if (strokes == null || !Number.isFinite(strokes)) return null;
  if (strokes === 1) return 'ace';
  if (par == null) return 'par';
  const d = strokes - par;
  if (d <= -2) return 'eagle';
  if (d === -1) return 'birdie';
  if (d === 0) return 'par';
  if (d === 1) return 'bogey';
  return 'double';
}

/** THE DOUBLE RING IS DRAWN INSET (BRIEF_ROUND_TILE_MARK_AND_FIGURE §2). It used
 *  to be an OUTWARD box-shadow — `0 0 0 2px well, 0 0 0 3px c` — which painted
 *  3px past a 17px box. Box-shadow does not participate in layout, so nothing
 *  reserved that space and the hole number 2.5px above was crowded by every
 *  boxed and doubled figure. Now EVERY marker — bare, circle, box, double,
 *  eagle, ace — paints a footprint of exactly CELL x CELL: the outer ring is the
 *  1px BORDER at the box edge, then a 1px spacer inboard of it, then the inner
 *  ring. Both are inset shadows, so the cell can never paint outside itself.
 *
 *  THE SPACER TAKES THE SURFACE COLOUR the cell sits on, so it never haloes:
 *  pass the card or sheet background in, never a fixed grey
 *  (BRIEF_ROUND_TILE_THE_MOMENT v2 §S4.7 — on a tinted well a WHITE ring
 *  haloes). §S4.7 IS NEWLY LOAD-BEARING: a cell INSIDE a moment band must be
 *  passed the BLENDED well (the tone composited over the well at the band's
 *  opacity), or its spacer draws the plain well against a tinted background —
 *  a pale halo inside the ring, which is the exact fault §S4.7 prevents. See
 *  bandWell in NineRow.
 *
 *  IT TAKES NO MOMENT TONE (BRIEF_ROUND_MOMENTS_V3 §1). It used to accept
 *  `markTone` and thread it into every branch as the outer ring, which made a
 *  marked par byte-for-byte identical to an eagle — and on an in-red round in
 *  the identical colour, because the in-red tone and the under-par ink are the
 *  same string. A marked birdie read as an eagle, a marked bogey as a double,
 *  and a marked ace drew a gold border inside a red ring.
 *
 *  A SCORE MARKER IS A CLOSED SHAPE AROUND THE DIGIT; A MOMENT NEVER DRAWS ONE,
 *  IN ANY TONE, ON ANY HOLE. The moment is a RULE BENEATH the cells instead
 *  (§4), drawn in NineRow. Do not reintroduce a tone parameter here. */
function markerStyle(m: Marker | null, well: string): CSSProperties {
  const base: CSSProperties = {
    width: CELL,
    height: CELL,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    flexShrink: 0,
    color: MINI_INK,
  };
  /* INSET: 1px of `well` as the spacer, then 1px of the ring colour, both
     INSIDE the 17x17 box. The BORDER is the outer ring. */
  const ring = (c: string) => `inset 0 0 0 1px ${well}, inset 0 0 0 2px ${c}`;
  switch (m) {
    case 'ace':
      return { ...base, borderRadius: 999, border: `1px solid ${ACE_GOLD}`, color: ACE_GOLD, boxShadow: ring(ACE_GOLD) };
    case 'eagle':
      return { ...base, borderRadius: 999, border: `1px solid ${UNDER_INK}`, color: UNDER_INK, boxShadow: ring(UNDER_INK) };
    case 'birdie':
      return { ...base, borderRadius: 999, border: `1px solid ${UNDER_INK}`, color: UNDER_INK };
    case 'bogey':
      return { ...base, borderRadius: 2, border: `1px solid ${MINI_INK}` };
    case 'double':
      return { ...base, borderRadius: 2, border: `1px solid ${MINI_INK}`, boxShadow: ring(MINI_INK) };
    default:
      /* PAR IS BARE INK — no ring, no box, no tint, MARKED OR NOT. The baseline
         recedes. */
      return base;
  }
}


/* =============================================================================
   PIN THE GAP, NOT THE CELL (BRIEF_ROUND_TILE_LIGHT_REFINEMENT §S3.1–§S3.3).

   The row used to be nine equal columns across the inner width, so the EDGE
   margin was whatever the division left over and could reach zero — which is
   why markers kept clipping. Now the markers are a FIXED 17px, the gaps a FIXED
   9px, and the row is CENTRED: the edge margin is the remainder and can never
   vanish.

   MEASURED AT 244px WELL INNER WIDTH:

     gap    row width   edge margin   clear air between two DOUBLES
      8px     217px       13.5px            2.4px
      9px     225px        9.5px            3.4px   <- chosen
     10px     233px        5.5px            4.4px

   THE DOUBLE BOX IS THE ONLY CONSTRAINT THAT MATTERS. It paints its outer ring
   2.8px OUTSIDE its own footprint on each side, so two adjacent doubles eat
   5.6px of any gap and a LEADING double eats 2.8px of the edge margin. Any
   layout that spaces on NOMINAL width rather than RENDERED width fails on that
   case: at gap 10 a leading double sits 2.7px from the edge, which is the fault
   being fixed here. Do not "recover" width by widening the gap. */
const CELL = 17;
const GAP = 9;
/** THE SPACE BETWEEN THE TWO NINES. 8, not 4: the band drops 3px below the cell
 *  row, and 8 keeps 5px clear of the IN nine's header line. */
const NINE_GAP = 8;

/* =============================================================================
   THE MOMENT'S MARK IS A TINTED BAND BEHIND THE CELLS
   (BRIEF_ROUND_TILE_MARK_AND_FIGURE §3 — reference view "B", rings inset).

   THE 2px UNDERLINE IS DELETED. Ben chose the band over it, over end caps and
   over no mark at all. THE REASON A BAND AND NOT A RULE: a SINGLE-HOLE group is
   a normal case — a birdie haul is scattered by nature — and a lone tinted
   square reads as deliberate where a lone 2px dash reads as a typo.

   IT IS GROUPED BY CONSECUTIVE RUN WITHIN A NINE and NEVER crosses the OUT / IN
   boundary: holes 9 and 10 are on different rows, so a run spanning them draws
   two bands. It sits BEHIND everything — never over a marker, a digit or a hole
   number — and it is absolutely positioned, so it adds NO height to the row.

   A MOMENT STILL NEVER DRAWS A CLOSED SHAPE AROUND A DIGIT (§S5.3): markerStyle
   takes no tone, and the band is behind the cell rather than on it. */
/** Start at 13% (§3.3). Any lower and the run tone disappears on the well. */
const BAND_ALPHA = 0.13;
/** 2px above the cell, 3px below it (§3.3). */
const BAND_ABOVE = 2;
const BAND_BELOW = 3;
const BAND_RADIUS = 4;
/** The hole number's own box: 7px of line, then its 2.5px margin. The band's top
 *  edge sits BAND_ABOVE above the cell, so the clearance to the number's box is
 *  2.5 - BAND_ABOVE = 0.5px, and to the rendered glyph ~1.5px. */
const NUM_BLOCK = 7 + 2.5;

/** Composite a hex tone over a hex surface at `alpha` — the BLENDED WELL (§3.4).
 *  A cell inside a band is handed this instead of the plain well so its 1px
 *  spacer matches the tint behind it. */
function blend(tone: string, surface: string, alpha: number): string {
  const hex = (h: string) => {
    const v = h.replace('#', '');
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const a = hex(tone);
  const b = hex(surface);
  const mix = a.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)));
  return `#${mix.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Consecutive runs of marked holes WITHIN one nine, as [startIndex, length]. */
function bandRuns(
  marked: ReadonlySet<number> | undefined,
  from: number,
  to: number,
): Array<{ start: number; len: number }> {
  if (!marked || marked.size === 0) return [];
  const runs: Array<{ start: number; len: number }> = [];
  for (let holeNo = from; holeNo <= to; holeNo += 1) {
    if (!marked.has(holeNo)) continue;
    const last = runs[runs.length - 1];
    if (last && last.start + last.len === holeNo - from) last.len += 1;
    else runs.push({ start: holeNo - from, len: 1 });
  }
  return runs;
}

function nineTotals(holes: HoleShape['holes'], from: number, to: number) {
  let strokes = 0;
  let toPar = 0;
  let any = false;
  for (const h of holes) {
    if (h.holeNo < from || h.holeNo > to) continue;
    if (h.strokes == null) continue;
    any = true;
    strokes += h.strokes;
    if (h.par != null) toPar += h.strokes - h.par;
  }
  return any ? { strokes, toPar } : null;
}

function NineRow({
  holes,
  from,
  to,
  label,
  well,
  marked,
  momentTone,
}: {
  holes: HoleShape['holes'];
  from: number;
  to: number;
  label: string;
  well: string;
  /** The moment's OWN holes. They get a TINTED BAND BEHIND the cell (§3) — never
   *  a ring, a border or a tint ON the cell itself (§S5.3). */
  marked?: ReadonlySet<number>;
  /** The moment tone, used ONLY for that band and its blended well. */
  momentTone?: string;
}) {
  const byHole = new Map(holes.map((h) => [h.holeNo, h]));
  const bandTone = marked && marked.size > 0 ? momentTone : undefined;
  const bandWell = bandTone ? blend(bandTone, well, BAND_ALPHA) : undefined;
  const totals = nineTotals(holes, from, to);
  const rel =
    totals == null ? '' : totals.toPar === 0 ? 'E' : totals.toPar > 0 ? `+${totals.toPar}` : `\u2212${Math.abs(totals.toPar)}`;

  return (
    <div>
      {/* THE NINE HEADER STAYS as ported from CardScorecardSheet's totals line
          (§S3.4): the caps label left, the nine's gross and its to-par right, on
          its own line above the cells. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 6,
          marginBottom: 2,
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: MINI_FAINT,
          }}
        >
          {label}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: MINI_INK, ...FIGS }}>
            {totals?.strokes ?? ''}
          </span>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              color: totals && totals.toPar < 0 ? UNDER_INK : MINI_FAINT,
              ...FIGS,
            }}
          >
            {rel}
          </span>
        </span>
      </div>

      {/* FIXED CELLS, FIXED GAPS, CENTRED ROW (§S3.2). NOT space-between: the
          edge margin must be the remainder, not the leftovers of a division. */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {/* THE STRIP IS ITS OWN POSITIONING CONTEXT so the bands can be measured
            in cells and gaps rather than guessed from the well's width. */}
        <div style={{ position: 'relative', display: 'flex', gap: GAP }}>
        {/* THE BANDS, BEHIND EVERYTHING (§3.3). One per consecutive run within
            this nine; a single-hole run is one cell wide, which is intended. */}
        {bandTone
          ? bandRuns(marked, from, to).map(({ start, len }) => (
              <span
                key={`band-${start}`}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: start * (CELL + GAP),
                  width: (len - 1) * (CELL + GAP) + CELL,
                  top: NUM_BLOCK - BAND_ABOVE,
                  height: CELL + BAND_ABOVE + BAND_BELOW,
                  borderRadius: BAND_RADIUS,
                  background: bandTone,
                  opacity: BAND_ALPHA,
                  zIndex: 0,
                }}
              />
            ))
          : null}
        {Array.from({ length: to - from + 1 }, (_, i) => {
          const holeNo = from + i;
          const h = byHole.get(holeNo);
          const m = markerFor(h?.strokes ?? null, h?.par ?? null);
          const isMarked = !!marked?.has(holeNo);
          /* A CELL INSIDE A BAND IS HANDED THE BLENDED WELL (§3.4) so an inset
             ring's 1px spacer matches the tint behind it instead of haloing. */
          const cellWell = isMarked && bandWell ? bandWell : well;
          return (
            <div
              key={holeNo}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* HOLE NUMBERS STAY, at 7px in GHOST (§S3.5). Findable, not read —
                  a grid that cannot be indexed by hole is a texture. */}
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 2.5,
                  color: MINI_GHOST,
                  ...FIGS,
                }}
              >
                {holeNo}
              </span>
              <span style={{ ...markerStyle(m, cellWell), position: 'relative' }}>
                {/* AN UNPLAYED HOLE IS EMPTY, never a zero: a zero would read as
                    an extraordinary score. */}
                <span
                  style={{
                    /* ABSOLUTE CENTRING INSIDE THE SHAPE: the digit is its own
                       flex-centred box filling the marker's inner area, so the
                       circle or the box centres the figure — NOT a nudge. The
                       0.5px translate is DELETED: that offset is what pushed
                       every figure towards the bottom of its shape. The trailing
                       letter-space is given back with textIndent so a two-digit
                       figure stays centred rather than drifting left. */
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    textIndent: '0.04em',
                    lineHeight: 1,
                    ...FIGS,
                  }}

                >
                  {h?.strokes ?? ''}
                </span>
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/**
 * A ROUND WITH NO HOLE DATA RENDERS NO GRID (§S0.2) — the caller passes
 * `shape === null` for the three-point fallback and this returns null, with no
 * placeholder and no reserved height.
 */
export function MiniScorecard({
  shape,
  well = MINI_WELL,
  marked,
  momentTone,
}: {
  shape: HoleShape | null;
  /** The tinted well behind the grid — the outer rings take it (§S4.7). */
  well?: string;
  /** THE MOMENT'S HOLES (§3): a TINTED BAND BEHIND the cells in the moment tone.
   *  Nothing in the grid may take a moment tone ON a CELL. */
  marked?: ReadonlySet<number>;
  momentTone?: string;
}) {
  const { t } = useTranslation(['courses']);
  if (!shape || shape.holes.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: NINE_GAP }}>
      <NineRow holes={shape.holes} from={1} to={9} label={t('courses:scorecard.out')} well={well} marked={marked} momentTone={momentTone} />
      <NineRow holes={shape.holes} from={10} to={18} label={t('courses:scorecard.in')} well={well} marked={marked} momentTone={momentTone} />
    </div>
  );
}


export default RoundShape;

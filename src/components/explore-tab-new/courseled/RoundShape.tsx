import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { HoleShape, ShapeBead } from './hooks/useRoundHoleShapes';
import { TOPAR_RED, RAMP_TOPAR, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { TOPAR_EVEN_LIGHT } from '@/features/tourhub/_shared/tokens';
import { smoothPath } from '@/lib/charts/smoothPath';
import { toParFor } from '../friendRoundParts';
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
  const figure = toParFor(row);

  const withChrome = (plot: ReactNode) => (
    <>
      <div style={{ position: 'relative' }}>
        {plot}
        {/* §3 THE TO-PAR FIGURE ON THE BAND. It repeats the glass chip's value
            deliberately: the chip belongs to the photograph, this belongs to the
            shape. Body-surface tones, never the glass ones. */}
        {showMeta && figure && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 8,
              fontSize: 10.5,
              fontWeight: 700,
              lineHeight: 1,
              ...FIGS,
              color: figure.value < 0 ? TOPAR_RED : figure.value > 0 ? A.MUTE : A.DIM,
            }}
          >
            {figure.text}
          </span>
        )}
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




  return (
    <>
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

            {/* THE LEVEL-PAR RULE. Without it the red has nothing to be under.
                The only gridline on the tile. */}
            <line
              x1={0}
              x2={width}
              y1={zeroY}
              y2={zeroY}
              stroke={A.DIM}
              strokeOpacity={0.7}
              strokeWidth={1}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <path d={fillD} fill={FILL_OVER_LIGHT} />
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
            strokeWidth={1.8}
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
                strokeWidth={1.8}
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
                strokeWidth={1.8}
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
            strokeWidth={1.8}
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

      </svg>

      {showMeta && holesPlayed != null && <ShapeMeta birdies={birdies} />}
    </>
  );
}

/** Birdie count under the curve — now suppressed (WHO'S PLAYING no longer shows
 * the "X birdies" text). The structural div is retained so the row height and
 * padding stay unchanged for neighbouring tiles. */
function ShapeMeta({ birdies }: { birdies: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '0 11px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    />
  );
}

export default RoundShape;

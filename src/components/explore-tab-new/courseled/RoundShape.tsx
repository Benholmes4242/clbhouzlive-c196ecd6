import { useTranslation } from 'react-i18next';

import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { HoleShape, ShapeBead } from './hooks/useRoundHoleShapes';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { TOPAR_EVEN_LIGHT } from '@/features/tourhub/_shared/tokens';
import { monotonePath } from '@/lib/charts/monotonePath';
import { A, FIGS } from './tokens';

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

export function RoundShape({
  row,
  shape,
  width = 224,
  height = 60,
  showMeta = true,
}: {
  row: CircleRoundRow;
  shape: HoleShape | null;
  /** Viewport width of the trace. Rail tile 224; sheet row 96. */
  width?: number;
  /** Band height. Rail tile 60; sheet row 22. */
  height?: number;
  /** The birdie meta row. Rail only — the sheet row has no space for it. */
  showMeta?: boolean;
}) {
  const { t } = useTranslation('courses');
  const front = row.front_nine_to_par;
  const back = row.back_nine_to_par;

  let values: number[] | null = null;
  let beads: ShapeBead[] = [];
  let holesPlayed: number | null = null;
  let birdies = 0;

  if (shape) {
    values = shape.series;
    beads = shape.beads;
    holesPlayed = shape.played;
    birdies = shape.birdies;
  } else if (
    front != null &&
    back != null &&
    Number.isFinite(front) &&
    Number.isFinite(back)
  ) {
    values = [0, front, front + back];
  }

  if (!values || values.length < 2) return null;

  /* ONE CHART, THREE SURFACES. When the hole-by-hole data is present the tile
     renders THE SAME TrajectoryLine the Clubhouse scorecard post and the
     scorecard sheet render — same grades, same fill, same bead filter, same
     halo — instead of a look-alike maintained here. Ticks are suppressed: the
     band is 34px and carries its own meta row. */
  if (shape) {
    return (
      <>
        <TrajectoryLine
          holes={shape.holes}
          height={height}
          surface="light"
          showTicks={false}
          padY={1}
        />
        {showMeta && <ShapeMeta birdies={birdies} />}
      </>
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

  const d = monotonePath(pts);
  // THE FILL RUNS FLAT TO BOTH CARD EDGES so the colour stays full bleed,
  // while the POINTS are inset so the terminal dot cannot clip.
  const fillD = `M0,${height} L0,${pts[0].y.toFixed(2)} L${d.slice(1)} L${width},${pts[pts.length - 1].y.toFixed(2)} L${width},${height} Z`;

  // CLIP IDS MUST BE UNIQUE PER TILE — ten tiles sharing an id looks exactly
  // like the clip being ignored, and is the likeliest defect here.
  const uid = `fps-${String(row.round_id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clipAbove = `${uid}-ca`;
  const clipBelow = `${uid}-cb`;
  const gradAbove = `${uid}-ga`;
  const gradBelow = `${uid}-gb`;
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

  const strokeStops = (() => {
    if (!shape) return null;
    const out: { offset: number; color: string }[] = [];
    for (let i = 1; i < values.length; i += 1) {
      const c = gradeFor(values[i] - values[i - 1]);
      // Each hole's colour is pinned to its OWN x fraction and held flat until
      // just before the next hole, or the grades slide off the holes they
      // describe (STOP PLACEMENT IS LOAD-BEARING).
      const o = pts[i].x / width;
      const next = i + 1 < pts.length ? pts[i + 1].x / width : 1;
      if (i === 1) out.push({ offset: 0, color: c });
      out.push({ offset: o, color: c });
      out.push({ offset: Math.max(o, next - 0.0001), color: c });
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
          <linearGradient id={gradAbove} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={OVER_TONE} stopOpacity={0.26} />
            <stop offset="100%" stopColor={OVER_TONE} stopOpacity={0.02} />
          </linearGradient>
          {wentUnder && (
            // BOTTOM to top, so the density sits at the low point rather than
            // at the level line.
            <linearGradient id={gradBelow} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={UNDER_TONE} stopOpacity={0.3} />
              <stop offset="100%" stopColor={UNDER_TONE} stopOpacity={0.03} />
            </linearGradient>
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

        {wentUnder ? (
          <>
            <g clipPath={`url(#${clipAbove})`}>
              <path d={fillD} fill={`url(#${gradAbove})`} />
            </g>
            <g clipPath={`url(#${clipBelow})`}>
              <path d={fillD} fill={`url(#${gradBelow})`} />
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
          <path d={fillD} fill={`url(#${gradAbove})`} />
        )}

        {/* THE WHITE HALO, drawn ONCE and UNCLIPPED, underneath both strokes —
            it is what stops the band looking flat against the fill. */}
        <path
          d={d}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.75}
          strokeWidth={5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {strokeStops ? (
          /* ONE path, graded hole by hole. No clip split is needed: the colour
             already says where the round was good, and stacking a level-par
             split on top of a heat gradient would double-encode it. */
          <path
            d={d}
            fill="none"
            stroke={`url(#${gradStroke})`}
            strokeWidth={2.4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : wentUnder ? (
          <>
            <g clipPath={`url(#${clipAbove})`}>
              <path
                d={d}
                fill="none"
                stroke={OVER_TONE}
                strokeWidth={2.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <g clipPath={`url(#${clipBelow})`}>
              <path
                d={d}
                fill="none"
                stroke={UNDER_TONE}
                strokeWidth={2.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </>
        ) : (
          <path
            d={d}
            fill="none"
            stroke={OVER_TONE}
            strokeWidth={2.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* THE BEADS come from the SHARED beadForScore rule, positioned on the
            CUMULATIVE value AFTER the hole — identical tones and radii to the
            scorecard sheet (BRIEF_UNIFY_ROUND_CURVE_BEADS §2). GOLD NOW APPEARS
            ON THE CURVE for an ace or albatross. */}
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

/** Birdie count under the curve. Shared by the real chart and the fallback. */
function ShapeMeta({ birdies }: { birdies: number }) {
  const { t } = useTranslation('courses');
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
    >
      {/* ZERO OF SOMETHING GOOD READS AS A CRITICISM on another member's
          round, so an empty left slot rather than "0 birdies".
          THE PLURAL LIVES IN THE TRANSLATION (birdies_one / birdies_other). */}
      <span style={{ ...FIGS, color: UNDER_TONE }}>
        {birdies > 0 ? `\u25CF ${t('discover.friendsRail.birdies', { count: birdies })}` : ''}
      </span>
      {/* NO HOLE COUNT. create_round_posts and useCircleLatestRounds both
          require holes_played = 18, so the label could only ever say "18
          holes" — a constant occupying half the meta row. */}
    </div>
  );
}

export default RoundShape;

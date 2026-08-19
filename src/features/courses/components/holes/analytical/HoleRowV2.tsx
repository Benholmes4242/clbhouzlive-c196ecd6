/**
 * HoleRowV2 - the hole-by-hole row in the analytical treatment
 * (BRIEF_COURSE_TAB_ANALYTICAL_V2 section 4, BRIEF_HOLE_BY_HOLE_REFINE,
 * BRIEF_HOLE_BY_HOLE_COLOUR).
 *
 * The collapsed row is ONE line: HOLE / PAR / SI / distribution ramp / the two
 * figures. Segment widths are proportions of ROUNDS.
 *
 * THE RAMP TAKES THE TO-PAR CONVENTION (RAMP_TOPAR: under-par RED, par neutral,
 * bogey mid, double+ ink). It used to be a NEUTRAL INK RAMP - that decision is
 * OVERTURNED, not forgotten: the row prints a legend naming Birdie+, Par, Bogey
 * and Double+, and a single hue made a birdie hole indistinguishable from a
 * double hole until you read the figure. The round post and the scorecard sheet
 * already draw these four buckets in the to-par convention, so this panel joins
 * one rather than inventing one. Red at the GOOD end is that convention - do
 * not "fix" it to green. A ZERO bucket keeps a hairline at reduced opacity so
 * the bar always reads as four parts and agrees with the expanded percentages.
 *
 * NO MARKERS SIT ON THE RAMP. They used to, positioned against scaleMax (a
 * to-par domain shared across every hole), which put two unrelated quantities
 * on one x axis: a member reading "my dot lands where par meets bogey" was
 * reading a coincidence. That reasoning survives the colour change intact.
 * scaleMax drives a SEPARATE thin difficulty track inside the expanded detail,
 * which keeps its caption and is GRADED on the shared difficulty ramp (pale =
 * easiest hole on the course, deep red = hardest). Grading is SUPPRESSED below
 * DIFFICULTY_ROUNDS_FLOOR, because ranking 18 holes from a handful of rounds
 * produces a confident-looking ordering out of noise. Colouring the ramp is not
 * suppressed: a single bogey IS a bogey.
 *
 * Derivation only - the rows come from get_course_hole_analysis and
 * get_my_hole_performance, both already loaded by the page.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { A, FIGS, Hairline, LABEL, RAMP_TOPAR, SANS, difficultyRampColor, toParParts } from './tokens';


/** HOLE / PAR / SI / ramp / figures. Load-bearing: columns never size to content. */
export const HOLE_GRID_V2 = '28px 26px 24px 1fr auto';

export const PREVIEW_COUNT_V2 = 4;

/** Expanded detail is inset to the ramp column so it reads as a footnote. */
const DETAIL_INSET = 68;

/** Micro label sat beneath a figure. Present enough to answer the question once. */
const MICRO: React.CSSProperties = {
  fontSize: 6.5,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: A.DIM,
  lineHeight: 1.2,
};


export interface HoleScale {
  /** Upper bound of the shared marker scale (to-par strokes). Never below 0.1. */
  scaleMax: number;
  /** Hole number -> difficulty rank, 1 = hardest by field average. */
  rankByHole: Map<number, number>;
  /**
   * Hole number -> 0..1 position on the course's OWN difficulty spread
   * (0 = easiest hole, 1 = hardest). EMPTY below the rounds floor, which is how
   * the row knows to leave the track and the field figure ungraded.
   */
  tintByHole: Map<number, number>;
  /** False below DIFFICULTY_ROUNDS_FLOOR: the ordering would be noise. */
  gradeDifficulty: boolean;
}

/**
 * ROUNDS FLOOR for GRADING difficulty (BRIEF_HOLE_BY_HOLE_COLOUR §3).
 *
 * Derived, not picked. Across live hole data the mean per-hole to-par standard
 * deviation is 0.81 strokes and the median course's easiest-to-hardest spread is
 * 0.87 strokes. To place a hole inside the correct QUARTILE of its course's
 * spread (0.87 / 4 = 0.22) at roughly one standard error needs
 * n = (0.81 / 0.22)^2 = 13.5 rounds. 12 is the nearest floor already used
 * elsewhere in the app (the round-strip scored floor), and at 12 the standard
 * error is 0.23 - a quartile. Below it the grade is withheld entirely: an
 * 18-hole ordering computed from one or two cards looks confident and is noise.
 */
export const DIFFICULTY_ROUNDS_FLOOR = 12;


/**
 * Marker placement against a SHARED domain. Extracted so the tournament
 * hole row can share the positioning rule instead of forking it: the member
 * surface passes min = 0 (its averages are floored at 0.1 and clamp there),
 * the tour surface passes a signed domain because a professional field plays
 * many holes under par and those must not all pin to the left edge.
 */
export function markerOffset(value: number, min: number, max: number): string {
  const span = Math.max(0.0001, max - min);
  const ratio = Math.max(0, Math.min(1, (value - min) / span));
  return `${ratio * 100}%`;
}

/** Hole number -> difficulty rank, 1 = hardest by field average. Shared. */
export function rankHolesByDifficulty(
  holes: ReadonlyArray<{ hole_no: number; avg_to_par: number }>,
): Map<number, number> {
  const rankByHole = new Map<number, number>();
  [...holes]
    .sort((a, b) => b.avg_to_par - a.avg_to_par)
    .forEach((h, i) => rankByHole.set(h.hole_no, i + 1));
  return rankByHole;
}

/**
 * ONE scale for every marker on the page: the largest average on the course,
 * field or member, floored at 0.1 so a course that plays to par cannot divide
 * by zero. Ranks are derived here too so the row and the sheet agree.
 *
 * `totalRounds` gates the DIFFICULTY GRADE only (see DIFFICULTY_ROUNDS_FLOOR).
 * Omit it and the grade is withheld, which is the safe default.
 */
export function buildHoleScale(
  holes: CourseHole[],
  myByHole: Map<number, MyHolePerformanceRow>,
  totalRounds?: number,
): HoleScale {
  const values: number[] = [];
  holes.forEach((h) => {
    if (Number.isFinite(h.avg_to_par)) values.push(h.avg_to_par);
    const mine = myByHole.get(h.hole_no)?.avg_to_par;
    if (mine != null && Number.isFinite(mine)) values.push(mine);
  });
  const scaleMax = Math.max(0.1, ...values, 0.1);

  const gradeDifficulty = (totalRounds ?? 0) >= DIFFICULTY_ROUNDS_FLOOR;
  const tintByHole = new Map<number, number>();
  if (gradeDifficulty) {
    const fieldAvgs = holes
      .map((h) => h.avg_to_par)
      .filter((v): v is number => Number.isFinite(v));
    if (fieldAvgs.length > 0) {
      const lo = Math.min(...fieldAvgs);
      const hi = Math.max(...fieldAvgs);
      const span = hi - lo;
      holes.forEach((h) => {
        if (!Number.isFinite(h.avg_to_par)) return;
        // Flat course: everything sits mid-ramp rather than all pale or all deep.
        tintByHole.set(h.hole_no, span <= 0.0001 ? 0.5 : (h.avg_to_par - lo) / span);
      });
    }
  }

  return { scaleMax, rankByHole: rankHolesByDifficulty(holes), tintByHole, gradeDifficulty };
}


function pct(row: CourseHole, keys: (keyof CourseHole['dist'])[]): number {
  return keys.reduce((s, k) => s + (row.dist[k] ?? 0), 0);
}

/** The four buckets, in ramp order. ONE definition: the row, the strip and the
 *  expanded detail all read it, so a bucket can never be defined twice. */
export const BUCKETS = [
  { key: 'birdie' as const, keys: ['ace', 'albatross', 'eagle', 'birdie'] as (keyof CourseHole['dist'])[], bg: RAMP_TOPAR.birdie, labelKey: 'courses:holes.preview.legendBirdie' },
  { key: 'par' as const, keys: ['par'] as (keyof CourseHole['dist'])[], bg: RAMP_TOPAR.par, labelKey: 'courses:holes.preview.legendPar' },
  { key: 'bogey' as const, keys: ['bogey'] as (keyof CourseHole['dist'])[], bg: RAMP_TOPAR.bogey, labelKey: 'courses:holes.preview.legendBogey' },
  { key: 'double' as const, keys: ['double'] as (keyof CourseHole['dist'])[], bg: RAMP_TOPAR.double, labelKey: 'courses:holes.preview.legendDouble' },
] as const;

export type BucketShares = Record<'birdie' | 'par' | 'bogey' | 'double', number>;

/**
 * THE WHOLE COURSE'S SPREAD (BRIEF_COURSE_TAB_AND_SHEETS_CHART_LED A5): the
 * per-hole distributions already loaded, summed. Shares are 0..1 fractions of
 * every hole-round on the course. Returns null when nothing is counted.
 */
export function courseBucketShares(holes: CourseHole[]): BucketShares | null {
  const raw = BUCKETS.map((b) => holes.reduce((s, h) => s + pct(h, b.keys), 0));
  const total = raw.reduce((s, v) => s + v, 0);
  if (total <= 0) return null;
  const out = {} as BucketShares;
  BUCKETS.forEach((b, i) => {
    out[b.key] = raw[i] / total;
  });
  return out;
}

/**
 * THE DISTRIBUTION STRIP - the whole course before the parts. ONE component,
 * rendered by the Course tab's hole-by-hole panel and by the sheet, in the same
 * four tones as every row beneath it, so the strip teaches the rows. Its four
 * labelled percentages ARE the key: no separate legend row is drawn.
 */
export const DistributionStrip: React.FC<{ shares: BucketShares; style?: React.CSSProperties }> = ({
  shares,
  style,
}) => {
  const { t } = useTranslation(['courses']);
  const lastIdx = BUCKETS.length - 1;
  return (
    <div style={{ paddingBottom: 12, ...style }}>
      <div style={{ display: 'flex', gap: 1.5, height: 8 }}>
        {BUCKETS.map((b, i) => {
          const empty = shares[b.key] <= 0;
          return (
            <i
              key={b.key}
              style={{
                width: empty ? 2 : `${shares[b.key] * 100}%`,
                flexShrink: 0,
                background: b.bg,
                opacity: empty ? 0.28 : 1,
                borderRadius: i === 0 ? '4px 0 0 4px' : i === lastIdx ? '0 4px 4px 0' : 0,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', marginTop: 7, ...FIGS }}>
        {BUCKETS.map((b) => (
          <span
            key={b.key}
            style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <i
                style={{ width: 8, height: 8, borderRadius: 2, background: b.bg, display: 'block', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: A.INK, lineHeight: 1 }}>
                {Math.round(shares[b.key] * 100)}%
              </span>
            </span>
            <span style={{ ...MICRO, marginTop: 3, whiteSpace: 'nowrap', textAlign: 'center' }}>
              {t(b.labelKey)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};



export const HoleRowV2: React.FC<{
  row: CourseHole;
  mine?: MyHolePerformanceRow | null;
  scale: HoleScale;
  totalHoles: number;
  open: boolean;
  onToggle: () => void;
  /** Last row on the surface: no trailing hairline. */
  last?: boolean;
  /**
   * NO VIEWER, NO VIEWER COLUMNS (§B7). A member with no rounds here sees the
   * field's figures and nothing else - not a dash, not a zero, not a reserved
   * slot. The surface knows this, the row does not, so it is passed in.
   */
  hasYou?: boolean;
  /**
   * Course-wide bucket shares, for the expanded detail's comparison marks (§B4).
   * Already summed for the distribution strip - no second pass, no new query.
   */
  courseShares?: BucketShares | null;
}> = ({
  row,
  mine = null,
  scale,
  totalHoles,
  open,
  onToggle,
  last = false,
  hasYou = true,
  courseShares = null,
}) => {
  const { t } = useTranslation(['courses']);
  const field = toParParts(row.avg_to_par);
  const you = hasYou ? toParParts(mine?.avg_to_par) : null;
  const rank = scale.rankByHole.get(row.hole_no) ?? null;

  const segs = BUCKETS.map((b) => ({
    key: b.key,
    pctValue: pct(row, b.keys),
    bg: b.bg,
    label: t(b.labelKey),
  }));
  const total = segs.reduce((s, x) => s + x.pctValue, 0) || 1;

  /**
   * YOUR GAP IS A MARGIN, NOT A TO-PAR FIGURE (§B6): better than the field is
   * the index-delta GREEN, worse is its RED. The to-par convention (under par
   * red) would print a member who beats the field in the same tone as a member
   * who loses to it on a hole that plays under par.
   */
  const gapRaw =
    hasYou && mine?.avg_to_par != null && Number.isFinite(row.avg_to_par)
      ? mine.avg_to_par - row.avg_to_par
      : null;
  const gap =
    gapRaw == null
      ? null
      : (() => {
          const r = Math.round(gapRaw * 10) / 10;
          if (r > 0) return { text: `+${r.toFixed(1)}`, tone: A.DRIFTED };
          if (r < 0) return { text: `\u2212${Math.abs(r).toFixed(1)}`, tone: A.IMPROVED };
          return { text: 'E', tone: A.MUTE };
        })();


  /**
   * The hole's own position on the course's difficulty spread, or null below the
   * rounds floor - in which case the track and the field figure stay ungraded.
   */
  const tint = scale.gradeDifficulty ? scale.tintByHole.get(row.hole_no) ?? null : null;
  // Marker floor 0.25: the easiest hole's true tone (near-white) would vanish
  // against the panel, so the ramp is entered a quarter in for the marker only.
  const diffTone = tint == null ? null : difficultyRampColor(0.25 + tint * 0.75);
  /**
   * The COLLAPSED FIELD FIGURE takes the difficulty tone so the list can be
   * scanned for hard holes without expanding anything - EXCEPT where the average
   * is under par, which keeps the to-par red: that convention is separate from,
   * and outranks, the difficulty ramp. Text sits at a raised floor on the ramp so
   * the easiest hole's figure is still legible.
   */
  const fieldTone = (() => {
    if (!field) return A.DIM;
    if (field.tone !== A.INK) return field.tone;
    if (tint == null) return field.tone;
    return difficultyRampColor(0.52 + tint * 0.48);
  })();

  const lastIdx = segs.length - 1;

  /** ONE domain for the hole's shares and the course's, so the marks compare. */
  const shareDomain = Math.max(
    0.05,
    ...segs.map((s) => s.pctValue / total),
    ...(courseShares ? BUCKETS.map((b) => courseShares[b.key]) : []),
  );



  return (
    /* SELECTION IS A LEADING RULE AND A NEUTRAL WASH (§B5), not the heavy outline
       this row used to take. The rule is a shape, not a colour, so selection does
       not rely on colour alone, and aria-expanded carries it to assistive tech;
       the button keeps the platform focus ring for keyboard use. */
    <div
      style={
        open
          ? {
              margin: '0 -12px',
              padding: '0 12px',
              background: A.CANVAS,
              boxShadow: `inset 3px 0 0 ${A.INK}`,
              borderRadius: 4,
            }
          : undefined
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}

        style={{
          display: 'grid',
          gridTemplateColumns: HOLE_GRID_V2,
          alignItems: 'center',
          gap: 8,
          padding: '11px 0',
          width: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: SANS,
          textAlign: 'left',
          ...FIGS,
        }}
      >
        <span style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: A.INK,
              lineHeight: 1.1,
            }}
          >
            {row.hole_no}
          </span>
        </span>

        {/* Par and SI are labelled: a bare numeral is never left to explain itself. */}
        <span style={{ display: 'block', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: A.BODY }}>
            {row.par}
          </span>
          <span style={{ ...MICRO, display: 'block', marginTop: 1 }}>
            {t('courses:courseDetail.holes.colPar')}
          </span>
        </span>
        <span style={{ display: 'block', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: A.DIM }}>
            {row.stroke_index ?? ''}
          </span>
          <span style={{ ...MICRO, display: 'block', marginTop: 1 }}>
            {t('courses:courseDetail.holes.colSi')}
          </span>
        </span>

        {/* The ramp: a pure distribution of rounds. Nothing is plotted on it. */}
        <span style={{ display: 'block', minWidth: 0 }}>
          <span style={{ display: 'flex', gap: 1.5, height: 8 }}>
            {segs.map((s, i) => {
              const empty = s.pctValue <= 0;
              return (
                <i
                  key={s.key}
                  style={{
                    // A ZERO bucket keeps a hairline in its own tone at reduced
                    // opacity, so the bar always reads as four parts and agrees
                    // with the 0% the expanded detail prints.
                    width: empty ? 2 : `${(s.pctValue / total) * 100}%`,
                    flexShrink: 0,
                    background: s.bg,
                    opacity: empty ? 0.28 : 1,
                    borderRadius:
                      i === 0
                        ? '4px 0 0 4px'
                        : i === lastIdx
                          ? '0 4px 4px 0'
                          : 0,
                  }}
                />
              );
            })}
          </span>
        </span>


        {/* The figures live on the row's right end as a labelled pair. */}
        <span
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            whiteSpace: 'nowrap',
            paddingLeft: 2,
          }}
        >
          <span style={{ display: 'block', minWidth: 34, textAlign: 'right' }}>
            <span
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: fieldTone,
                lineHeight: 1.1,
              }}
            >
              {field ? field.text : ''}
            </span>
            <span style={{ ...MICRO, display: 'block', marginTop: 1 }}>
              {t('courses:courseDetail.plays.legendField')}
            </span>
          </span>
          {/* NO VIEWER, NO SLOT (§B7): the column is not reserved for a member
              who has never played here. An unplayed hole for a member who HAS
              played keeps its width so the column cannot realign row to row. */}
          {hasYou && (
            <span style={{ display: 'block', minWidth: 34, textAlign: 'right' }} aria-hidden={!you}>
              <span
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: A.AMBER_DEEP,
                  lineHeight: 1.1,
                }}
              >
                {you ? you.text : ''}
              </span>
              {you && (
                <span style={{ ...MICRO, display: 'block', marginTop: 1 }}>
                  {t('courses:courseDetail.plays.legendYou')}
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div style={{ padding: `0 0 16px ${DETAIL_INSET}px` }}>
          {/* The four shares as four EVEN columns, one row: swatch+figure over label.
              Beneath each, THE COURSE-WIDE SHARE AS A HAIRLINE MARK (§B4): the
              hole's own share is the bar, the course's is the tick, both on one
              domain so a bogey trap is visible rather than described. Where the
              two agree the mark still renders - it is a fact, not a verdict. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', ...FIGS }}>
            {segs.map((s) => {
              const holeShare = s.pctValue / total;
              const courseShare = courseShares ? courseShares[s.key] : null;
              return (
              <span
                key={s.key}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <i
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: s.bg,
                      display: 'block',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: A.INK,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.round(holeShare * 100)}%
                  </span>
                </span>
                {courseShare != null && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'relative',
                      display: 'block',
                      width: '76%',
                      height: 4,
                      marginTop: 4,
                      borderRadius: 2,
                      background: A.TRACK,
                    }}
                  >
                    <i
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${Math.min(100, (holeShare / shareDomain) * 100)}%`,
                        borderRadius: 2,
                        background: s.bg,
                        display: 'block',
                      }}
                    />
                  </span>
                )}
                <span
                  style={{
                    ...MICRO,
                    fontSize: 6.5,
                    marginTop: 3,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}
                >
                  {s.label}
                </span>
              </span>
              );
            })}
          </div>




          <Hairline style={{ margin: '12px 0 10px' }} />


          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 18px',
              ...FIGS,
            }}
          >
            {row.yards != null && (
              <DetailFigure label={t('courses:courseDetail.holes.yards')} value={String(row.yards)} />
            )}
            {rank != null && (
              <DetailFigure
                label={t('courses:courseDetail.holes.difficultyRank')}
                value={t('courses:courseDetail.holes.rankOf', { rank, total: totalHoles })}
              />
            )}
            {gap && (
              <DetailFigure
                label={t('courses:courseDetail.holes.yourGapVsField')}
                value={gap.text}
                tone={gap.tone}
              />
            )}
          </div>
        </div>
      )}

      {!last && <Hairline />}
    </div>
  );
};

/**
 * A footnote figure: label BEFORE the value, on one baseline, 12.5/700. The
 * collapsed row's figures are the opposite shape - value above a micro label,
 * 14/700 - so the amber YOU average and the red YOUR GAP cannot read as one
 * number changing colour.
 */
const DetailFigure: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = A.INK,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
    <span style={{ ...LABEL, fontSize: 8 }}>{label}</span>
    <span style={{ fontSize: 12.5, fontWeight: 700, color: tone }}>{value}</span>
  </span>
);

export default HoleRowV2;


import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCourseScoringBreakdown,
  type ScoringBreakdownHole,
} from './useCourseScoringBreakdown';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { A, Panel, Hairline, LABEL, NUM, SANS, StatRow, FIGS, TOPAR_RED } from './analytical/tokens';
import { BAND_AMBER } from '@/features/courses/_shared/scoreBands';

/**
 * "Where your shots go" in the analytical treatment
 * (BRIEF_COURSE_YOU_TAB_ANALYTICAL_V2 s2-s5).
 *
 *   - the average-round panel is headline PLUS reference: a lone "+8.5" with
 *     no field figure beside it reads as an alarm even when it is several
 *     shots better than everyone else
 *   - the field reference is only drawn when both sides are commensurable:
 *     identical derivation (sum of per-hole averages to par) over the SAME
 *     set of hole numbers
 *   - damaging rows are tightened; the unit moves into the column header
 *   - "what's costing you" is headline-led on doubles a round
 *   - the thirds bars use a neutral ink ladder assigned by rank, never colour
 */

const OVER = '#C8372B';
const UNDER = '#0F8F4A';

/** The coaching line. Caption weight - it advises, it does not narrate. */
const CAPTION: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: A.MUTE,
  margin: '12px 0 0',
};

const DAMAGE_GRID = '30px 1fr 52px';

/**
 * Noise floor shared with the s3 caption logic - the two MUST move together,
 * and they do: this one constant drives both the caption branch and the ink
 * ladder's gate (BRIEF_THIRDS_FLOOR_AND_DOUBLES_SOURCE s0).
 *
 * DERIVED, NOT CHOSEN. Over every (member, course) pair with 5+ hole-by-hole
 * rounds, the spread a member would show from SAMPLING ALONE - 1.693 * sd of a
 * third's per-round total / sqrt(rounds), the expected range of three means -
 * has a median of 0.78 and a mean of 0.84. Below ~0.8 the worst third is not
 * reliably the worst third, so a directional caption would be describing
 * noise. At or above it the ordering is claiming something.
 *
 * The old 1.5 called the MEDIAN card (spread 1.10) even, which is why a full
 * shot of back-six fade was reported as "no weak stretch" while the bars above
 * plainly showed it.
 */
const THIRDS_NOISE_FLOOR = 0.8;

/** Neutral ink ladder for the thirds bars, worst first. Never semantic colour. */
const THIRD_LADDER = ['rgba(14,18,22,0.70)', 'rgba(14,18,22,0.40)', 'rgba(14,18,22,0.18)'];

/** Below this, viewer and field are level - no direction claimed either way. */
const REFERENCE_NOISE_FLOOR = 0.5;

function listGrammar(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function signed(v: number, digits = 1): string {
  const f = Math.pow(10, digits);
  const r = Math.round(v * f) / f;
  if (r > 0) return `+${r.toFixed(digits)}`;
  if (r < 0) return `\u2212${Math.abs(r).toFixed(digits)}`;
  return 'E';
}

function toneFor(v: number, digits = 1): string {
  const f = Math.pow(10, digits);
  const r = Math.round(v * f) / f;
  // BRIEF_UNDER_PAR_RED: under par is red, over par ink, level muted.
  return r > 0 ? A.INK : r < 0 ? TOPAR_RED : A.MUTE;
}

/**
 * A MARGIN IS NOT A SCORE (BRIEF_YOU_TAB_MARGIN_AND_GAPS s1).
 *
 * toneFor implements the to-par convention and is correct for every to-par
 * FIGURE. It is wrong for a comparison BETWEEN two scores: a bigger margin is
 * BETTER, so the to-par rule inverts and paints the good outcome red - red
 * meaning "you are beating the field" ten pixels from red meaning "you make
 * too many doubles".
 *
 * A margin is MOVEMENT-shaped, so it takes INDEX_DELTA (A.IMPROVED /
 * A.DRIFTED) via the analytical tokens. `gap` here is field minus you, so
 * POSITIVE means the member is better than the field.
 */
function marginTone(gap: number): string {
  if (Math.abs(gap) < REFERENCE_NOISE_FLOOR) return A.MUTE;
  return gap > 0 ? A.IMPROVED : A.DRIFTED;
}

/** The field's bar. Neutral - the comparison, not a verdict. */
const FIELD_BAR = '#C6CFD8';

/**
 * A row inside the noise floor: neutral ink, NO direction claimed. This is the
 * common case on real courses - a fifth of a shot across a hole average is
 * noise, so most damaging holes are level with the field.
 */
const LEVEL_BAR = 'rgba(14,18,22,0.34)';


/**
 * One bar on a scale shared with its sibling.
 *
 * THE MEMBER'S BAR IS SHORTER WHEN THEY ARE BETTER. These are to-par values,
 * so a LOWER figure is the better one - do not invert this. A short "Yours"
 * bar beside a long "The field here" bar is the member winning.
 */
const CompareBar: React.FC<{
  label: string;
  value: number;
  scale: number;
  fill: string;
  figure: string;
  figureTone: string;
  size?: 'md' | 'sm';
}> = ({ label, value, scale, fill, figure, figureTone, size = 'md' }) => {
  const pct = scale > 0 ? Math.max(0, Math.min(100, (value / scale) * 100)) : 0;
  const h = size === 'md' ? 7 : 5;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: size === 'md' ? '84px 1fr 44px' : '66px 1fr 42px',
        alignItems: 'center',
        gap: 9,
      }}
    >
      <span style={{ ...LABEL, fontSize: size === 'md' ? 8 : 7.5 }}>{label}</span>
      <span
        style={{
          display: 'block',
          height: h,
          borderRadius: h / 2,
          background: A.TRACK,
        }}
      >
        <span
          style={{
            display: 'block',
            height: h,
            borderRadius: h / 2,
            width: `${pct}%`,
            background: fill,
          }}
        />
      </span>
      <span
        style={{
          ...NUM,
          fontSize: size === 'md' ? 15 : 13,
          color: figureTone,
          textAlign: 'right',
        }}
      >
        {figure}
      </span>
    </div>
  );
};


interface Props {
  golfCourseId: string | undefined;
}

export const ScoringBreakdownSection: React.FC<Props> = ({ golfCourseId }) => {
  const { t } = useTranslation(['courses']);
  const { data, isLoading } = useCourseScoringBreakdown(golfCourseId);
  // Already loaded by the Course tab - React Query serves this from cache.
  const { data: analysis } = useCourseHoleAnalysis(golfCourseId);

  const parsed = useMemo(() => {
    if (!data || !Array.isArray(data.holes)) return null;
    if ((data.rounds ?? 0) < 1) return null;
    const holes = data.holes.filter((h) => (h.rounds_played ?? 0) > 0);
    if (holes.length === 0) return null;
    return {
      rounds: data.rounds,
      total: Number(data.total_over_par) || 0,
      avgGross: data.avg_gross == null ? null : Number(data.avg_gross),
      holes,
    };
  }, [data]);

  /**
   * Field reference. Both sides are "sum of per-hole average to par" - the
   * SAME derivation - and both are restricted to the hole numbers present in
   * both populations, so the two figures are commensurable. If the field
   * analysis does not cover every hole the member has played, we draw nothing
   * rather than compare an 18-hole figure with a 14-hole one.
   */
  const reference = useMemo(() => {
    if (!parsed) return null;
    const fieldHoles = analysis?.available ? analysis.holes ?? [] : [];
    if (fieldHoles.length === 0) return null;
    const fieldByHole = new Map(fieldHoles.map((h) => [h.hole_no, h]));
    const shared = parsed.holes.filter((h) => fieldByHole.has(h.hole_no));
    if (shared.length !== parsed.holes.length) return null;
    let you = 0;
    let field = 0;
    for (const h of shared) {
      const f = fieldByHole.get(h.hole_no);
      if (f?.avg_to_par == null) return null;
      you += h.shots_over_par || 0;
      field += f.avg_to_par;
    }
    return { you, field, gap: field - you, holes: shared.length, rounds: analysis?.total_rounds ?? 0 };
  }, [parsed, analysis]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS }}>
        <Panel><Skeleton className="h-[150px] w-full" /></Panel>
        <Panel><Skeleton className="h-[190px] w-full" /></Panel>
        <Panel><Skeleton className="h-[150px] w-full" /></Panel>
      </div>
    );
  }

  if (!parsed) return null;

  const { rounds, total, avgGross, holes } = parsed;
  const hasInterpretation = rounds >= 5;

  // Stratum 1: top 5 by shots_over_par desc. THE RANKING IS UNCHANGED - still
  // by shots lost, per the subhead. The field is a second dimension, not a
  // reordering (BRIEF_DAMAGING_HOLES_VS_FIELD s6).
  const damaging = [...holes]
    .sort((a, b) => b.shots_over_par - a.shots_over_par)
    .slice(0, 5);
  const top1 = damaging[0]?.shots_over_par || 1;

  /**
   * Per-hole field cost: the field's average shots over par on that hole.
   * Same derivation as the member's `shots_over_par`, so the two are
   * commensurable HOLE BY HOLE - which is the only claim each row makes. This
   * map is deliberately independent of the panel-wide `reference` gate above:
   * that gate refuses a whole-round total when the hole SETS differ, while a
   * row only needs its own hole covered.
   */
  const fieldCostByHole = new Map<number, number>();
  if (analysis?.available) {
    for (const f of analysis.holes ?? []) {
      if (f?.avg_to_par != null) fieldCostByHole.set(f.hole_no, Number(f.avg_to_par));
    }
  }
  const damagingFieldCosts = damaging
    .map((h) => fieldCostByHole.get(h.hole_no))
    .filter((v): v is number => v != null);
  const anyField = damagingFieldCosts.length > 0;
  /**
   * The scale must include the FIELD values, or a notch on a hole where the
   * field loses more than the member sits off the end of its own track.
   */
  const damageScale = Math.max(top1, ...damagingFieldCosts, 0.1) * 1.1;


  // Stratum 2: totals across all played holes
  const sumPar = holes.reduce((s, h) => s + (h.par_or_better || 0), 0);
  const sumBog = holes.reduce((s, h) => s + (h.bogeys || 0), 0);
  const sumDbl = holes.reduce((s, h) => s + (h.doubles_plus || 0), 0);
  const stratum2Total = sumPar + sumBog + sumDbl || 1;
  const pctPar = Math.round((sumPar / stratum2Total) * 100);
  const pctBog = Math.round((sumBog / stratum2Total) * 100);
  const pctDbl = Math.max(0, 100 - pctPar - pctBog);

  const topDoubles = [...holes]
    .filter((h) => (h.doubles_plus || 0) > 0)
    .sort((a, b) => b.doubles_plus - a.doubles_plus)
    .slice(0, 4);

  // Stratum 3: thirds
  const thirdOf = (h: ScoringBreakdownHole): 0 | 1 | 2 =>
    h.hole_no <= 6 ? 0 : h.hole_no <= 12 ? 1 : 2;
  const thirdSums = [0, 0, 0];
  const thirdHas = [false, false, false];
  holes.forEach((h) => {
    const i = thirdOf(h);
    thirdSums[i] += h.shots_over_par || 0;
    thirdHas[i] = true;
  });
  const thirdLabels = [
    t('courses:holes.scoringBreakdown.third1'),
    t('courses:holes.scoringBreakdown.third2'),
    t('courses:holes.scoringBreakdown.third3'),
  ];
  const maxThird = Math.max(...thirdSums, 0.0001);
  let worstIdx = 0;
  let bestIdx = 0;
  thirdSums.forEach((v, i) => {
    if (!thirdHas[i]) return;
    if (v > thirdSums[worstIdx]) worstIdx = i;
    if (v < thirdSums[bestIdx] || !thirdHas[bestIdx]) bestIdx = i;
  });
  const spread = +(thirdSums[worstIdx] - thirdSums[bestIdx]).toFixed(1);
  /** Same threshold the caption uses: below it, ink nothing. */
  const thirdsEven = spread < THIRDS_NOISE_FLOOR || worstIdx === bestIdx;
  /**
   * THE MAGNITUDE, ALWAYS TO ONE DECIMAL. `spread` is a NUMBER (+"1.0" is 1),
   * so interpolating it raw prints "cost 1 shots more" at exactly the spreads
   * the lower floor now admits. The strings already carry {{spread}}; they just
   * needed a figure that survives the trip.
   */
  const spreadFig = spread.toFixed(1);

  /** Rank 0 = worst third. Drives the ink ladder; even rounds get one shade. */
  const thirdRank = [0, 1, 2]
    .slice()
    .sort((a, b) => thirdSums[b] - thirdSums[a])
    .reduce<Record<number, number>>((acc, idx, rank) => {
      acc[idx] = rank;
      return acc;
    }, {});

  // Sentences
  const s1Holes = damaging.slice(0, 3);
  const s1Sum = +s1Holes.reduce((s, h) => s + h.shots_over_par, 0).toFixed(1);
  /**
   * Share denominator: the member's OWN total shots over par at this course
   * (total_over_par, the sum of every played hole's average to par). Never the
   * field total - "x% of everything you drop here" is a share of the viewer.
   */
  const s1Share = total > 0 ? Math.round((s1Sum / total) * 100) : 0;
  const s1HoleLabels = s1Holes.map((h) => String(h.hole_no));
  const s1Sentence = t('courses:holes.scoringBreakdown.s1Sentence', {
    holes:
      s1HoleLabels.length === 1
        ? t('courses:holes.scoringBreakdown.holeOne', { n: s1HoleLabels[0] })
        : t('courses:holes.scoringBreakdown.holeMany', { list: listGrammar(s1HoleLabels) }),
    sum: s1Sum,
    share: s1Share,
  });

  const doublesPerRound = rounds > 0 ? sumDbl / rounds : 0;
  const s2Sentence =
    doublesPerRound >= 1
      ? t('courses:holes.scoringBreakdown.s2SentenceHigh', {
          total: sumDbl,
          perRound: +doublesPerRound.toFixed(1),
        })
      : t('courses:holes.scoringBreakdown.s2SentenceLow');

  let s3Sentence: string;
  if (thirdsEven) {
    s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceEven');
  } else {
    const bestLabel = thirdLabels[bestIdx].toLowerCase();
    const worstLabel = thirdLabels[worstIdx].toLowerCase();
    if (worstIdx === 2) {
      s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceLate', {
        worst: worstLabel,
        best: bestLabel,
        spread: spreadFig,
      });
    } else if (worstIdx === 0) {
      s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceEarly', {
        best: bestLabel,
        worst: worstLabel,
        spread: spreadFig,
      });
    } else {
      s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceMiddle', {
        best: bestLabel,
        spread: spreadFig,
      });
    }
  }

  const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={CAPTION}>{children}</p>
  );

  /**
   * Headline. With field data it is the GAP (the one fact a member cannot read
   * off their own scorecard); without it, it falls back to the member's own
   * average to par. The label is derived in the SAME branch as the figure, so
   * the two can never disagree about what the number means.
   *
   * `reference.gap` is field minus you, so POSITIVE means the member is better
   * than the field. Tone is taken from the negated gap so "better" reads as the
   * improvement tone through the existing toneFor convention.
   */
  /**
   * Round ONCE, here, and derive the gap from the DISPLAYED components so the
   * subtraction a member can do on screen is always true.
   */
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const disp = reference
    ? (() => {
        const you = r1(reference.you);
        const field = r1(reference.field);
        return { you, field, gap: r1(field - you) };
      })()
    : null;

  const headline = (() => {
    if (disp) {
      const gap = disp.gap;
      if (Math.abs(gap) < REFERENCE_NOISE_FLOOR) {
        return {
          text: signed(0),
          tone: marginTone(0),
          label: t('courses:courseDetail.you.gapLevel'),
        };
      }
      return {
        // THE MAGNITUDE ALONE. A plus sign means MORE SHOTS everywhere else on
        // this page, so "+3.6 better than the field" reads as a penalty. The
        // direction lives in the label and in the tone.
        text: Math.abs(gap).toFixed(1),
        tone: marginTone(gap),
        label:
          gap > 0
            ? t('courses:courseDetail.you.gapBetterShots')
            : t('courses:courseDetail.you.gapWorseShots'),
      };
    }

    // No field reference: this figure is the member's own to-par SCORE, not a
    // margin, so it keeps signed() and toneFor().
    // Round before branching so -0.04 never renders "-0.0".
    const roundedTotal = Math.round(total * 10) / 10;
    return {
      text: signed(total),
      tone: toneFor(total),
      label:
        roundedTotal > 0
          ? t('courses:courseDetail.you.shotsOverPar')
          : roundedTotal < 0
            ? t('courses:courseDetail.you.shotsUnderPar')
            : t('courses:courseDetail.you.levelPar'),
    };
  })();



  const split = [
    { key: 'par', label: t('courses:courseDetail.you.parOrBetter'), pct: pctPar, holes: sumPar, tone: UNDER },
    { key: 'bog', label: t('courses:holes.scoringBreakdown.bogey'), pct: pctBog, holes: sumBog, tone: BAND_AMBER },
    { key: 'dbl', label: t('courses:courseDetail.you.doubleOrWorse'), pct: pctDbl, holes: sumDbl, tone: OVER },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS, ...FIGS }}>
      {/* An average round here - headline PLUS reference */}
      <Panel
        title={t('courses:courseDetail.you.avgRound')}
        aside={t('courses:courseDetail.you.roundsCount', { count: rounds })}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...NUM, fontSize: 44, lineHeight: 1, color: headline.tone }}>{headline.text}</div>
          <div style={{ ...LABEL, marginTop: 8 }}>{headline.label}</div>
        </div>

        {disp && (
          <>
            <Hairline style={{ margin: '16px 0 14px' }} />
            {/* The distance the two figures state and never showed: ONE shared
                scale, headroom so neither bar touches the edge. The FIGURES
                keep the to-par convention (toneFor); only the bars carry the
                margin tone. */}
            {(() => {
              const scale = Math.max(disp.you, disp.field, 0.1) * 1.08;
              const tone = marginTone(disp.gap);
              return (
                <div style={{ display: 'grid', gap: 10 }}>
                  <CompareBar
                    label={t('courses:courseDetail.you.yours')}
                    value={disp.you}
                    scale={scale}
                    fill={tone}
                    figure={signed(disp.you)}
                    figureTone={toneFor(disp.you)}
                  />
                  <CompareBar
                    label={t('courses:courseDetail.you.fieldHere')}
                    value={disp.field}
                    scale={scale}
                    fill={FIELD_BAR}
                    figure={signed(disp.field)}
                    figureTone={toneFor(disp.field)}
                  />
                </div>
              );
            })()}
          </>
        )}


        <Hairline style={{ margin: '16px 0 14px' }} />
        <StatRow
          size={17}
          items={[
            ...(avgGross != null
              ? [{ label: t('courses:courseDetail.you.avgGross'), value: avgGross.toFixed(1) }]
              : []),
            {
              label: t('courses:courseDetail.you.parOrBetterShort'),
              value: `${pctPar}%`,
            },
            {
              label: t('courses:courseDetail.you.doublesARound'),
              value: (+doublesPerRound.toFixed(1)).toFixed(1),
              // A count, not a to-par figure - see the headline above. Neutral.
            },
            { label: t('courses:courseDetail.you.roundsLabel'), value: String(rounds) },
          ]}
        />
      </Panel>

      {/* Your most damaging holes - tightened rows, unit in the header */}
      <Panel
        title={t('courses:courseDetail.you.damagingHoles')}
        aside={t('courses:courseDetail.you.byShotsLost')}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: DAMAGE_GRID,
            gap: 11,
            alignItems: 'baseline',
            paddingBottom: 4,
          }}
        >
          <span style={{ ...LABEL, textAlign: 'center' }}>{t('courses:courseDetail.you.colHole')}</span>
          <span style={LABEL}>{t('courses:holes.scoringBreakdown.s1Sub')}</span>
          <span style={{ ...LABEL, textAlign: 'right' }}>{t('courses:courseDetail.you.colCostARound')}</span>
        </div>
        {damaging.map((h) => {
          /**
           * COMMENSURABILITY, PER ROW (BRIEF_DAMAGING_HOLES_VS_FIELD s3).
           *
           * The row gets a notch and a verdict ONLY when the field analysis has
           * a reading for THIS hole number. Never fall back to the course-wide
           * field average: that is a different quantity and it would make the
           * verdict false. No reading -> renders as it did before, red bar,
           * no notch, no verdict.
           */
          const fieldCost = fieldCostByHole.get(h.hole_no) ?? null;
          // Positive gap = the member is BETTER than the field on this hole.
          const gap = fieldCost == null ? null : fieldCost - h.shots_over_par;
          const level = gap != null && Math.abs(gap) < REFERENCE_NOISE_FLOOR;
          const barTone = gap == null ? OVER : level ? LEVEL_BAR : marginTone(gap);
          const barW = Math.max(4, Math.min(100, (h.shots_over_par / damageScale) * 100));
          const notchW = fieldCost == null ? 0 : Math.max(0, Math.min(100, (fieldCost / damageScale) * 100));
          const verdict =
            gap == null
              ? null
              : level
                ? t('courses:holes.scoringBreakdown.vsLevel')
                : gap > 0
                  ? t('courses:holes.scoringBreakdown.vsBetter')
                  : t('courses:holes.scoringBreakdown.vsWorse');
          return (
            <div
              key={h.hole_no}
              style={{
                display: 'grid',
                gridTemplateColumns: DAMAGE_GRID,
                gap: 11,
                alignItems: 'center',
                padding: '7px 0',
              }}
            >
              <span style={{ ...NUM, fontSize: 14, color: A.INK, textAlign: 'center' }}>{h.hole_no}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ ...LABEL, fontSize: 8, display: 'block' }}>
                  {t('courses:holes.scoringBreakdown.parYouAvg', {
                    par: h.par,
                    avg: h.avg_score.toFixed(2),
                  })}
                </span>
                <span
                  style={{
                    display: 'block',
                    position: 'relative',
                    height: 7,
                    borderRadius: 3.5,
                    background: A.TRACK,
                    marginTop: 5,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: 7,
                      borderRadius: 3.5,
                      width: `${barW}%`,
                      background: barTone,
                    }}
                  />
                  {fieldCost != null && (
                    /* The field's cost on the SAME scale. Where the bar runs
                       past the notch, that stretch is the member's alone. */
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        top: -1.5,
                        left: `${notchW}%`,
                        width: 2,
                        height: 10,
                        borderRadius: 1,
                        background: 'rgba(15,23,42,0.55)',
                        transform: 'translateX(-1px)',
                      }}
                    />
                  )}
                </span>
                {verdict && (
                  <span
                    style={{
                      ...LABEL,
                      fontSize: 7.5,
                      display: 'block',
                      marginTop: 5,
                      color: level ? A.DIM : barTone,
                    }}
                  >
                    {verdict}
                  </span>
                )}
              </span>
              {/* INK, not red: the bar carries the direction now. */}
              <span style={{ ...NUM, fontSize: 14, color: A.INK, textAlign: 'right' }}>
                +{h.shots_over_par.toFixed(1)}
              </span>
            </div>
          );
        })}
        {anyField && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingTop: 6,
            }}
          >
            <span
              aria-hidden
              style={{ display: 'block', width: 2, height: 9, borderRadius: 1, background: 'rgba(15,23,42,0.55)' }}
            />
            <span style={{ ...LABEL, fontSize: 7.5 }}>{t('courses:holes.scoringBreakdown.vsFieldLegend')}</span>
          </div>
        )}

        {hasInterpretation ? (
          <Caption>{s1Sentence}</Caption>
        ) : (
          <Caption>{t('courses:holes.scoringBreakdown.moreRoundsHint')}</Caption>
        )}
      </Panel>

      {/* What's costing you the shots - headline led on doubles a round */}
      <Panel
        title={t('courses:courseDetail.you.costingShots')}
        aside={t('courses:courseDetail.you.everyHole')}
      >
        <div style={{ textAlign: 'center' }}>
          {/* A COUNT, not a to-par figure. Red on this page means "under par"
              (good), so painting a bad-thing count red says the opposite of
              what it means. Neutral ink; the label carries the sense. */}
          <div style={{ ...NUM, fontSize: 40, lineHeight: 1, color: A.INK }}>
            {(+doublesPerRound.toFixed(1)).toFixed(1)}
          </div>
          <div style={{ ...LABEL, marginTop: 8 }}>{t('courses:courseDetail.you.doublesARound')}</div>
        </div>

        <Hairline style={{ margin: '16px 0 14px' }} />

        <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
          {split
            .filter((s) => s.pct > 0)
            .map((s) => (
              <span
                key={s.key}
                style={{ height: 6, flex: s.pct, background: s.tone, borderRadius: 3 }}
              />
            ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {split.map((s) => (
            <div key={s.key} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={LABEL}>{s.label}</div>
              <div style={{ ...NUM, fontSize: 20, color: s.tone, marginTop: 3 }}>
                {s.pct}
                <span style={{ fontSize: 12, fontWeight: 700 }}>%</span>
              </div>
              <div style={{ ...LABEL, fontSize: 8, marginTop: 2 }}>
                {t('courses:holes.scoringBreakdown.nHoles', { count: s.holes })}
              </div>
            </div>
          ))}
        </div>

        {topDoubles.length > 0 && (
          <>
            <div style={{ ...LABEL, marginTop: 20, marginBottom: 10 }}>
              {t('courses:courseDetail.you.doublesFrom')}
            </div>
            <StatRow
              size={18}
              items={topDoubles.map((h) => ({
                label: t('courses:holes.scoringBreakdown.holeN', { n: h.hole_no }),
                value: String(h.doubles_plus),
                tone: OVER,
              }))}
            />
          </>
        )}

        {hasInterpretation && <Caption>{s2Sentence}</Caption>}
      </Panel>

      {/* How your round unfolds - neutral ink ladder by rank */}
      {hasInterpretation && (
        <Panel
          title={t('courses:courseDetail.you.roundUnfolds')}
          aside={t('courses:courseDetail.you.byThird')}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            {thirdSums.map((v, i) => {
              const isWorst = !thirdsEven && i === worstIdx;
              const shade = thirdsEven ? THIRD_LADDER[2] : THIRD_LADDER[thirdRank[i]];
              return (
                <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div
                    style={{ ...NUM, fontSize: 17, color: isWorst ? A.INK : A.MUTE, marginBottom: 6 }}
                  >
                    +{v.toFixed(1)}
                  </div>
                  <div
                    style={{
                      height: Math.max(10, (v / maxThird) * 62),
                      borderRadius: 4,
                      background: shade,
                    }}
                  />
                  <div style={{ ...LABEL, marginTop: 7 }}>{thirdLabels[i]}</div>
                </div>
              );
            })}
          </div>
          <Caption>{s3Sentence}</Caption>
        </Panel>
      )}
    </div>
  );
};

export default ScoringBreakdownSection;

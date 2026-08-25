import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCourseScoringBreakdown,
  type ScoringBreakdownHole,
} from './useCourseScoringBreakdown';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance } from '@/hooks/gam/useMyHolePerformance';
import { useMyRoundsAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { useLegendPulse } from '@/hooks/gam/useLegendPulse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { legendCategoryLabel, formatLegendGap } from '@/lib/gam/visuals';
import { monotonePath } from '@/lib/charts/monotonePath';
import { A, Panel, Hairline, LABEL, NUM, SANS, StatRow, FIGS, TOPAR_RED } from './analytical/tokens';
import { BAND_AMBER } from '@/features/courses/_shared/scoreBands';

/**
 * "Where your shots go" - the CHART-LED You tab
 * (BRIEF_YOU_TAB_CHART_LED, superseding the text-closing V2 panels).
 *
 * Six panels, in order: an average round here, where the shots go (the merge
 * of damaging holes and doubles), how each par plays for you, how your round
 * unfolds, your form here, within reach.
 *
 * DECISIONS CARRIED FORWARD UNCHANGED:
 *   - the field reference is only drawn when both sides are commensurable:
 *     identical derivation (sum of per-hole averages to par) over the SAME
 *     set of hole numbers
 *   - REFERENCE_NOISE_FLOOR governs the WORDS on a row, never the field mark
 *   - the thirds take a neutral ink ladder assigned by rank, NEVER colour and
 *     never a tint - the cumulative curve inherits that rule
 *   - the share denominator is the viewer's own total_over_par, never the
 *     field's
 *   - a caption advises; it never narrates what the chart above it shows
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
 * Noise floor shared with the thirds caption logic - the two MUST move
 * together, and they do: this one constant drives both the caption branch and
 * the ink ladder's gate (BRIEF_THIRDS_FLOOR_AND_DOUBLES_SOURCE s0).
 *
 * UPHELD AT 1.5 per BRIEF_YOU_TAB_CHART_LED 0.2. Below a 1.5 spread the round
 * is even: no third is inked as worst and no fade advice renders. The curve
 * still draws either way - it is the shape of the round, not a claim about it.
 */
const THIRDS_NOISE_FLOOR = 1.5;


/** Neutral ink ladder for the thirds, worst first. Never semantic colour. */
const THIRD_LADDER = ['rgba(248,250,252,0.70)', 'rgba(248,250,252,0.40)', 'rgba(248,250,252,0.18)'];

/** Below this, viewer and field are level - no direction claimed either way. */
const REFERENCE_NOISE_FLOOR = 0.5;

/** Minimum rounds before a trend line is a reading rather than noise. */
const FORM_MIN_ROUNDS = 10;

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
 * A MARGIN IS NOT A SCORE (BRIEF_YOU_TAB_MARGIN_AND_GAPS s1). `gap` is field
 * minus you, so POSITIVE means the member is better than the field.
 */
function marginTone(gap: number): string {
  if (Math.abs(gap) < REFERENCE_NOISE_FLOOR) return A.MUTE;
  return gap > 0 ? A.IMPROVED : A.DRIFTED;
}

/** The field's bar / mark. Neutral - the comparison, not a verdict. */
const FIELD_BAR = A.BODY;
const FIELD_TICK = A.MUTE;

/** A row inside the noise floor: neutral ink, NO direction claimed. */
const LEVEL_BAR = 'rgba(248,250,252,0.34)';

/**
 * The 18-hole chart's quiet stop. A SOLID NEUTRAL, not a lightened red - the
 * cost column has always been ink on this page and red is reserved for the
 * doubles figures (BRIEF_YOU_TAB_CHART_LED s1.3).
 */
const COLUMN_QUIET = A.BODY;

/**
 * One bar on a scale shared with its sibling.
 *
 * THE MEMBER'S BAR IS SHORTER WHEN THEY ARE BETTER. These are to-par values,
 * so a LOWER figure is the better one - do not invert this.
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
      <span style={{ ...LABEL, fontSize: size === 'md' ? 8.5 : 8.5 }}>{label}</span>
      <span style={{ display: 'block', height: h, borderRadius: h / 2, background: A.TRACK }}>
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

/**
 * THE RING IS A CHART, NOT A DECORATION: arc lengths are hole counts, a zero
 * bucket draws NO segment, and the centre figure is the average gross.
 */
const DistributionRing: React.FC<{
  segments: { key: string; value: number; tone: string }[];
  centre: string;
  centreLabel: string;
  size?: number;
  stroke?: number;
}> = ({ segments, centre, centreLabel, size = 118, stroke = 13 }) => {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * c;
      const a = { key: s.key, tone: s.tone, len, offset };
      offset += len;
      return a;
    });
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={A.TRACK} strokeWidth={stroke} />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.tone}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${c - a.len}`}
            strokeDashoffset={-a.offset}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span style={{ ...NUM, fontSize: 26, lineHeight: 1, color: A.INK }}>{centre}</span>
        <span style={{ ...LABEL, fontSize: 8.5 }}>{centreLabel}</span>
      </div>
    </div>
  );
};

interface Props {
  golfCourseId: string | undefined;
}

export const ScoringBreakdownSection: React.FC<Props> = ({ golfCourseId }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const { data, isLoading } = useCourseScoringBreakdown(golfCourseId);
  // Already loaded by the Course tab - React Query serves these from cache.
  const { data: analysis } = useCourseHoleAnalysis(golfCourseId);
  const { data: myHoles } = useMyHolePerformance(user?.id, golfCourseId, {
    enabled: Boolean(user?.id && golfCourseId),
  });
  /** Gross per round in date order at this course - the form panel's series. */
  const { data: myRounds } = useMyRoundsAtCourse(golfCourseId);
  const { data: pulse } = useLegendPulse(user?.id, 60);

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
   * SAME derivation - restricted to the hole numbers present in both
   * populations. If the field analysis does not cover every hole the member
   * has played we draw nothing rather than compare 18 holes with 14.
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
    return { you, field, gap: field - you, holes: shared.length };
  }, [parsed, analysis]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS }}>
        {/*
          RESERVATION MOVES WITH THE REPOINT, NOT AFTER IT.
          BRIEF_ANALYTICAL_SCALE_REPOINT (Part B) lifted LABEL 9 -> 11, which
          grows every StatRow label box. Raised by the WORST case, not the
          typical one: a skeleton may never be LARGER than the state it
          resolves into, but over-reservation settles downward invisibly while
          under-reservation collapses the page upward.
            190 -> 205  (kicker + two READ lines)
            240 -> 255  (stat row: +8.75 worst case with sub-lines, rounded up)
            150 -> 160  (kicker + one READ line)
        */}
        <Panel><Skeleton className="h-[205px] w-full" /></Panel>
        <Panel><Skeleton className="h-[255px] w-full" /></Panel>
        <Panel><Skeleton className="h-[160px] w-full" /></Panel>
      </div>
    );
  }

  if (!parsed) return null;

  const { rounds, total, avgGross, holes } = parsed;
  const hasInterpretation = rounds >= 5;

  const holesByNo = new Map(holes.map((h) => [h.hole_no, h]));

  /** Per-hole field cost, commensurable HOLE BY HOLE. */
  const fieldCostByHole = new Map<number, number>();
  if (analysis?.available) {
    for (const f of analysis.holes ?? []) {
      if (f?.avg_to_par != null) fieldCostByHole.set(f.hole_no, Number(f.avg_to_par));
    }
  }

  // ---------------------------------------------------------------- totals
  const sumPar = holes.reduce((s, h) => s + (h.par_or_better || 0), 0);
  const sumBog = holes.reduce((s, h) => s + (h.bogeys || 0), 0);
  const sumDbl = holes.reduce((s, h) => s + (h.doubles_plus || 0), 0);
  const stratum2Total = sumPar + sumBog + sumDbl || 1;
  const pctPar = Math.round((sumPar / stratum2Total) * 100);
  const pctBog = Math.round((sumBog / stratum2Total) * 100);
  const pctDbl = Math.max(0, 100 - pctPar - pctBog);
  const doublesPerRound = rounds > 0 ? sumDbl / rounds : 0;

  // ------------------------------------------------- panel 2, the 18 holes
  const ordered = [...holes].sort((a, b) => a.hole_no - b.hole_no);
  const damagingAll = [...holes]
    .filter((h) => (h.shots_over_par || 0) > 0)
    .sort((a, b) => b.shots_over_par - a.shots_over_par);
  const damaging = damagingAll.slice(0, 3);
  const worstSet = new Set(damaging.map((h) => h.hole_no));
  const columnMax = Math.max(...ordered.map((h) => h.shots_over_par || 0), 0.1);

  const damagingFieldCosts = damaging
    .map((h) => fieldCostByHole.get(h.hole_no))
    .filter((v): v is number => v != null);
  const anyField = damagingFieldCosts.length > 0;
  const damageScale = Math.max(damaging[0]?.shots_over_par || 0.1, ...damagingFieldCosts, 0.1) * 1.1;

  /**
   * Share denominator: the member's OWN total shots over par here. Never the
   * field total - "x% of everything you drop here" is a share of the viewer.
   */
  const s1Sum = +damaging.reduce((s, h) => s + h.shots_over_par, 0).toFixed(1);
  const s1Share = total > 0 ? Math.round((s1Sum / total) * 100) : 0;
  const restShare = Math.max(0, 100 - s1Share);
  const s1HoleLabels = damaging.map((h) => String(h.hole_no));
  const s1Advice = t('courses:holes.scoringBreakdown.s1Advice', {
    holes:
      s1HoleLabels.length === 1
        ? t('courses:holes.scoringBreakdown.holeOne', { n: s1HoleLabels[0] })
        : t('courses:holes.scoringBreakdown.holeMany', { list: listGrammar(s1HoleLabels) }),
  });

  // --------------------------------------------- panel 3, par-type scoring
  /**
   * RECONCILIATION. Every played hole belongs to exactly one par bucket and
   * each bucket sums its own holes' shots_over_par, so
   *   sum(parTypes.you) === total_over_par
   * and, on the field side, sum(parTypes.field) === sum of the field's
   * per-hole avg_to_par over the SAME holes. A breakdown that does not add to
   * the figure above it is a fault; the assertion below is the guard.
   */
  const parTypes = (() => {
    const byPar = new Map<number, { you: number; field: number; covered: boolean; holes: number }>();
    for (const h of ordered) {
      const bucket = byPar.get(h.par) ?? { you: 0, field: 0, covered: true, holes: 0 };
      bucket.you += h.shots_over_par || 0;
      bucket.holes += 1;
      const f = fieldCostByHole.get(h.hole_no);
      if (f == null) bucket.covered = false;
      else bucket.field += f;
      byPar.set(h.par, bucket);
    }
    return [...byPar.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([par, b]) => ({ par, ...b }));
  })();
  const parTypesYouSum = +parTypes.reduce((s, p) => s + p.you, 0).toFixed(2);
  const parTypeScale =
    Math.max(
      ...parTypes.map((p) => Math.max(p.you, p.covered ? p.field : 0)),
      0.1,
    ) * 1.1;

  // ------------------------------------------------- panel 4, the unfolding
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
  let worstIdx = 0;
  let bestIdx = 0;
  thirdSums.forEach((v, i) => {
    if (!thirdHas[i]) return;
    if (v > thirdSums[worstIdx]) worstIdx = i;
    if (v < thirdSums[bestIdx] || !thirdHas[bestIdx]) bestIdx = i;
  });
  /**
   * THE DENOMINATOR IS THE ROUND'S OWN DAMAGE, not the worst third.
   *
   * A track needs a scale, and scaling each third against the largest of the
   * three would make the worst third 100% full in EVERY round: the bar would
   * carry no information the ink ladder does not already carry, and no two
   * rounds or courses would compare. So the fill is each third's SHARE of the
   * shots this round dropped here - the same denominator the share figures
   * already use (the viewer's own total over par, never the field's). The three
   * fills sum to 100%, which is what makes "the back six costs you half your
   * round" readable straight off the bars.
   *
   * A third played UNDER par contributes no damage: it is floored at zero and
   * renders an empty track rather than a negative width. If no third dropped a
   * shot there is nothing to apportion and all three tracks read empty.
   */
  const thirdDamage = thirdSums.map((v) => Math.max(0, v));
  const thirdDamageTotal = thirdDamage.reduce((a, b) => a + b, 0);
  const thirdShares = thirdDamage.map((v) =>
    thirdDamageTotal > 0 ? Math.round((v / thirdDamageTotal) * 100) : 0,
  );
  const spread = +(thirdSums[worstIdx] - thirdSums[bestIdx]).toFixed(1);
  /** Below the floor: ink nothing, claim nothing. The curve still draws. */
  const thirdsEven = spread < THIRDS_NOISE_FLOOR || worstIdx === bestIdx;
  /** Rank 0 = worst third. Drives the ink ladder; even rounds get one shade. */
  const thirdRank = [0, 1, 2]
    .slice()
    .sort((a, b) => thirdSums[b] - thirdSums[a])
    .reduce<Record<number, number>>((acc, idx, rank) => {
      acc[idx] = rank;
      return acc;
    }, {});

  /** Cumulative shots dropped, hole 1 to 18. Monotone cubic, never a spline. */
  const cumulative = (() => {
    const W = 300;
    const H = 78;
    const pts: { x: number; y: number }[] = [];
    let run = 0;
    const seq = ordered;
    if (seq.length < 2) return null;
    seq.forEach((h, i) => {
      run += h.shots_over_par || 0;
      pts.push({ x: (i / (seq.length - 1)) * W, y: run });
    });
    const max = Math.max(...pts.map((p) => p.y), 0.1);
    const scaled = pts.map((p) => ({ x: p.x, y: H - (p.y / max) * (H - 4) }));
    return { W, H, d: monotonePath(scaled), area: `${monotonePath(scaled)} L${W},${H} L0,${H} Z`, total: run };
  })();

  const s3Advice = thirdsEven
    ? t('courses:holes.scoringBreakdown.s3AdviceEven')
    : worstIdx === 2
      ? t('courses:holes.scoringBreakdown.s3AdviceLate')
      : worstIdx === 0
        ? t('courses:holes.scoringBreakdown.s3AdviceEarly')
        : t('courses:holes.scoringBreakdown.s3AdviceMiddle');

  // ----------------------------------------------------- panel 5, the form
  /**
   * Gross per round in date order at this course. useMyRoundsAtCourse returns
   * the most recent 20, newest first - reversed here so the curve reads left
   * to right in time. Below FORM_MIN_ROUNDS the panel does not render: a trend
   * over four rounds is noise, and NO next round is ever projected.
   */
  const form = (() => {
    const rows = (myRounds ?? []).filter((r) => r.grossScore != null);
    if (rows.length < FORM_MIN_ROUNDS) return null;
    const series = [...rows].reverse().map((r) => Number(r.grossScore));
    const best = Math.min(...series);
    const worst = Math.max(...series);
    const span = worst - best || 1;
    const last10 = series.slice(-10);
    const prior = series.slice(0, -10);
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const recentAvg = avg(last10);
    const priorAvg = prior.length >= 5 ? avg(prior.slice(-10)) : null;
    return { series, best, worst, span, recentAvg, priorAvg, bestIndex: series.indexOf(best) };
  })();

  // ------------------------------------------------ panel 6, within reach
  const birdied = (() => {
    const rows = myHoles ?? [];
    if (rows.length === 0) return null;
    const withBirdie = rows.filter((r) => (r.birdie_count || 0) > 0 || (r.eagle_or_better_count || 0) > 0);
    const outstanding = rows.filter((r) => (r.birdie_count || 0) === 0 && (r.eagle_or_better_count || 0) === 0);
    return {
      done: withBirdie.length,
      of: rows.length,
      lastOne: outstanding.length === 1 ? outstanding[0].hole_no : null,
    };
  })();

  /**
   * The nearest crown chase, COURSE SCOPED. useLegendPulse is member-wide, so
   * the rows are filtered to this course - never a chase somewhere else, and
   * never an invented one. A LEVEL value is said, not drawn as a distance.
   */
  const chase = (() => {
    if (!golfCourseId) return null;
    const rows = (pulse ?? []).filter(
      (p) => p.course_id === golfCourseId && (p.kind === 'chase' || p.kind === 'threat'),
    );
    if (rows.length === 0) return null;
    const withGap = rows.filter((p) => p.gap_to_first != null);
    if (withGap.length === 0) return null;
    const nearest = withGap.reduce((a, b) =>
      Math.abs(b.gap_to_first as number) < Math.abs(a.gap_to_first as number) ? b : a,
    );
    const gap = Number(nearest.gap_to_first);
    return {
      label: legendCategoryLabel[nearest.category] ?? nearest.category,
      level: Math.abs(gap) < 0.0001,
      gapText: formatLegendGap(nearest.category, Math.abs(gap)),
      rank: nearest.viewer_rank,
    };
  })();

  const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={CAPTION}>{children}</p>
  );

  /** Round ONCE so the subtraction a member can do on screen is always true. */
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const disp = reference
    ? (() => {
        const you = r1(reference.you);
        const field = r1(reference.field);
        return { you, field, gap: r1(field - you) };
      })()
    : null;

  const bestGross = (() => {
    const rows = (myRounds ?? []).filter((r) => r.grossScore != null);
    if (rows.length === 0) return null;
    return Math.min(...rows.map((r) => Number(r.grossScore)));
  })();

  const split = [
    { key: 'par', label: t('courses:courseDetail.you.parOrBetter'), pct: pctPar, holes: sumPar, tone: UNDER },
    { key: 'bog', label: t('courses:holes.scoringBreakdown.bogey'), pct: pctBog, holes: sumBog, tone: BAND_AMBER },
    { key: 'dbl', label: t('courses:courseDetail.you.doubleOrWorse'), pct: pctDbl, holes: sumDbl, tone: OVER },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS, ...FIGS }}>
      {/* 1 - AN AVERAGE ROUND HERE */}
      <Panel
        title={t('courses:courseDetail.you.avgRound')}
        aside={t('courses:courseDetail.you.roundsCount', { count: rounds })}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <DistributionRing
            segments={[
              { key: 'par', value: sumPar, tone: UNDER },
              { key: 'bog', value: sumBog, tone: BAND_AMBER },
              { key: 'dbl', value: sumDbl, tone: OVER },
            ]}
            centre={avgGross != null ? avgGross.toFixed(1) : signed(total)}
            centreLabel={
              avgGross != null
                ? t('courses:courseDetail.you.avgGross')
                : t('courses:courseDetail.you.shotsOverPar')
            }
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {split.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  aria-hidden
                  style={{ width: 8, height: 8, borderRadius: 2, background: s.tone, flexShrink: 0 }}
                />
                <span style={{ ...LABEL, fontSize: 8.5, flex: 1, minWidth: 0, whiteSpace: 'pre-line' }}>
                  {s.label}
                </span>
                <span style={{ ...NUM, fontSize: 16, color: A.INK }}>
                  {s.pct}
                  <span style={{ fontSize: 11 }}>%</span>
                </span>
                <span style={{ ...LABEL, fontSize: 8.5, width: 52, textAlign: 'right' }}>
                  {t('courses:holes.scoringBreakdown.nHoles', { count: s.holes })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* The field bars only where the two sides are commensurable. */}
        {disp && (
          <>
            <Hairline style={{ margin: '16px 0 14px' }} />
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
          size={19}
          items={[
            {
              label: t('courses:courseDetail.you.doublesARound'),
              value: (+doublesPerRound.toFixed(1)).toFixed(1),
            },
            ...(bestGross != null
              ? [{ label: t('courses:holes.scoringBreakdown.bestHere'), value: String(bestGross) }]
              : [{ label: t('courses:courseDetail.you.roundsLabel'), value: String(rounds) }]),
          ]}
        />
      </Panel>

      {/* 2 - WHERE THE SHOTS GO (the merge) */}
      {damagingAll.length > 0 && (
        <Panel
          title={t('courses:holes.scoringBreakdown.mergeTitle')}
          aside={t('courses:holes.scoringBreakdown.mergeAside')}
        >
          {/* a. every hole, not five - the fourteen quiet ones are the point */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 92 }}>
            {ordered.map((h) => {
              const v = h.shots_over_par || 0;
              const isWorst = worstSet.has(h.hole_no);
              const barH = Math.max(2, (v / columnMax) * 62);
              return (
                <div
                  key={h.hole_no}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                  }}
                >
                  {isWorst && (
                    <span style={{ ...NUM, fontSize: 8.5, color: A.INK }}>{v.toFixed(1)}</span>
                  )}
                  <span
                    aria-hidden
                    style={{
                      display: 'block',
                      width: '100%',
                      height: barH,
                      borderRadius: 2,
                      background: isWorst ? A.INK : COLUMN_QUIET,
                    }}
                  />
                  <span
                    style={{
                      ...LABEL,
                      fontSize: 8.5,
                      letterSpacing: 0,
                      color: isWorst ? A.INK : A.MUTE,
                    }}
                  >
                    {h.hole_no}
                  </span>
                </div>
              );
            })}
          </div>

          {/* b. the share, as a mark you can point at */}
          <Hairline style={{ margin: '14px 0 12px' }} />
          <div style={{ display: 'flex', gap: 3 }}>
            <span
              style={{
                height: 8,
                borderRadius: 4,
                background: A.INK,
                flex: Math.max(1, s1Share),
              }}
            />
            <span
              style={{
                height: 8,
                borderRadius: 4,
                background: COLUMN_QUIET,
                flex: Math.max(1, restShare),
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span style={{ ...LABEL, fontSize: 8.5, color: A.INK }}>
              {t('courses:holes.scoringBreakdown.shareTop', { share: s1Share })}
            </span>
            <span style={{ ...LABEL, fontSize: 8.5 }}>
              {t('courses:holes.scoringBreakdown.shareRest', {
                count: Math.max(0, ordered.length - damaging.length),
                share: restShare,
              })}
            </span>
          </div>

          {/* c. the three the coaching line names, in detail */}
          <Hairline style={{ margin: '14px 0 10px' }} />
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
             * COMMENSURABILITY, PER ROW. The row gets a mark and a verdict only
             * where the field analysis reads THIS hole. The floor governs the
             * WORDS; the field tick renders in every case.
             */
            const fieldCost = fieldCostByHole.get(h.hole_no) ?? null;
            const gap = fieldCost == null ? null : fieldCost - h.shots_over_par;
            const level = gap != null && Math.abs(gap) < REFERENCE_NOISE_FLOOR;
            const barTone = gap == null ? A.INK : level ? LEVEL_BAR : marginTone(gap);
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
            const dbl = h.doubles_plus || 0;
            const dblShare = sumDbl > 0 ? Math.round((dbl / sumDbl) * 100) : 0;
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
                  <span style={{ ...LABEL, fontSize: 8.5, display: 'block' }}>
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
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          top: -1.5,
                          left: `${notchW}%`,
                          width: 2,
                          height: 10,
                          borderRadius: 1,
                          background: FIELD_TICK,
                          transform: 'translateX(-1px)',
                        }}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginTop: 5,
                    }}
                  >
                    {verdict && (
                      <span style={{ ...LABEL, fontSize: 8.5, color: level ? A.MUTE : barTone }}>
                        {verdict}
                      </span>
                    )}
                    {dbl > 0 && (
                      <span style={{ ...LABEL, fontSize: 8.5, color: OVER }}>
                        {t('courses:holes.scoringBreakdown.doublesShare', {
                          count: dbl,
                          share: dblShare,
                        })}
                      </span>
                    )}
                  </span>
                </span>
                <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'right' }}>
                  +{h.shots_over_par.toFixed(1)}
                </span>
              </div>
            );
          })}
          {anyField && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}>
              <span
                aria-hidden
                style={{ display: 'block', width: 2, height: 9, borderRadius: 1, background: FIELD_TICK }}
              />
              <span style={{ ...LABEL, fontSize: 8.5 }}>
                {t('courses:holes.scoringBreakdown.vsFieldLegend')}
              </span>
            </div>
          )}

          {/* d. one line, and it advises */}
          <Caption>
            {hasInterpretation ? s1Advice : t('courses:holes.scoringBreakdown.moreRoundsHint')}
          </Caption>
        </Panel>
      )}

      {/* 3 - HOW EACH PAR PLAYS FOR YOU */}
      {parTypes.length > 0 && (
        <Panel
          title={t('courses:holes.scoringBreakdown.parTypeTitle')}
          aside={t('courses:holes.scoringBreakdown.parTypeAside')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {parTypes.map((p) => {
              const barW = Math.max(3, Math.min(100, (Math.max(0, p.you) / parTypeScale) * 100));
              const tickW = p.covered
                ? Math.max(0, Math.min(100, (Math.max(0, p.field) / parTypeScale) * 100))
                : null;
              // field minus you: POSITIVE means the member is better here.
              const margin = p.covered ? p.field - p.you : null;
              return (
                <div key={p.par} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 44px 52px', gap: 9, alignItems: 'center' }}>
                  <span style={{ ...LABEL, fontSize: 8.5 }}>
                    {t('courses:holes.scoringBreakdown.parLabel', { n: p.par })}
                  </span>
                  <span style={{ display: 'block', position: 'relative', height: 7, borderRadius: 3.5, background: A.TRACK }}>
                    <span
                      style={{
                        display: 'block',
                        height: 7,
                        borderRadius: 3.5,
                        width: `${barW}%`,
                        background: A.INK,
                      }}
                    />
                    {tickW != null && (
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          top: -1.5,
                          left: `${tickW}%`,
                          width: 2,
                          height: 10,
                          borderRadius: 1,
                          background: FIELD_TICK,
                          transform: 'translateX(-1px)',
                        }}
                      />
                    )}
                  </span>
                  <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'right' }}>
                    {signed(p.you)}
                  </span>
                  <span
                    style={{
                      ...NUM,
                      fontSize: 13,
                      color: margin == null ? A.MUTE : marginTone(margin),
                      textAlign: 'right',
                    }}
                  >
                    {margin == null ? '' : signed(Math.abs(margin) < REFERENCE_NOISE_FLOOR ? 0 : margin)}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ ...LABEL, fontSize: 8.5 }}>
              {t('courses:holes.scoringBreakdown.parTypeTotal')}
            </span>
            {/* Reconciles with the headline by construction - see the comment
                above parTypes: every played hole lands in exactly one bucket. */}
            <span style={{ ...NUM, fontSize: 13, color: A.INK }}>{signed(parTypesYouSum)}</span>
          </div>
        </Panel>
      )}

      {/* 4 - HOW YOUR ROUND UNFOLDS */}
      {hasInterpretation && cumulative && (
        <Panel
          title={t('courses:courseDetail.you.roundUnfolds')}
          aside={t('courses:courseDetail.you.byThird')}
        >
          <svg
            viewBox={`0 0 ${cumulative.W} ${cumulative.H}`}
            width="100%"
            height={cumulative.H}
            preserveAspectRatio="none"
            aria-hidden
            style={{ display: 'block' }}
          >
            <path d={cumulative.area} fill="rgba(255,255,255,0.06)" />
            <path
              d={cumulative.d}
              fill="none"
              stroke={A.INK}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            {thirdSums.map((v, i) => {
              const isWorst = !thirdsEven && i === worstIdx;
              const shade = thirdsEven ? THIRD_LADDER[2] : THIRD_LADDER[thirdRank[i]];
              return (
                <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div style={{ ...NUM, fontSize: 18, color: isWorst ? A.INK : A.MUTE }}>
                    +{v.toFixed(1)}
                  </div>
                  {/* Neutral ink by rank. NEVER semantic colour, never a tint. */}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: A.TRACK,
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        width: `${thirdShares[i]}%`,
                        background: shade,
                      }}
                    />
                  </div>
                  <div style={{ ...LABEL, fontSize: 8.5, marginTop: 7 }}>{thirdLabels[i]}</div>
                </div>
              );
            })}

          </div>
          <Caption>{s3Advice}</Caption>
        </Panel>
      )}

      {/* 5 - YOUR FORM HERE */}
      {form && (
        <Panel
          title={t('courses:holes.scoringBreakdown.formTitle')}
          aside={t('courses:holes.scoringBreakdown.formAside', { count: form.series.length })}
        >
          {(() => {
            const W = 300;
            const H = 96;
            const pad = 10;
            /**
             * WORSE IS HIGHER. A gross of 84 sits ABOVE a gross of 72, so the
             * mapping SUBTRACTS from the plot height - a falling gross draws a
             * falling line.
             */
            const y = (v: number) => pad + (1 - (v - form.best) / form.span) * (H - pad * 2);
            const x = (i: number) => (i / (form.series.length - 1)) * W;
            const pts = form.series.map((v, i) => ({ x: x(i), y: y(v) }));
            const zone = (v: number) => {
              const k = (v - form.best) / form.span;
              return k <= 0.33 ? A.GREEN : k <= 0.66 ? A.AMBER : A.RED;
            };
            const line = monotonePath(pts);
            /** Area under the curve, closed along the plot floor. */
            const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
            const bi = form.bestIndex;

            const delta = form.priorAvg == null ? null : form.priorAvg - form.recentAvg;
            /** The fill carries the direction of travel, as on the index tile. */
            const fillTone =
              delta == null || Math.abs(delta) < 0.5 ? A.AMBER : delta > 0 ? A.IMPROVED : A.DRIFTED;

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                  <span style={{ ...NUM, fontSize: 30, lineHeight: 1, color: A.INK }}>
                    {form.recentAvg.toFixed(1)}
                  </span>
                  {delta == null ? (
                    <span style={{ ...LABEL, fontSize: 8.5 }}>
                      {t('courses:holes.scoringBreakdown.formLast10')}
                    </span>
                  ) : (
                    <span
                      style={{
                        ...LABEL,
                        fontSize: 8.5,
                        color: Math.abs(delta) < 0.5 ? A.MUTE : delta > 0 ? A.IMPROVED : A.DRIFTED,
                      }}
                    >
                      {Math.abs(delta) < 0.5
                        ? t('courses:holes.scoringBreakdown.formLevel')
                        : delta > 0
                          ? t('courses:holes.scoringBreakdown.formBetter', { n: Math.abs(delta).toFixed(1) })
                          : t('courses:holes.scoringBreakdown.formWorse', { n: Math.abs(delta).toFixed(1) })}
                    </span>
                  )}
                </div>
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  width="100%"
                  height={H}
                  preserveAspectRatio="none"
                  aria-hidden
                  style={{ display: 'block' }}
                >
                  <defs>
                    <linearGradient id="form-trend-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={fillTone} stopOpacity={0.42} />
                      <stop offset="100%" stopColor={fillTone} stopOpacity={0.03} />
                    </linearGradient>
                    {/* One stop per round, coloured by its zone, so a good spell
                        renders green and a bad one red along one continuous line. */}
                    <linearGradient id="form-trend-stroke" x1="0" y1="0" x2="1" y2="0">
                      {form.series.map((v, i) => (
                        <stop
                          key={i}
                          offset={`${(i / (form.series.length - 1)) * 100}%`}
                          stopColor={zone(v)}
                        />
                      ))}
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#form-trend-fill)" />
                  {/* The white halo is what stops the line reading flat on its own fill. */}
                  <path
                    d={line}
                    fill="none"
                    stroke={A.INK}
                    strokeOpacity={0.6}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={line}
                    fill="none"
                    stroke="url(#form-trend-stroke)"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={pts[bi].x} cy={pts[bi].y} r={3.4} fill={A.GREEN} stroke={A.INK} strokeWidth={1.6} />

                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ ...LABEL, fontSize: 8.5 }}>
                    {t('courses:holes.scoringBreakdown.formBest', { n: form.best })}
                  </span>
                  <span style={{ ...LABEL, fontSize: 8.5 }}>
                    {t('courses:holes.scoringBreakdown.formWorstHere', { n: form.worst })}
                  </span>
                </div>
              </>
            );
          })()}
        </Panel>
      )}

      {/* 6 - WITHIN REACH */}
      {(birdied || chase) && (
        <Panel
          title={t('courses:holes.scoringBreakdown.reachTitle')}
          aside={t('courses:holes.scoringBreakdown.reachAside')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {birdied && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>
                    {t('courses:holes.scoringBreakdown.reachBirdies')}
                  </div>
                  {birdied.lastOne != null && (
                    <div style={{ ...LABEL, fontSize: 8.5, marginTop: 4 }}>
                      {t('courses:courseDetail.you.oneToGoHole', { n: birdied.lastOne })}
                    </div>
                  )}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: A.TRACK,
                      marginTop: 7,
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        width: `${Math.round((birdied.done / Math.max(1, birdied.of)) * 100)}%`,
                        background: A.INK,
                      }}
                    />
                  </div>
                </div>
                <span style={{ ...NUM, fontSize: 17, color: A.INK, whiteSpace: 'nowrap' }}>
                  {t('courses:holes.scoringBreakdown.reachOf', { done: birdied.done, of: birdied.of })}
                </span>
              </div>
            )}
            {chase && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{chase.label}</div>
                  <div style={{ ...LABEL, fontSize: 8.5, marginTop: 4 }}>
                    {/* A TIE IS NOT A DISTANCE. */}
                    {chase.level
                      ? t('courses:holes.scoringBreakdown.reachChaseLevel')
                      : t('courses:holes.scoringBreakdown.reachChaseGap', { gap: chase.gapText })}
                  </div>
                </div>
                {chase.rank != null && (
                  <span style={{ ...NUM, fontSize: 17, color: A.INK }}>#{chase.rank}</span>
                )}
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
};

export default ScoringBreakdownSection;

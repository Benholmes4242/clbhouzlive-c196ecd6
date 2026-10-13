/**
 * BRIEF_COURSE_TAB_REBUILD §3.4 — HOW IT PLAYS, with the §3.10 drill-down.
 *
 * Flat section, no Panel (Panel itself untouched). It absorbs the old howItPlays
 * card, the parTypes card and the holes preview: the chart, four figures and the
 * course-wide distribution stay here, and hole-by-hole, how each par plays and
 * the SI ladder move behind ONE named link — "All 18 holes ›".
 *
 * THE CHART IS LOCAL TO THIS SECTION. Eighteen independent field bars carry an
 * optional amber marker for the viewer on the same per-hole scale. There is no
 * connecting curve: this is a comparison across holes, not a round sequence.
 * The bars are a single neutral tone — difficulty is carried by height, and amber is reserved for the viewer's own line.
 *
 * STATE A (>= 20 pooled rounds) AND STATE B (1–19) ARE BUILT TOGETHER. Under the
 * threshold there is NO chart, no figures and no distribution: one round's
 * "distribution" is a scorecard wearing a percentage. The drill-down is withheld
 * with them, because it is the same sample seen closer.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { A, BAR_RADIUS, FIGS, RAMP_TOPAR, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { BUCKETS, courseBucketShares, type BucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import AboutSection, { ABOUT_KICKER, AboutHairline, aboutFig } from './AboutSection';
import AllHolesSheet, { CompactHoleRow } from './AllHolesSheet';

const CHART_HEIGHT = 82;
const GAP = 3;

/** Dominant score bucket of one hole: BUCKETS order, strictly-greater scan, so an
 *  exact tie resolves to the better score. Null shares → flat A.DIM. */
function dominantColour(hole: CourseHole): string {
  const seg = courseBucketShares([hole]);
  if (!seg) return A.DIM;
  let best: keyof typeof RAMP_TOPAR | null = null;
  let bestV = -Infinity;
  for (const b of BUCKETS) {
    const v = seg[b.key as keyof BucketShares];
    if (v > bestV) { bestV = v; best = b.key as keyof typeof RAMP_TOPAR; }
  }
  return best ? RAMP_TOPAR[best] : A.DIM;
}

/** Eighteen independent field comparisons. This intentionally does not reuse ShapeChart. */
const LocalHoleChart: React.FC<{
  holes: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  hasYou: boolean;
}> = ({ holes, myByHole, hasYou }) => {
  // One shared scale for field AND member, so a member worse than the field draws
  // ABOVE the bar instead of being clamped level with it (the old marker's bug).
  const scaleMax = Math.max(
    0.01,
    ...holes.map((h) => Math.max(0, h.avg_to_par)),
    ...(hasYou ? [...myByHole.values()].map((m) => Math.max(0, m.avg_to_par)) : []),
  );

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Runs of CONSECUTIVE played holes. Gaps break the line — never bridged, since
  // joining across an unplayed hole would invent rounds that were never played.
  const runs: Array<Array<[number, number]>> = [];
  if (hasYou && W > 0 && holes.length > 0) {
    const bw = (W - (holes.length - 1) * GAP) / holes.length;
    let cur: Array<[number, number]> = [];
    holes.forEach((hole, i) => {
      const mine = myByHole.get(hole.hole_no)?.avg_to_par;
      if (mine == null || !Number.isFinite(mine)) {
        if (cur.length) runs.push(cur);
        cur = [];
        return;
      }
      const x = i * (bw + GAP) + bw / 2;
      const y = CHART_HEIGHT - (Math.max(0, mine) / scaleMax) * CHART_HEIGHT;
      cur.push([x, y]);
    });
    if (cur.length) runs.push(cur);
  }

  return (
    <div>
      <div ref={wrapRef} aria-hidden="true" style={{ position: 'relative' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${holes.length}, minmax(0, 1fr))`,
          alignItems: 'end',
          gap: GAP,
          height: CHART_HEIGHT,
        }}
      >
        {holes.map((hole) => {
          const fieldValue = Math.max(0, hole.avg_to_par);
          const barHeight = Math.max(2, (fieldValue / scaleMax) * CHART_HEIGHT);

          return (
            /* COLOUR = THE HOLE'S MOST COMMON SCORE, from RAMP_TOPAR. This used to be
               neutral because the earlier two-step red was A.RED (#E24B3F) — the same hex
               as RAMP_TOPAR.birdie in the distribution strip below — so one value meant
               "hardest hole" here and "birdie" there. That objection is now SATISFIED, not
               broken: red means birdie in BOTH places, and the strip below is this chart's
               key. Height still carries difficulty and remains its ONLY encoding: never add
               a difficulty hue here. DIFFICULTY_RAMP is still the wrong answer. Amber
               carries the viewer, as the line drawn over these bars. */
            <span
              key={hole.hole_no}
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
                height: barHeight,
                borderRadius: BAR_RADIUS,
                background: dominantColour(hole),
                overflow: 'hidden',
              }}
            />
          );
        })}
      </div>
      {/* SOLID, not dashed: this is the member's real per-hole average. The connect
          intro's line is dashed because it is an invented example — dashed means
          illustrative, solid means measured. Static: no animation on a data surface. */}
      {hasYou && W > 0 ? (
        <svg
          viewBox={`0 0 ${W} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        >
          {runs.map((run, k) =>
            run.length === 1 ? (
              <circle key={k} cx={run[0][0]} cy={run[0][1]} r={2} fill={A.AMBER} />
            ) : (
              <polyline
                key={k}
                points={run.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke={A.AMBER}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
        </svg>
      ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          color: A.DIM,
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 700,
          ...FIGS,
        }}
      >
        <span>1</span>
        <span>9</span>
        <span>18</span>
      </div>
    </div>
  );
};

export const CourseDistributionSummary: React.FC<{ shares: BucketShares }> = ({ shares }) => {
  const { t } = useTranslation('courses');
  const columns = [
    { key: 'birdie' as const, color: RAMP_TOPAR.birdie, label: t('holes.preview.legendBirdie') },
    { key: 'par' as const, color: RAMP_TOPAR.par, label: t('holes.preview.legendPar') },
    { key: 'bogey' as const, color: RAMP_TOPAR.bogey, label: t('holes.preview.legendBogey') },
    { key: 'double' as const, color: RAMP_TOPAR.double, label: t('holes.preview.legendDouble') },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 18 }}>
      {columns.map((column) => (
        <div key={column.key} style={{ minWidth: 0 }}>
          <div style={{ height: 4, width: '100%', borderRadius: BAR_RADIUS, background: column.color }} />
          <div style={{ marginTop: 7, color: A.INK, fontFamily: SANS, fontSize: 13, fontWeight: 700, ...FIGS }}>
            {Math.round(shares[column.key] * 100)}%
          </div>
          <div style={{ ...ABOUT_KICKER, marginTop: 3 }}>{column.label}</div>
        </div>
      ))}
    </div>
  );
};

/** §3.4 b — a labelled figure in the four-across row. */
const Figure: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = A.INK,
}) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ ...aboutFig(21, tone), lineHeight: 1 }}>{value}</div>
    <div style={{ ...ABOUT_KICKER, marginTop: 5, whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

/** A sentence where a chart cannot honestly go (§4 states B and C). */
const Sentence: React.FC<{ children: React.ReactNode; quiet?: boolean }> = ({ children, quiet }) => (
  <p
    style={{
      margin: 0,
      fontSize: 13,
      lineHeight: 1.55,
      fontWeight: quiet ? 600 : 700,
      color: quiet ? A.MUTE : A.INK,
      fontFamily: SANS,
    }}
  >
    {children}
  </p>
);


/** §4 — the pooled-round threshold below which no course picture is drawn. */
export const MIN_ROUNDS = 20;

interface HowItPlaysProps {
  courseId: string;
  courseName?: string | null;
}

const HowItPlays: React.FC<HowItPlaysProps> = ({ courseId, courseName }) => {
  const { t } = useTranslation('courses');
  const [searchParams, setSearchParams] = useSearchParams();
  const [allHolesOpen, setAllHolesOpen] = React.useState(false);
  const { user } = useSupabaseSession();
  const viewerId = user?.id;
  const { data: connection } = useWhsConnection(viewerId);
  const { data } = useCourseHoleAnalysis(courseId);
  const { data: courseStats } = useCourseStatsDetail(courseId, true);
  const canLoadMine = Boolean(viewerId && courseId && connection);
  const { data: myPerf } = useMyHolePerformance(viewerId, courseId, { enabled: canLoadMine });

  const holes = React.useMemo(
    () => [...(data?.holes ?? [])].sort((a, b) => a.hole_no - b.hole_no),
    [data?.holes],
  );

  const myByHole = React.useMemo(() => {
    const m = new Map<number, MyHolePerformanceRow>();
    (myPerf ?? []).forEach((r) => m.set(r.hole_no, r));
    return m;
  }, [myPerf]);

  const pooled = Number(data?.total_rounds ?? 0);
  const courseRounds = Number(courseStats?.rounds_tracked ?? 0);
  /* Same hold as the panel: a connected member's own rows decide whether there
     is a field at all, so nothing renders that would then change shape. */
  const awaitingMine = canLoadMine && myPerf == null;

  const meta =
    courseRounds > 0
      ? t('courseDetail.plays.rounds', { count: courseRounds, rounds: formatNumber(courseRounds) })
      : null;

  const heading = t('courseDetail.sections.howItPlays');

  const stats = React.useMemo(() => {
    if (holes.length === 0) return null;
    const fieldAvg = holes.reduce((s, h) => s + h.avg_to_par, 0) / holes.length;
    const mineRows = holes
      .map((h) => myByHole.get(h.hole_no))
      .filter((r): r is MyHolePerformanceRow => r != null);
    const yourAvg =
      mineRows.length > 0 ? mineRows.reduce((s, r) => s + r.avg_to_par, 0) / mineRows.length : null;
    const hardest = holes.reduce((m, h) => (h.avg_to_par > m.avg_to_par ? h : m), holes[0]);
    const easiest = holes.reduce((m, h) => (h.avg_to_par < m.avg_to_par ? h : m), holes[0]);
    return { fieldAvg, yourAvg, hardest, easiest };
  }, [holes, myByHole]);

  const openDrillDown = () => {
    analyticsEvents.track('course_all_18_holes', { course_id: courseId, holes: holes.length });
    const next = new URLSearchParams(searchParams);
    next.set('sheet', 'holes');
    setSearchParams(next, { replace: true });
  };

  React.useEffect(() => {
    setAllHolesOpen(searchParams.get('sheet') === 'holes');
  }, [searchParams]);

  const closeDrillDown = () => {
    setAllHolesOpen(false);
    if (searchParams.get('sheet') !== 'holes') return;
    const next = new URLSearchParams(searchParams);
    next.delete('sheet');
    setSearchParams(next, { replace: true });
  };

  const allHolesSheet = (
    <AllHolesSheet
      open={allHolesOpen}
      onClose={closeDrillDown}
      courseId={courseId}
      courseName={courseName ?? ''}
    />
  );

  /* ── STATE C — nothing has been played here. The reader decides the second
        line, not the course; both sentences are PORTED, not rewritten. ── */
  if (courseRounds === 0) {
    /* Still resolving — say nothing rather than the wrong thing. */
    if (courseStats == null && data == null) return null;
    return (
      <>
        <AboutSection heading={heading}>
          <Sentence>
            {t('discover.scores.noOnePlayed', 'No one has played {{course}} yet.', {
              course: courseName ?? '\u2014',
            })}
          </Sentence>
          <div style={{ marginTop: 6 }}>
            <Sentence quiet>
              {connection
                ? t('discover.scores.beTheFirst', 'Play it and you will be the first.')
                : t('discover.scores.connectToAppear')}
            </Sentence>
          </div>
        </AboutSection>
        {allHolesSheet}
      </>
    );
  }

  /* ── STATE B — 1 to 19 rounds. No chart, no figures, no distribution: a
        sample this small is a scorecard, and drawing it as a course picture is
        the fault this brief exists to remove. ── */
  const drawable = pooled >= MIN_ROUNDS && holes.length > 0 && stats != null;
  if (!drawable) {
    if (awaitingMine) return null;
    return (
      <>
        <AboutSection heading={heading} meta={meta}>
          <Sentence quiet>
            {t('courseDetail.plays.notEnoughRounds', {
              count: courseRounds,
              rounds: formatNumber(courseRounds),
            })}
          </Sentence>
        </AboutSection>
        {allHolesSheet}
      </>
    );
  }

  if (awaitingMine) return null;

  const hasYou = myByHole.size > 0 && holes.some((h) => myByHole.has(h.hole_no));
  const field = toParParts(stats.fieldAvg);
  const you = toParParts(stats.yourAvg);
  const shares = courseBucketShares(holes);

  /* ── STATE A — the course picture. ── */
  return (
    <AboutSection heading={heading} meta={meta}>
      <LocalHoleChart holes={holes} myByHole={myByHole} hasYou={hasYou} />

      {/* b) the figures the chart cannot state. YOUR AVG is amber and only
             appears for a member who has played here (§6). */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          marginTop: 20,
        }}
      >
        <Figure
          label={t('courseDetail.plays.fieldAvg')}
          value={field ? field.text : '\u2014'}
          tone={field ? field.tone : A.INK}
        />
        {hasYou && you ? (
          <Figure
            label={t('courseDetail.plays.yourAvg')}
            value={you.text}
            tone={A.AMBER_DEEP}
          />
        ) : null}
        <Figure
          label={t('courseDetail.plays.easiestHole')}
          value={String(stats.easiest.hole_no)}
        />
      </div>

      {/* c) the course-wide spread, in the four scoring tones the rows use. */}
      {shares ? <CourseDistributionSummary shares={shares} /> : null}

      {/* d) the specimen hole — the sheet's own row — then the one drill-down. */}
      <AboutHairline style={{ marginTop: 18 }} />
      <div style={{ paddingTop: 14 }}>
        <span style={ABOUT_KICKER}>{t('courseDetail.plays.hardestHole')}</span>
        <div style={{ marginTop: 2 }}>
          <CompactHoleRow hole={stats.hardest} mine={myByHole.get(stats.hardest.hole_no) ?? null} hasYou={hasYou} last />
        </div>
      </div>
      <button
        type="button"
        onClick={openDrillDown}
        style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, padding: '4px 0 0', cursor: 'pointer', fontFamily: SANS }}
      >
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.INK }}>
          {t('courseDetail.plays.allHoles', { count: holes.length, holes: formatNumber(holes.length) })} ›
        </span>
      </button>
      {allHolesSheet}
    </AboutSection>
  );
};

export default HowItPlays;

/**
 * BRIEF_COURSE_TAB_REBUILD §3.4 — HOW IT PLAYS, with the §3.10 drill-down.
 *
 * Flat section, no Panel (Panel itself untouched). It absorbs the old howItPlays
 * card, the parTypes card and the holes preview: the chart, four figures and the
 * course-wide distribution stay here, and hole-by-hole, how each par plays and
 * the SI ladder move behind ONE named link — "All 18 holes ›".
 *
 * THE CHART IS THE SHARED ONE. ShapeChart is imported from CourseAnalyticsPanels
 * rather than rewritten, so the tab and Discover can never disagree about how a
 * course's shape is drawn. Its bars keep the DIFFICULTY RAMP they already use —
 * amber remains the viewing member's line and nothing else (§6).
 *
 * STATE A (>= 20 pooled rounds) AND STATE B (1–19) ARE BUILT TOGETHER. Under the
 * threshold there is NO chart, no figures and no distribution: one round's
 * "distribution" is a scorecard wearing a percentage. The drill-down is withheld
 * with them, because it is the same sample seen closer.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { A, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ShapeChart } from '@/features/courses/components/holes/analytical/CourseAnalyticsPanels';
import { DistributionStrip, courseBucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import AboutSection, { ABOUT_KICKER, AboutHairline, aboutFig } from './AboutSection';

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

/** §3.4 d / §3.10 — the one drill-down. A right chevron, because it navigates. */
const DrillDownRow: React.FC<{ holes: number; onPress: () => void }> = ({ holes, onPress }) => {
  const { t } = useTranslation('courses');
  return (
    <>
      <AboutHairline style={{ marginTop: 18 }} />
      <button
        type="button"
        onClick={onPress}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 0,
          padding: '14px 0 0',
          cursor: 'pointer',
          fontFamily: SANS,
        }}
      >
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.INK }}>
          {t('courseDetail.plays.allHoles', { count: holes, holes: formatNumber(holes) })} ›
        </span>
        <span
          style={{ display: 'block', marginTop: 5, fontSize: 11, lineHeight: 1.5, color: A.DIM }}
        >
          {t('courseDetail.plays.allHolesSub')}
        </span>
      </button>
    </>
  );
};

/** §4 — the pooled-round threshold below which no course picture is drawn. */
const MIN_ROUNDS = 20;

interface HowItPlaysProps {
  courseId: string;
  courseName?: string | null;
}

const HowItPlays: React.FC<HowItPlaysProps> = ({ courseId, courseName }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
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
    navigate(`/courses/${courseId}/holes`);
  };

  /* ── STATE C — nothing has been played here. The reader decides the second
        line, not the course; both sentences are PORTED, not rewritten. ── */
  if (courseRounds === 0) {
    /* Still resolving — say nothing rather than the wrong thing. */
    if (courseStats == null && data == null) return null;
    return (
      <AboutSection heading={heading}>
        <Sentence>
          {t('discover.scores.noOnePlayed', { course: courseName ?? '\u2014' })}
        </Sentence>
        <div style={{ marginTop: 6 }}>
          <Sentence quiet>
            {connection
              ? t('discover.scores.beTheFirst')
              : t('discover.scores.connectToAppear')}
          </Sentence>
        </div>
      </AboutSection>
    );
  }

  /* ── STATE B — 1 to 19 rounds. No chart, no figures, no distribution: a
        sample this small is a scorecard, and drawing it as a course picture is
        the fault this brief exists to remove. ── */
  const drawable = pooled >= MIN_ROUNDS && holes.length > 0 && stats != null;
  if (!drawable) {
    if (awaitingMine) return null;
    return (
      <AboutSection heading={heading} meta={meta}>
        <Sentence quiet>
          {t('courseDetail.plays.notEnoughRounds', {
            count: courseRounds,
            rounds: formatNumber(courseRounds),
          })}
        </Sentence>
      </AboutSection>
    );
  }

  if (awaitingMine) return null;

  const hasYou = myByHole.size > 0 && holes.some((h) => myByHole.has(h.hole_no));
  const field = toParParts(stats.fieldAvg);
  const you = toParParts(stats.yourAvg);
  const hardestFig = toParParts(stats.hardest.avg_to_par);
  const easiestFig = toParParts(stats.easiest.avg_to_par);
  const flat = stats.hardest.avg_to_par === stats.easiest.avg_to_par;
  const shares = courseBucketShares(holes);

  /* ── STATE A — the course picture. ── */
  return (
    <AboutSection heading={heading} meta={meta}>
      <ShapeChart
        holes={holes}
        myByHole={myByHole}
        hardestHole={stats.hardest.hole_no}
        hardestText={hardestFig ? hardestFig.text : ''}
        hardestTone={hardestFig ? hardestFig.tone : A.INK}
        easiestHole={stats.easiest.hole_no}
        easiestText={easiestFig ? easiestFig.text : ''}
        easiestTone={easiestFig ? easiestFig.tone : A.INK}
        flat={flat}
        hasYou={hasYou}
        fieldIsOnlyYou={false}
      />

      {/* b) the figures the chart cannot state. YOUR AVG is amber and only
             appears for a member who has played here (§6). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hasYou && you ? 4 : 3}, minmax(0, 1fr))`,
          gap: 10,
          marginTop: 16,
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
          label={t('courseDetail.plays.hardestHole')}
          value={String(stats.hardest.hole_no)}
        />
        <Figure
          label={t('courseDetail.plays.easiestHole')}
          value={String(stats.easiest.hole_no)}
        />
      </div>

      {/* c) the course-wide spread, in the four scoring tones the rows use. */}
      {shares ? <DistributionStrip shares={shares} style={{ marginTop: 18, paddingBottom: 0 }} /> : null}

      {/* d) the hairline and the one drill-down. */}
      <DrillDownRow holes={holes.length} onPress={openDrillDown} />
    </AboutSection>
  );
};

export default HowItPlays;

/**
 * BRIEF_YOU_TAB_REBUILD — the You tab, flat.
 *
 * IT IS NO LONGER A STATE MACHINE. It was five mutually exclusive screens; it is
 * now ONE page of eight sections that degrade honestly, exactly as the Course
 * tab does. A member with one round and a member with 111 see the same section
 * list; the sections themselves either draw or say why they cannot.
 *
 * THE NUMBER THAT GOVERNS IT: half of all member-course pairs are ONE round and
 * 84% are under five, so the majority case is designed for first and the rich
 * case unlocks more. "Your rounds here" (§3.2) has no threshold at all.
 *
 * NO Panel, and Panel itself is untouched (it is shared app-wide). The wrapper
 * and heading are the Course tab's — AboutSection + DiscoverSectionHeading,
 * neither modified. ShapeChart, ParTypeBars and PersonalReviewCard are all
 * untouched; this tab stops calling them. HoleDataSheet was deleted on
 * 10 Sep 2026 with the Holes tab; ConnectGhostPrompt is retained but
 * unreferenced (see its header).
 *
 * RETIRED FROM THIS TAB (files kept): FieldHero and ReferencePanel — the
 * field's chart, its shots-over-par row and the par bars are the COURSE tab's
 * content and one tap away; the "Your journey" kicker; the donut and its
 * par/bogey/double split; "Your battle - hole 18" as its own block; the
 * duplicated Within reach; the community / difference / category block.
 *
 * DELIBERATE EXCEPTION, BRANCH B ONLY (BRIEF_YOU_TAB_CONNECT_INVITATION): the
 * not-connected branch DOES draw the field's chart (FieldShotsSection), because
 * that branch has nothing else on it. This is a reversal for branch B alone,
 * not a gap - do not "restore" the field chart to branch C or the connected
 * page, and do not remove it from branch B as a rule violation.
 *
 * MOVED, NOT DELETED: how each par plays for you, how your round unfolds by
 * thirds, the hole-ranked list with its advice line and the donut split all
 * The All 18 action opens the same analytical sheet as the Course tab.
 *
 * ASCII only.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useHandicapTrend, useRecentDifferentials } from '@/lib/whs/hooks';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';
import { buildCourseProjection } from '@/lib/whs/coursePlay';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance } from '@/hooks/gam/useMyHolePerformance';
import { useMyRoundsAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { CourseStatusToggle } from '@/components/courses/phase5';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Skeleton } from '@/components/ui/skeleton';

import { A, EmptyState } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseRecordSummary } from './useCourseRecordSummary';
import AboutSection, { AboutHairline } from './about/AboutSection';
import CenteredStatStrip from './about/CenteredStatStrip';
import { EmptyBirdiesSection, FieldShotsSection, FIELD_CHART_MIN_ROUNDS } from './you/NotConnectedInvitation';
import { YouAction, YouButton, YouSentence } from './you/youBits';
import { useMemberStandings } from '@/hooks/gam/useMemberStandings';
import type { YouRound } from './you/YourRoundsHere';
import { useMomentPosts } from './you/YourMomentsSection';
import { useAllMyRoundsAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { useCourseHoleField } from '@/hooks/gam/useCourseHoleField';
import { useBoardCoursePlayers } from '@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CIRCLE_PLAYERS_LIMIT, circleNamesLine } from './you/circleNamesLine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { CHAMPIONS_ORDER_ALL_TIME } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
import {
  COURSE_FIELD_MIN_ROUNDS, LAST_N, NOBODY_CLOSE_SHARE, SEASON_MIN_ROUNDS, aggregate, allSeasons, edgeSummary, fieldExcludingViewer, fieldSample, firstN,
  goodRounds, holeEdges, lastN, openHolesState, scoredRounds,
} from '@/lib/courseYou/youDerivations';
import { ordinal } from './you/youBits';
import {
  EdgeSection, GoodRoundsSection, OneHoleLeftSection, RecordSection, VerdictSection, WithinReachSection, YearsSection,
  type ReachRow,
} from './you/many/ManySections';
import FormLast20Section from './you/many/FormLast20Section';
import YourRatingSection from './you/YourRatingSection';
import UpForGrabsSection from './you/UpForGrabsSection';
import ProjectionSection, { type ProjectionState } from './you/ProjectionSection';
import WonAndLostSection from './you/WonAndLostSection';
import AgainstYourGolfSection from './you/AgainstYourGolfSection';

interface Props {
  courseId: string;
  courseName: string;
  onTabChange?: (tab: string) => void;
}

export const CourseYouTab: React.FC<Props> = ({ courseId, courseName, onTabChange }) => {
  const { t } = useTranslation(['courses', 'common']);
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection, isLoading: connectionLoading } = useWhsConnection(user?.id);
  const {
    status,
    isLoading: statusLoading,
    hasTrackedRounds,
    roundsSettled,
    trackedRoundCount,
    setWantToPlay,
    isUpdating,
  } = useCoursePersonalStatus(courseId);
  const { data: analysis } = useCourseHoleAnalysis(courseId);
  const { data: courseStats } = useCourseStatsDetail(courseId, true);
  const { data: myPerf } = useMyHolePerformance(user?.id, courseId, {
    enabled: Boolean(user?.id && courseId && connection),
  });
  const { data: myRounds } = useMyRoundsAtCourse(courseId);
  const { data: rating } = useUserCourseRating(courseId, user?.id);
  const { courseRecord, courseRecordHolders, unclaimedCount } = useCourseRecordSummary(courseId, user?.id ?? null);
  /* YOU_TAB_CIRCLE_NAMES_1 — ONE rounds-based source for the "who you know"
     line: get_board_course_players, scope 'circle', window 'all'
     (board_window_from maps 'all' to 1900-01-01, i.e. all time). The count
     AND the names come from this call; circle_played from
     get_course_stats_detail is no longer read on this tab. Only the
     connected-never-played branch renders the line, so the read waits for
     the status to settle. */
  const circlePlayers = useBoardCoursePlayers(
    user?.id,
    courseId,
    { ...DEFAULT_FILTERS, scope: 'circle', window: 'all' },
    { limit: CIRCLE_PLAYERS_LIMIT, enabled: !statusLoading && !hasTrackedRounds },
  );

  const [openRoundId, setOpenRoundId] = React.useState<string | null>(null);

  /* The member's rounds, most recent first, with each round's score to par. */
  const rounds = React.useMemo<YouRound[]>(
    () =>
      (myRounds ?? []).map((r) => ({
        whsScoreId: r.whsScoreId,
        playDate: r.playDate,
        gross: r.grossScore,
        toPar: r.grossScore != null && r.coursePar != null ? r.grossScore - r.coursePar : null,
        hcpAtTime: r.hcpAtTime,
        deltaIndex: r.deltaIndex,
        frontNineToPar: r.frontNineToPar,
        backNineToPar: r.backNineToPar,
        eagles: r.eagles,
        albatrosses: r.albatrosses,
        holes_in_one: r.holesInOne,
        clean_card: r.cleanCard,
      })),
    [myRounds],
  );

  const grossValues = rounds.map((r) => r.gross).filter((g): g is number => g != null);
  const bestGross = grossValues.length > 0 ? Math.min(...grossValues) : null;
  const averageGross =
    grossValues.length > 0 ? grossValues.reduce((s, v) => s + v, 0) / grossValues.length : null;

  /* The true round count is the hero's own 18-hole sample; the list is capped at
     twenty, so it can never be the count. */
  const roundTotal = Math.max(trackedRoundCount ?? 0, rounds.length);

  /* THE FIELD'S GROSS, derived rather than invented: the course's par plus the
     field's average over par, both already on the page. */
  const coursePar = React.useMemo(() => {
    const holes = analysis?.holes ?? [];
    const summed = holes.reduce((s, h) => s + (Number.isFinite(h.par) ? h.par : 0), 0);
    if (holes.length === 18 && summed > 0) return summed;
    const fromRound = (myRounds ?? []).find((r) => r.coursePar != null)?.coursePar;
    return fromRound ?? null;
  }, [analysis?.holes, myRounds]);
  const fieldOverPar = courseStats?.avg_over_par ?? null;
  const fieldGross =
    coursePar != null && fieldOverPar != null ? (coursePar + fieldOverPar).toFixed(1) : null;

  const mine = React.useMemo(() => myPerf ?? [], [myPerf]);
  const fieldHoles = React.useMemo(() => analysis?.holes ?? [], [analysis?.holes]);

  const settled =
    Boolean(user) && !statusLoading && Boolean(status) && !connectionLoading && roundsSettled;

  /* Scoped to this course; only read once the member is known to have played. */
  const { data: standings } = useMemberStandings(user?.id, settled && hasTrackedRounds, courseId);

  /* BRIEF_YOU_TAB_1 P1.1 / P1.3 — the played state's reads: the COMPLETE
     18-hole history (paging read) and the per-hole field EXCLUDING the viewer. */
  const playedReady = settled && hasTrackedRounds && Boolean(connection);
  const { data: allRounds, isLoading: allRoundsLoading } = useAllMyRoundsAtCourse(courseId, playedReady);
  const { data: holeField } = useCourseHoleField(courseId, user?.id, { enabled: playedReady });
  const { moments, posts: momentPosts } = useMomentPosts(courseId, courseName);

  /* BRIEF_YOU_TAB_BRANCH_C_SCOUTING_REPORT — branch C's reads. trend and
     differentials are inert without a connection; analytics courses only fire
     on branch C's preconditions; course meta is GolfClubView's warm entry. */
  const branchC = settled && Boolean(connection) && !hasTrackedRounds;
  const { data: courseMeta, isLoading: metaLoading } = useCourseMeta(courseId);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);
  const { data: recentDiffs, isLoading: diffsLoading } = useRecentDifferentials(connection?.id);
  const { data: myCourses, isLoading: myCoursesLoading } = useUserAnalyticsCourses({ enabled: branchC });

  /* The field's par-or-better share across this course's holes. */
  const fieldParOrBetterPct = React.useMemo(() => {
    let good = 0;
    let all = 0;
    for (const h of analysis?.holes ?? []) {
      const d = h.dist;
      good += d.ace + d.albatross + d.eagle + d.birdie + d.par;
      all += d.ace + d.albatross + d.eagle + d.birdie + d.par + d.bogey + d.double;
    }
    return all > 0 ? (good / all) * 100 : null;
  }, [analysis?.holes]);

  /* The member's own, across every course whose counts are present. */
  const yourGolf = React.useMemo(() => {
    let good = 0;
    let all = 0;
    let courses = 0;
    let overSum = 0;
    let overRounds = 0;
    let overCourses = 0;
    for (const r of myCourses ?? []) {
      if (r.eagles_plus_count != null && r.birdies_count != null && r.pars_count != null && r.bogeys_plus_count != null) {
        const g = r.eagles_plus_count + r.birdies_count + r.pars_count;
        good += g;
        all += g + r.bogeys_plus_count;
        courses += 1;
      }
      if (r.avg_to_par != null && Number.isFinite(r.avg_to_par) && r.rounds_count > 0) {
        overSum += r.avg_to_par * r.rounds_count;
        overRounds += r.rounds_count;
        overCourses += 1;
      }
    }
    return {
      parOrBetterPct: all > 0 ? (good / all) * 100 : null,
      courses,
      overPar: overRounds > 0 ? overSum / overRounds : null,
      overCourses,
    };
  }, [myCourses]);

  const projectionState = React.useMemo<ProjectionState>(() => {
    const index = trend?.current ?? null;
    const cr = courseMeta?.course_cr ?? null;
    const slope = courseMeta?.course_slope ?? null;
    const par = courseMeta?.course_par ?? null;
    if (index == null || cr == null || slope == null || par == null) {
      if (fieldOverPar != null && yourGolf.overPar != null) {
        return { kind: 'compare', fieldOverPar, yourOverPar: yourGolf.overPar, courseCount: yourGolf.overCourses };
      }
      return { kind: 'none' };
    }
    const inputs = { index: Number(index), cr: Number(cr), slope: Number(slope), par: Number(par) };
    const diffs = recentDiffs ?? [];
    const projection = buildCourseProjection(diffs, inputs);
    if (!projection) return { kind: 'handicap_only', inputs, sample: diffs.length };
    return { kind: 'full', inputs, projection, differentials: diffs };
  }, [trend, courseMeta, recentDiffs, fieldOverPar, yourGolf]);

  const projectionSettled = !metaLoading && !trendLoading && !diffsLoading && !myCoursesLoading;

  /* §7 — one view event per mount, carrying the round count so we can see which
     state members actually land in. */
  const viewFired = React.useRef(false);
  React.useEffect(() => {
    if (!settled || viewFired.current) return;
    /* Branch C waits for its projection reads so the state it reports is the one drawn. */
    if (branchC && !projectionSettled) return;
    viewFired.current = true;
    analyticsEvents.track('course_you_tab_viewed', {
      course_id: courseId,
      rounds: roundTotal,
      connected: Boolean(connection),
      projection: !branchC
        ? 'none'
        : projectionState.kind === 'full'
          ? 'full'
          : projectionState.kind === 'handicap_only'
            ? 'handicap_only'
            : projectionState.kind === 'compare'
              ? 'field_compare'
              : 'none',
    });
  }, [settled, courseId, roundTotal, connection, branchC, projectionSettled, projectionState.kind]);

  /* YOU_TAB_THIN_COURSE_1 P1 — below the field minimum the record is labelled
     the best card logged here, never "the course record". */
  const upForGrabsThin = !courseFieldKnown(analysis?.total_rounds != null ? Number(analysis.total_rounds) : null);
  const upForGrabs = (
    <UpForGrabsSection
      recordValue={courseRecord?.value ?? null}
      holders={courseRecordHolders}
      unclaimedCount={unclaimedCount}
      yourBest={bestGross}
      thinField={upForGrabsThin}
      onAllBoards={() => {
        analyticsEvents.track('course_you_all_boards', { course_id: courseId });
        onTabChange?.('legends');
      }}
    />
  );

  const wrap = (children: React.ReactNode) => (
    <div className="animate-in fade-in duration-200" style={{ background: A.CANVAS, paddingBottom: 8 }}>
      {children}
    </div>
  );

  // A — SIGNED OUT. Unchanged: the sign-in notice only.
  if (!user) {
    return wrap(
      <div style={{ paddingTop: 20, padding: '20px 16px 0' }}>
        <EmptyState
          title={t('courseDetail.youTab.signedOut.title')}
          body={t('courseDetail.youTab.signedOut.body', { courseName })}
          primary={{ label: t('courseDetail.youTab.signedOut.cta'), onClick: () => navigate('/auth') }}
        />
      </div>,
    );
  }

  // An absence is a claim about the data, so nothing is asserted while the
  // status or connection reads are in flight.
  if (!settled) {
    return wrap(
      <div style={{ padding: '20px 20px 0' }}>
        <Skeleton className="h-[110px] w-full rounded-[12px]" />
      </div>,
    );
  }

  // B — NO HANDICAP CONNECTED. The majority screen, rebuilt by
  // BRIEF_YOU_TAB_CONNECT_INVITATION: the member's page with their side blank.
  // Field-only strip (YOU_TAB_SPARSE_1 N1), the field's chart (gated: 18 holes and
  // at least 5 rounds), empty birdie slots, up for grabs, then the connect block.
  if (!connection) {
    const showFieldChart =
      (analysis?.holes?.length ?? 0) === 18 && Number(analysis?.total_rounds ?? 0) >= FIELD_CHART_MIN_ROUNDS;
    return wrap(
      <div>
        {/* YOU_TAB_SPARSE_1 N1: no dash columns for the reader's absent figures.
            The field figure stands alone, labelled as the field; absent, no strip. */}
        {fieldGross ? (
          <AboutSection first>
            <CenteredStatStrip items={[{ label: t('courseDetail.youTab.fieldAverageHere'), value: fieldGross }]} />
          </AboutSection>
        ) : null}
        {showFieldChart && analysis ? (
          <FieldShotsSection
            holes={analysis.holes}
            totalRounds={Number(analysis.total_rounds)}
            courseName={courseName}
          />
        ) : null}
        <EmptyBirdiesSection />
        {upForGrabs}
        <AboutSection>
          <AboutHairline style={{ marginBottom: 20 }} />
          <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: A.INK }}>
            {t('courseDetail.youTab.connect.fillsIn')}
          </p>
          <YouSentence quiet>{t('courseDetail.youTab.connect.history')}</YouSentence>
          <YouButton
            label={t('courseDetail.youTab.connect.cta')}
            onClick={() => {
              analyticsEvents.track('course_connect_cta_tapped', { course_id: courseId, source: 'you_tab' });
              navigate('/handicap');
            }}
          />
        </AboutSection>
      </div>,
    );
  }

  // C — CONNECTED, NEVER PLAYED HERE (BRIEF_YOU_TAB_BRANCH_C_SCOUTING_REPORT).
  // The order is the argument: a number to beat, where the round is decided,
  // whether the course flatters or exposes them, what is unclaimed, who they
  // know, then the button. Do not promote the button back to the top.
  if (!hasTrackedRounds) {
    /* YOU_TAB_NO_GATE_1 U1 — no sample-size gate: every course-side section
       renders from ONE tracked round. The round count now drives only the
       WORDING (U2, via fieldSample) and the record labelling (U4). */
    const fieldRoundsTotal = analysis?.total_rounds != null ? Number(analysis.total_rounds) : null;
    const sample = fieldSample(fieldRoundsTotal);
    /* U4 — the record labelling keeps the five-round line, driven by the
       same count: "the best card logged here" below, "the course record" at
       or above. */
    const thinField = fieldRoundsTotal != null && fieldRoundsTotal < COURSE_FIELD_MIN_ROUNDS;
    const showWonAndLost = (analysis?.holes?.length ?? 0) === 18 && (fieldRoundsTotal ?? 0) >= 1;
    const showAgainst =
      yourGolf.parOrBetterPct != null &&
      Number.isFinite(yourGolf.parOrBetterPct) &&
      yourGolf.courses > 0 &&
      fieldParOrBetterPct != null &&
      Number.isFinite(fieldParOrBetterPct);
    /* YOU_TAB_CIRCLE_NAMES_1 S2 — a member whose profile is not readable
       (null display_name) is excluded from the count as well as the names,
       so the number and the names always agree. "Played" means a logged
       round, always: if the rounds-based source returns nothing, the line
       does not render (S4). */
    const circle = circleNamesLine(circlePlayers.data);
    const circleCount = circle.count;
    const circleShown = circle.shown;
    const circleNames = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(
      circleShown.map((p) => p.display_name!),
    );
    const circleOthers = circle.others;
    return wrap(
      <div>
        <ProjectionSection
          courseName={courseName}
          state={projectionState}
          recordGross={courseRecord?.value ?? null}
          fieldRounds={fieldRoundsTotal}
          thinField={!fieldKnown}
        />
        {showWonAndLost && analysis ? (
          <WonAndLostSection
            holes={analysis.holes}
            totalRounds={Number(analysis.total_rounds)}
            onAllHoles={() => {
              analyticsEvents.track('course_you_all_18_holes', { course_id: courseId, holes: 0 });
              navigate(`/courses/${courseId}?tab=you&sheet=your-holes`);
            }}
          />
        ) : null}
        {showAgainst ? (
          <AgainstYourGolfSection
            fieldParOrBetterPct={fieldKnown ? fieldParOrBetterPct! : null}
            yourParOrBetterPct={yourGolf.parOrBetterPct!}
            courseCount={yourGolf.courses}
            harderThanPct={fieldKnown ? courseStats?.harder_than_pct ?? null : null}
          />
        ) : null}
        {upForGrabs}
        {circleCount > 0 ? (
          <AboutSection heading={t('courseDetail.youTab.circle.heading')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {circleShown.map((p, i) => (
                  <span key={p.user_id} style={{ marginLeft: i === 0 ? 0 : -7, display: 'inline-flex' }}>
                    <SquircleAvatar
                      size={22}
                      src={p.profile_photo_url}
                      alt={p.display_name ?? ''}
                      userId={p.user_id}
                      /* The canonical hairline ring, identical to the board's
                         avatars. NO amber: an avatar is never amber. */
                      hairlineRing
                    />
                  </span>
                ))}
              </span>
              <YouSentence>
                {circle.capped
                  ? t('courseDetail.youTab.circle.capped', { count: CIRCLE_PLAYERS_LIMIT })
                  : circleOthers > 0
                    ? t('courseDetail.youTab.circle.namedWithOthers', { names: circleNames, others: circleOthers })
                    : t('courseDetail.youTab.circle.named', { names: circleNames, count: circleCount })}
              </YouSentence>
            </div>
          </AboutSection>
        ) : null}
        <AboutSection>
          <AboutHairline />
          <div style={{ marginTop: 16 }}>
            <YouSentence>{t('courseDetail.youTab.actions.playingSoon')}</YouSentence>
          </div>
          <div style={{ marginTop: 6 }}>
            <YouSentence quiet>{t('courseDetail.youTab.actions.playingSoonBody')}</YouSentence>
          </div>
          {status?.status === 'want_to_play' ? (
            <div style={{ marginTop: 16 }}>
              <CourseStatusToggle courseId={courseId} courseName={courseName} userRating={rating?.rating} />
            </div>
          ) : (
            <YouButton
              label={isUpdating ? t('courseDetail.youTab.notPlayed.adding') : t('courseDetail.youTab.notPlayed.addToList')}
              variant="solid"
              disabled={isUpdating}
              onClick={() => {
                analyticsEvents.track('course_you_add_to_list', { course_id: courseId });
                setWantToPlay(true);
              }}
            />
          )}
          {!rating ? (
            <YouAction
              label={t('courseDetail.youTab.rating.rateIt')}
              tone="ink"
              space={16}
              onPress={() => {
                analyticsEvents.track('course_you_rate_it', { course_id: courseId });
                navigate(`/courses/${courseId}/rate`);
              }}
            />
          ) : null}
        </AboutSection>
        {rating ? (
          <YourRatingSection
            rating={rating}
            onEdit={() => {
              analyticsEvents.track('course_you_edit_rating', { course_id: courseId });
              navigate(`/courses/${courseId}/rate`);
            }}
            onRate={() => {
              analyticsEvents.track('course_you_rate_it', { course_id: courseId });
              navigate(`/courses/${courseId}/rate`);
            }}
          />
        ) : null}
      </div>,
    );
  }

  // D / E — PLAYED (BRIEF_YOU_TAB_1, drawn to you-tab-many-rounds.html per 1A).
  // Every aggregate reads the COMPLETE history; a section without its
  // population is absent, never replaced (1A A3).
  if (allRoundsLoading || !allRounds) {
    return wrap(
      <div style={{ padding: '20px 20px 0' }}>
        <Skeleton className="h-[110px] w-full rounded-[12px]" />
      </div>,
    );
  }
  const history = allRounds.rounds;
  const lifetime = aggregate(scoredRounds(history));
  const seasonsAll = allSeasons(history);
  const qualifying = seasonsAll.filter((x) => x.count >= SEASON_MIN_ROUNDS);
  const thisYear = new Date().getFullYear();
  const season = qualifying.find((x) => x.year === thisYear) ?? null;
  const bestSeason =
    season != null && season.avgOverPar != null && qualifying.length >= 2 &&
    qualifying.every((x) => x.avgOverPar == null || season.avgOverPar! <= x.avgOverPar);
  const fieldExcl = fieldExcludingViewer({
    fieldAvgOverPar: courseStats?.avg_over_par,
    fieldRounds: courseStats?.rounds_tracked,
    viewerAvgOverPar: lifetime.avgOverPar,
    viewerRounds: lifetime.overParCount,
  });
  const last20 = lastN(history);
  const prev20 = lastN(history, LAST_N, LAST_N)?.avg ?? null;
  const first20 = firstN(history, LAST_N);
  const last40 = lastN(history, LAST_N * 2)?.avg ?? null;
  const held = first20 != null && last20 != null && prev20 != null && last20.avg < first20 && prev20 < first20;
  const allTime = (category: string) => (standings ?? []).find((x) => x.category === category) ?? null;
  const roundsRow = allTime('most_rounds_all_time');

  const edges = holeEdges(
    fieldHoles.map((h) => ({ hole_no: h.hole_no, par: h.par })),
    holeField?.available ? holeField.holes : [],
    mine,
  );
  const edgeSum = edgeSummary(edges);

  const reach: ReachRow[] = [];
  if (courseRecord && lifetime.best != null) {
    const names = courseRecordHolders.map((h) => (h.is_self ? 'You' : h.user_display_name ?? 'A member'));
    const mineHeld = courseRecordHolders.some((h) => h.is_self);
    const off = lifetime.best - courseRecord.value;
    reach.push({
      key: 'gross',
      name: 'Gross record',
      sub: `${names.join(' & ')} ${names.length === 1 && !mineHeld ? 'holds' : 'hold'} ${courseRecord.value}`,
      value: String(lifetime.best),
      mark: mineHeld || off <= 0 ? 'Yours' : `${off} off it`,
      near: true,
    });
  }
  const rankMark = (r: { rank: number; field_size: number }) => `${ordinal(r.rank)} of ${r.field_size}`;
  const stab = allTime('best_stableford_all_time');
  if (stab?.value != null) reach.push({ key: 'stab', name: 'Best stableford', sub: `Your ${stab.value} points`, value: String(stab.value), mark: rankMark(stab), near: stab.rank === 1 });
  const diff = allTime('best_score_diff_all_time');
  if (diff?.value != null) {
    const d = diff.value < 0 ? `\u2212${Math.abs(diff.value).toFixed(1)}` : diff.value.toFixed(1);
    reach.push({ key: 'diff', name: 'Best differential', sub: `Your ${d}`, value: d, mark: rankMark(diff), near: diff.rank === 1 });
  }
  if (roundsRow?.value != null) {
    const clear = roundsRow.rank === 1 && roundsRow.next_value != null && roundsRow.next_value <= roundsRow.value * NOBODY_CLOSE_SHARE;
    reach.push({ key: 'rounds', name: 'Rounds played', sub: clear ? 'Nobody is close' : `Your ${roundsRow.value} rounds`, value: String(roundsRow.value), mark: ordinal(roundsRow.rank), near: roundsRow.rank === 1 });
  }

  const sumOf = (k: 'birdie_count' | 'eagle_or_better_count') =>
    mine.length > 0 ? mine.reduce((acc, h) => acc + (h[k] ?? 0), 0) : null;

  return wrap(
    <div>
      <VerdictSection
        year={thisYear}
        season={season}
        bestSeason={bestSeason}
        seasonCount={seasonsAll.length}
        lifetimeOverPar={lifetime.avgOverPar}
        lifetimeRounds={allRounds.total}
        fieldOverPar={fieldExcl}
        bestThisYear={seasonsAll.find((x) => x.year === thisYear)?.best ?? null}
        mostRoundsHere={roundsRow?.rank === 1}
      />
      <YearsSection seasons={qualifying} omitted={seasonsAll.filter((x) => x.count < SEASON_MIN_ROUNDS)} year={thisYear} firstTwenty={first20} lastForty={last40} held={held} />
      <GoodRoundsSection g={goodRounds(history)} seasons={seasonsAll.length} />
      <EdgeSection
        edges={edges}
        s={edgeSum}
        fieldRounds={holeField?.available ? holeField.course_rounds : null}
        onAllHoles={() => {
          analyticsEvents.track('course_you_all_18_holes', { course_id: courseId, holes: mine.length });
          navigate(`/courses/${courseId}?tab=you&sheet=your-holes`);
        }}
      />
      <OneHoleLeftSection state={openHolesState(edges)} hardest={edgeSum.fieldHardest} />
      <FormLast20Section
        last={last20}
        previous={prev20}
        firstTwenty={first20}
        onOpenRound={(id) => {
          analyticsEvents.track('course_you_round_opened', { course_id: courseId, whs_score_id: id });
          setOpenRoundId(id);
        }}
      />
      <WithinReachSection
        rows={reach}
        unclaimed={unclaimedCount}
        boards={CHAMPIONS_ORDER_ALL_TIME.length}
        onAllBoards={() => {
          analyticsEvents.track('course_you_all_boards', { course_id: courseId });
          onTabChange?.('legends');
        }}
      />
      <RecordSection
        rating={rating?.rating ?? null}
        moments={moments.length}
        birdies={sumOf('birdie_count')}
        eagles={sumOf('eagle_or_better_count')}
        thumbs={moments.map((m) => ({ id: m.id, url: m.posterUrl ?? (m.mediaType === 'image' ? m.mediaUrl : null) }))}
        onRounds={() => {
          analyticsEvents.track('course_you_all_rounds', { course_id: courseId, rounds: allRounds.total });
          navigate(`/courses/${courseId}?tab=you&sheet=rounds`);
        }}
        onRating={() => {
          analyticsEvents.track('course_you_edit_rating', { course_id: courseId });
          navigate(`/courses/${courseId}/rate`);
        }}
        onMoments={(index) => {
          const m = moments[index];
          if (m) analyticsEvents.track('course_you_moment_opened', { course_id: courseId, moment_id: m.id });
          if (momentPosts.length > 0) useFullscreenFeedStore.getState().open(momentPosts, index, { readOnly: true });
        }}
      />

      <RoundDetailSheet
        open={openRoundId != null}
        onClose={() => setOpenRoundId(null)}
        scoreId={openRoundId}
        profileUserId={user.id}
      />
    </div>,
  );
};

export default CourseYouTab;

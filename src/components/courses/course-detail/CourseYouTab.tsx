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
 * neither modified. ShapeChart, ParTypeBars, HoleDataSheet, ConnectGhostPrompt
 * and PersonalReviewCard are all untouched; this tab stops calling them.
 *
 * RETIRED FROM THIS TAB (files kept): FieldHero and ReferencePanel — the
 * field's chart, its shots-over-par row and the par bars are the COURSE tab's
 * content and one tap away; the "Your journey" kicker; the donut and its
 * par/bogey/double split; "Your battle - hole 18" as its own block; the
 * duplicated Within reach; the community / difference / category block.
 *
 * MOVED, NOT DELETED: how each par plays for you, how your round unfolds by
 * thirds, the hole-ranked list with its advice line and the donut split all
 * render on /courses/:courseId/holes?scope=you — the SAME destination as the
 * Course tab's drill-down with a personal scope, because it is the same
 * eighteen holes seen from one side.
 *
 * ASCII only.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
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
import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { A, EmptyState } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseRecordSummary } from './useCourseRecordSummary';
import AboutSection from './about/AboutSection';
import { YouButton, YouSentence } from './you/youBits';
import YourRecordHere from './you/YourRecordHere';
import YourRoundsHere, { type YouRound } from './you/YourRoundsHere';
import WhereYourShotsGo from './you/WhereYourShotsGo';
import YourFormHere from './you/YourFormHere';
import WithinReach from './you/WithinReach';
import YourRatingSection from './you/YourRatingSection';
import YourMomentsSection from './you/YourMomentsSection';
import UpForGrabsSection from './you/UpForGrabsSection';

interface Props {
  courseId: string;
  courseName: string;
  onTabChange?: (tab: string) => void;
}

export const CourseYouTab: React.FC<Props> = ({ courseId, courseName, onTabChange }) => {
  const { t } = useTranslation('courses');
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
  const { courseRecord, unclaimedCount } = useCourseRecordSummary(courseId, user?.id ?? null);

  const [openRoundId, setOpenRoundId] = React.useState<string | null>(null);

  /* The member's rounds, most recent first, with each round's score to par. */
  const rounds = React.useMemo<YouRound[]>(
    () =>
      (myRounds ?? []).map((r) => ({
        whsScoreId: r.whsScoreId,
        playDate: r.playDate,
        gross: r.grossScore,
        toPar: r.grossScore != null && r.coursePar != null ? r.grossScore - r.coursePar : null,
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

  /* §7 — one view event per mount, carrying the round count so we can see which
     state members actually land in. */
  const viewFired = React.useRef(false);
  React.useEffect(() => {
    if (!settled || viewFired.current) return;
    viewFired.current = true;
    analyticsEvents.track('course_you_tab_viewed', {
      course_id: courseId,
      rounds: roundTotal,
      connected: Boolean(connection),
    });
  }, [settled, courseId, roundTotal, connection]);

  const holderIsYou = Boolean(user?.id && courseRecord?.user_id === user.id);

  const upForGrabs = (
    <UpForGrabsSection
      recordValue={courseRecord?.value ?? null}
      holderName={courseRecord?.user_display_name ?? null}
      holderIsYou={holderIsYou}
      unclaimedCount={unclaimedCount}
      yourBest={bestGross}
      onAllBoards={() => {
        analyticsEvents.track('course_you_all_boards', { course_id: courseId });
        onTabChange?.('legends');
      }}
    />
  );

  const wrap = (children: React.ReactNode) => (
    <div className="animate-in fade-in duration-200" style={{ background: SLATE_50, paddingBottom: 8 }}>
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

  // B — NO HANDICAP CONNECTED. The majority screen. Section 1 becomes the
  // invitation, section 8 renders, and NOTHING ELSE: the field's chart and the
  // par bars are the Course tab's job, one tap away.
  if (!connection) {
    return wrap(
      <div>
        <AboutSection first>
          <YouSentence>{t('courseDetail.youTab.connect.body')}</YouSentence>
          <YouButton
            label={t('courseDetail.youTab.connect.cta')}
            onClick={() => {
              analyticsEvents.track('course_connect_cta_tapped', { course_id: courseId, source: 'you_tab' });
              navigate('/handicap');
            }}
          />
        </AboutSection>
        {upForGrabs}
      </div>,
    );
  }

  // C — CONNECTED, NEVER PLAYED HERE. The invitation, their rating if they have
  // left one, and up for grabs.
  if (!hasTrackedRounds) {
    return wrap(
      <div>
        <AboutSection first>
          <YouSentence>
            {fieldGross
              ? t('courseDetail.youTab.notPlayed.body', { field: fieldGross })
              : t('courseDetail.youTab.notPlayed.bodyNoField')}
          </YouSentence>
          {status?.status === 'want_to_play' ? (
            <div style={{ marginTop: 16 }}>
              <CourseStatusToggle courseId={courseId} courseName={courseName} userRating={rating?.rating} />
            </div>
          ) : (
            <YouButton
              label={isUpdating ? t('courseDetail.youTab.notPlayed.adding') : t('courseDetail.youTab.notPlayed.addToList')}
              disabled={isUpdating}
              onClick={() => {
                analyticsEvents.track('course_you_add_to_list', { course_id: courseId });
                setWantToPlay(true);
              }}
            />
          )}
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
        {upForGrabs}
      </div>,
    );
  }

  // D / E — PLAYED. Every section renders; 3.3 and 3.4 carry their sentences
  // under their thresholds. There is no separate screen for a rich history.
  return wrap(
    <div>
      <YourRecordHere
        rounds={roundTotal}
        best={bestGross}
        average={averageGross}
        field={fieldGross}
      />

      <YourRoundsHere
        rounds={rounds}
        total={roundTotal}
        bestGross={bestGross}
        onOpenRound={(round) => {
          analyticsEvents.track('course_you_round_opened', {
            course_id: courseId,
            whs_score_id: round.whsScoreId,
          });
          setOpenRoundId(round.whsScoreId);
        }}
        onSeeAll={() => {
          analyticsEvents.track('course_you_all_rounds', { course_id: courseId, rounds: roundTotal });
          navigate(`/courses/${courseId}/rounds`);
        }}
      />

      <WhereYourShotsGo
        rounds={roundTotal}
        mine={mine}
        field={fieldHoles}
        onAllHoles={() => {
          analyticsEvents.track('course_you_all_18_holes', { course_id: courseId, holes: mine.length });
          navigate(`/courses/${courseId}/holes?scope=you`);
        }}
      />

      <YourFormHere rounds={rounds} total={roundTotal} />

      {/* §3.5 — ONCE. It used to render inside the shots block and again as its
          own card. */}
      <WithinReach mine={mine} />

      <YourRatingSection
        rating={rating ?? null}
        onEdit={() => {
          analyticsEvents.track('course_you_edit_rating', { course_id: courseId });
          navigate(`/courses/${courseId}/rate`);
        }}
        onRate={() => {
          analyticsEvents.track('course_you_rate_it', { course_id: courseId });
          navigate(`/courses/${courseId}/rate`);
        }}
      />

      <YourMomentsSection
        courseId={courseId}
        courseName={courseName}
        onOpen={(momentId) =>
          analyticsEvents.track('course_you_moment_opened', { course_id: courseId, moment_id: momentId })
        }
      />

      {upForGrabs}

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

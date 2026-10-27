import { HERO_CANON_WASH } from '@/features/tourhub/_shared/heroGradient';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import '@/components/courses/course-detail/tabCanon.css';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import { courseRankLabels, type RankList } from '@/features/courses/_shared/courseRankLabels';
import { CourseTabs, type CourseTabId } from '@/components/courses/course-detail/CourseTabs';
import CourseDetailShellTabs from '@/features/courses/components/CourseDetailShellTabs';
// FloatingPageHeader removed (H3) — chrome now driven by ChromeIsland registry.
import { safeGoBack } from '@/utils/navigation';
import { formatCourseLocation } from '@/utils/courseLocation';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import CourseYouTab from '@/components/courses/course-detail/CourseYouTab';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { useCourseStatsDetail, type CourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import CourseStatsSheet from '@/components/feed/CourseStatsSheet';
import { CourseMasthead } from '@/components/courses/CourseMasthead';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseTop100Standing } from '@/hooks/useCourseTop100Standing';
import { EXPLORE_COURSE_HERO_HEIGHT } from '@/lib/heroHeights';
import { Z } from '@/config/zIndex';
import { TAB_LEAD_IN } from '@/components/courses/course-detail/about/AboutSection';
import { useHeroReferenceLine } from '@/components/courses/course-detail/about/useHeroReferenceLine';
import { useCourseRecordSummary } from '@/components/courses/course-detail/useCourseRecordSummary';
import { HeroCourseRecord, heroRecordVisible, HERO_RECORD_ROW_EXTRA } from '@/components/courses/course-detail/about/HeroCourseRecord';
import { SURFACE } from '@/lib/tokens/surface';
import StickySafeAreaScrim, { useStickySafeAreaState } from '@/components/chrome/StickySafeAreaScrim';
import YourRoundsSheet from '@/components/courses/course-detail/you/YourRoundsSheet';
import YourHolesSheet from '@/components/courses/course-detail/you/YourHolesSheet';


interface GolfClubViewProps {
  courseId: string;
  isInModal?: boolean;
  onClose?: () => void;
}

const VALID_TABS: readonly CourseTabId[] = ['course', 'you', 'legends', 'reviews', 'media'] as const;

/** Legacy ids kept alive for existing deep links, notifications and shares. */
const LEGACY_TAB_ALIASES: Record<string, CourseTabId> = {
  about: 'course',
  holes: 'course',
};

const asTabId = (v: unknown): CourseTabId => {
  if (VALID_TABS.includes(v as CourseTabId)) return v as CourseTabId;
  const alias = typeof v === 'string' ? LEGACY_TAB_ALIASES[v] : undefined;
  return alias ?? 'course';
};

interface CourseDetailRow {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  sub_country?: string | null;
  course_type?: string | null;
  club_id?: string | null;
  thumbnail_image?: string | null;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  [key: string]: unknown;
}

const GolfClubView: React.FC<GolfClubViewProps> = ({ courseId, isInModal = false, onClose }) => {
  const { user } = useSupabaseSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const routerState = (location.state ?? null) as { activeTab?: string } | null;
  const tabFromState = routerState?.activeTab;
  const tabFromQuery = searchParams.get('tab');
  // A ?cat= deep link (game notifications) targets a Champions board.
  const defaultTab = searchParams.get('cat') ? 'legends' : 'course';
  const initialTab: CourseTabId = asTabId(tabFromState ?? tabFromQuery ?? defaultTab);
  const [activeTab, setActiveTab] = useState<CourseTabId>(initialTab);

  const highlightReviewId = searchParams.get('review');

  const [visitedTabs, setVisitedTabs] = useState<Set<CourseTabId>>(new Set([initialTab]));

  // Sync activeTab when URL/state changes (handles deep links when already mounted on this course)
  useEffect(() => {
    const nextState = (location.state ?? null) as { activeTab?: string } | null;
    const fallback = searchParams.get('cat') ? 'legends' : 'course';
    const next = asTabId(nextState?.activeTab ?? searchParams.get('tab') ?? fallback);
    setActiveTab(next);
    setVisitedTabs(prev => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, [searchParams, location.state]);


  const { data: course, isLoading: courseLoading, isError: courseError, refetch: refetchCourse } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('golf_courses')
        .select(`
          *,
          course_top100_memberships (
            list_id,
            top100_lists (
              slug,
              name
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data as CourseDetailRow;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: ratingAggregate } = useCourseRatingAggregates(courseId);
  const { data: courseMeta } = useCourseMeta(courseId);
  // Same read as the record boards (useCourseLegends query, deduped by cache).
  const { courseRecordHolders } = useCourseRecordSummary(courseId, user?.id ?? null);
  const heroHeight = EXPLORE_COURSE_HERO_HEIGHT + (heroRecordVisible(courseRecordHolders) ? HERO_RECORD_ROW_EXTRA : 0);
  // One course, one destination page the member deliberately navigated to —
  // see the hook header: the "never prefetch" rule is about N courses in a feed.
  const { data: courseStats } = useCourseStatsDetail(courseId, true);
  const communityRating = ratingAggregate?.avg_overall_score ?? null;
  const reviewCount = ratingAggregate?.review_count ?? 0;
  const [statsSheetOpen, setStatsSheetOpen] = useState(false);
  const roundsSheetOpen = searchParams.get('sheet') === 'rounds';
  const yourHolesSheetOpen = searchParams.get('sheet') === 'your-holes';
  const closeRoundsSheet = useCallback(() => {
    if (!roundsSheetOpen) return;
    const next = new URLSearchParams(searchParams);
    next.delete('sheet');
    setSearchParams(next, { replace: true });
  }, [roundsSheetOpen, searchParams, setSearchParams]);
  const closeYourHolesSheet = useCallback(() => {
    if (!yourHolesSheetOpen) return;
    const next = new URLSearchParams(searchParams);
    next.delete('sheet');
    setSearchParams(next, { replace: true });
  }, [yourHolesSheetOpen, searchParams, setSearchParams]);
  const fieldGross =
    courseMeta?.course_par != null && courseStats?.avg_over_par != null
      ? courseMeta.course_par + courseStats.avg_over_par
      : null;

  // Fire once on first mount with the initial tab.
  const initialTabFired = useRef(false);
  useEffect(() => {
    if (initialTabFired.current || !courseId) return;
    initialTabFired.current = true;
    analyticsEvents.track('course_tab_viewed', { course_id: courseId, tab: initialTab });
  }, [courseId, initialTab]);

  const handleTabChange = useCallback((newTab: CourseTabId) => {
    setActiveTab(newTab);
    analyticsEvents.track('course_tab_viewed', { course_id: courseId, tab: newTab });
    setVisitedTabs(prev => new Set(prev).add(newTab));

    if (!isInModal) {
      const next = new URLSearchParams(searchParams);
      if (newTab === 'course') next.delete('tab'); else next.set('tab', newTab);
      setSearchParams(next, { replace: true });
    }

    if (user?.id && courseId) {
      queryClient.invalidateQueries({
        queryKey: ['user-course-rating', courseId, user.id],
        refetchType: 'active'
      });
    }
  }, [user?.id, courseId, queryClient, isInModal, searchParams, setSearchParams]);


  if (courseError) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 style={{ fontSize: 17, fontWeight: 700, color: A.INK, margin: 0 }}>Couldn't load this course</h2>
        <p style={{ fontSize: 13.5, color: A.MUTE, margin: 0, maxWidth: 280 }}>
          It may have been removed, or your connection dropped.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => refetchCourse()}
            style={{ background: A.INK, color: A.CANVAS, border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </button>
          <button
            onClick={() => (isInModal && onClose ? onClose() : safeGoBack(navigate, '/courses'))}
            style={{ background: 'rgba(255,255,255,0.06)', color: A.INK, border: `1px solid ${A.BORDER}`, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (courseLoading || !course) {
    return <CourseDetailSkeleton />;
  }


  // Both mounts share Explore's fixed hero height and the canon HERO_CANON_WASH,
  // which ends opaque on the canvas so the photograph dissolves with no seam.
  const heroImageBackground = course.thumbnail_image
    ? `url("${course.thumbnail_image}") center 40% / cover no-repeat`
    : A.CANVAS;

  // Modal-mode hero.
  const modalHeroBlock = (
    <div
      className="relative overflow-hidden"
      style={{
        height: heroHeight,
        marginTop: 0,
        background: heroImageBackground,
        backgroundColor: A.CANVAS,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: HERO_CANON_WASH }}
      />
      {/* Modal-path back chevron deleted (BRIEF_COURSES_CHROME_DARK): no caller
          passes onClose — the sole caller is CourseDetailPage.tsx:53 with
          isInModal={false} — so it was dead alongside the H3 FloatingPageHeader
          removal. The routed page's only back affordance is the ChromeIsland. */}

      <CourseTitleOverlay
        course={course}
        courseStats={courseStats ?? null}
        reviewCount={reviewCount}
        onOpenStats={() => setStatsSheetOpen(true)}
        recordHolders={courseRecordHolders}
      />
    </div>
  );

  // Standalone (non-modal) full-bleed cinematic hero — bleeds into the notch.
  const cinematicHero = (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        height: heroHeight,
        background: heroImageBackground,
        backgroundColor: A.CANVAS,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: HERO_CANON_WASH }}
      />
      <CourseTitleOverlay
        course={course}
        courseStats={courseStats ?? null}
        reviewCount={reviewCount}
        onOpenStats={() => setStatsSheetOpen(true)}
        recordHolders={courseRecordHolders}
      />
    </div>
  );

  const tabContent = (
    <div className="course-hero-wrapper" style={{ paddingTop: TAB_LEAD_IN }}>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsContent
          value="course"
          className={`course-tab-course mt-0 transition-opacity duration-200 ${activeTab === 'course' ? 'opacity-100' : 'hidden'}`}
        >
          <CourseAboutTab
            course={course}
            onTabChange={handleTabChange}
          />
        </TabsContent>

        {visitedTabs.has('you') && (
          <TabsContent
            value="you"
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'you' ? 'opacity-100' : 'hidden'}`}
          >
            <CourseYouTab courseId={course.id} courseName={course.name} onTabChange={handleTabChange} />
          </TabsContent>
        )}

        {visitedTabs.has('legends') && (
          <TabsContent
            value="legends"
            className={`course-tab-legends mt-0 transition-opacity duration-200 ${activeTab === 'legends' ? 'opacity-100' : 'hidden'}`}
          >
            {/* DARK, like every other tab. The page was light when this tab
                opted out with a .hcp-light wrapper and theme="light"; both are
                gone and theme now defaults to 'dark', which is the path the
                handicap page exercises daily. .hcp-light itself stays — it
                still serves FriendSheet and PageRoot. */}
            <CourseLegendsDrilldown
              selection={{
                courseId: course.id,
                courseName: course.name,
                courseRegion: course.region ?? null,
                courseCountry: course.country ?? null,
                courseType: (course as { course_type?: string | null }).course_type ?? null,
              }}
              hideHeader
              fieldAvgOverPar={courseStats?.avg_over_par ?? null}
              totalCourseRounds={courseStats?.rounds_tracked ?? null}
            />

          </TabsContent>
        )}

        {visitedTabs.has('reviews') && (
          <TabsContent
            value="reviews"
            className={`course-tab-reviews mt-0 transition-opacity duration-200 ${activeTab === 'reviews' ? 'opacity-100' : 'hidden'}`}
          >
            <CourseReviewsTab
              courseId={course.id}
              courseName={course.name}
              highlightReviewId={highlightReviewId}
            />
          </TabsContent>
        )}

        {visitedTabs.has('media') && (
          <TabsContent
            value="media"
            className={`course-tab-media mt-0 transition-opacity duration-200 ${activeTab === 'media' ? 'opacity-100' : 'hidden'}`}
          >
            <CourseMediaTabNew courseId={course.id} courseName={course.name} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  if (isInModal) {
    return (
      <div className="w-full" data-course-detail>
        {modalHeroBlock}
        {/* Modal mode: legacy sticky underline tabs (no CompactHeader present) */}
        <div
          className="sticky bg-background"
          data-course-review-tabs
          style={{ top: 0, zIndex: 20, paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <CourseTabs activeTab={activeTab} onChange={handleTabChange} />
        </div>
        {tabContent}
      <CourseStatsSheet
        open={statsSheetOpen}
        onClose={() => setStatsSheetOpen(false)}
        courseId={course.id}
        courseName={course.name}
        courseLocation={formatCourseLocation(course)}
        courseRating={communityRating}
      />
      <YourRoundsSheet
        open={roundsSheetOpen}
        onClose={closeRoundsSheet}
        courseId={course.id}
        courseName={course.name}
        fieldOverPar={courseStats?.avg_over_par ?? null}
        fieldRounds={courseStats?.rounds_tracked ?? null}
        coursePar={courseMeta?.course_par ?? null}
      />
      <YourHolesSheet
        open={yourHolesSheetOpen}
        onClose={closeYourHolesSheet}
        courseId={course.id}
        courseName={course.name}
      />
      </div>
    );
  }

  return (
    <>
      <StandaloneCourseDetail
        course={course}
        courseMeta={courseMeta}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        cinematicHero={cinematicHero}
        tabContent={tabContent}
      />
      <CourseStatsSheet
        open={statsSheetOpen}
        onClose={() => setStatsSheetOpen(false)}
        courseId={course.id}
        courseName={course.name}
        courseLocation={formatCourseLocation(course)}
        courseRating={communityRating}
      />
      <YourRoundsSheet
        open={roundsSheetOpen}
        onClose={closeRoundsSheet}
        courseId={course.id}
        courseName={course.name}
        fieldOverPar={courseStats?.avg_over_par ?? null}
        fieldRounds={courseStats?.rounds_tracked ?? null}
        coursePar={courseMeta?.course_par ?? null}
      />
      <YourHolesSheet
        open={yourHolesSheetOpen}
        onClose={closeYourHolesSheet}
        courseId={course.id}
        courseName={course.name}
      />
    </>
  );
};

interface CourseOverlayShape {
  name: string;
  country?: string | null;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  [key: string]: unknown;
}
interface CourseMetaShape {
  course_cr?: number | null;
  course_slope?: number | null;
}
interface CourseTitleOverlayProps {
  course: CourseOverlayShape;
  courseStats: CourseStatsDetail | null;
  reviewCount: number;
  onOpenStats: () => void;
  recordHolders: import('@/lib/gam/types').CourseLegendRow[];
}


const CourseTitleOverlay: React.FC<CourseTitleOverlayProps> = ({
  course,
  courseStats,
  reviewCount,
  onOpenStats,
  recordHolders,
}) => {
  const { t } = useTranslation('courses');
  const rounds = typeof courseStats?.rounds_tracked === 'number' ? courseStats.rounds_tracked : 0;
  const showBand = rounds > 0 || reviewCount > 0;

  const courseId = (course as { id?: string }).id ?? null;

  /**
   * The standing comes from course_top100_memberships — the lists are the one
   * source. The legacy global_rank / regional_rank / usa_rank columns on the
   * course record are deliberately NOT read here: nothing writes them, and on a
   * US course regional_rank actually holds the USA rank.
   */
  const { data: standing } = useCourseTop100Standing(courseId);
  // Same country rule CourseRankBadges used to decide what "regional" means.
  const rankEntries: Array<{ list: RankList; rank: number }> = [];
  if (standing?.globalRank) rankEntries.push({ list: 'global', rank: standing.globalRank });
  const c = course.country ?? '';
  const isGBI = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'].includes(c);
  if (isGBI && standing?.regionalRank) rankEntries.push({ list: 'gbi', rank: standing.regionalRank });
  else if (['United States', 'USA'].includes(c) && standing?.usaRank) rankEntries.push({ list: 'usa', rank: standing.usaRank });
  else if (c === 'Continental Europe' && standing?.regionalRank) rankEntries.push({ list: 'europe', rank: standing.regionalRank });

  const shownRef = useRef<string | null>(null);
  useEffect(() => {
    if (!showBand || !courseId) return;
    if (shownRef.current === courseId) return;
    shownRef.current = courseId;
    analyticsEvents.track('course_hero_stats_shown', {
      course_id: courseId,
      rounds_tracked: rounds,
      review_count: reviewCount,
    });
  }, [showBand, courseId, rounds, reviewCount]);

  /* BRIEF_COURSE_TAB_1A P1.1 — the generic stat row collapses to ONE reference
     line: par · yards · rating / slope · tracked rounds. Reference, not findings. */
  const referenceLine = useHeroReferenceLine(courseId, rounds);

  return (
    <div className="absolute inset-x-0 bottom-4 px-4 z-[1] flex flex-col gap-2">
      <CourseMasthead
        as="h1"
        kicker={[course.sub_country || course.region, ...courseRankLabels(rankEntries)].filter(Boolean).join(' \u00B7 ') || null}
        name={course.name}
        place={course.country || null}
      >
        {(referenceLine || heroRecordVisible(recordHolders)) ? (<>
        {referenceLine ? (
          <button
            type="button"
            onClick={() => {
              analyticsEvents.track('course_hero_stats_tapped', { course_id: courseId, rounds_tracked: rounds });
              onOpenStats();
            }}
            className="tabular-nums lining-nums"
            style={{
              display: 'block',
              padding: 0,
              border: 0,
              background: 'transparent',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.005em',
              // BRIEF_COURSE_HERO_1B K3 — the existing body tier, not a new 78%.
              color: SURFACE.dark.body,
            }}
          >
            {referenceLine.split(' \u00B7 ').map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ fontWeight: 500, color: SURFACE.dark.dim }}>{' \u00B7 '}</span>}
                {part}
              </React.Fragment>
            ))}
          </button>
        ) : null}
        <HeroCourseRecord holders={recordHolders} />
        </>) : null}
      </CourseMasthead>

      {/* CR / SLOPE is deliberately NOT rendered here: get_course_meta resolves
          one tee while CourseCardPanel resolves the member's own tee, so the two
          figures legitimately differ. The tee card, 300px below, owns and
          labels tee data. */}

      {/* Ranks live in the kicker (BRIEF_COURSE_RANK_ONE_FORM): a pill row here pushed the masthead up only on ranked courses. */}
    </div>
  );
};

interface StandaloneCourseDetailProps {
  course: CourseDetailRow;
  courseMeta: CourseMetaShape | null | undefined;
  activeTab: CourseTabId;
  handleTabChange: (tab: CourseTabId) => void;
  cinematicHero: React.ReactNode;
  tabContent: React.ReactNode;
}

const StandaloneCourseDetail: React.FC<StandaloneCourseDetailProps> = ({
  activeTab,
  handleTabChange,
  cinematicHero,
  tabContent,
}) => {
  const navigate = useNavigate();
  const { sentinelRef, stuck: tabsStuck } = useStickySafeAreaState();
  return (
    <div className="min-h-screen w-full" data-course-detail>
      {/* H3: header rendered globally by ChromeIsland (bleed=true, /courses fallback). */}
      {cinematicHero}
      <div ref={sentinelRef} style={{ height: 0 }} aria-hidden />
      <StickySafeAreaScrim visible={tabsStuck} background={A.CANVAS} />
      {/* The sticky tab band follows the page canvas. It was a light glass
          (rgba(248,250,252,0.72)) — that band, not FilterChips, is why the
          course tabs read light. Solid canvas per the mobile-performance rule
          (no static backdrop-filters). */}
      <div
        className="sticky"
        data-stuck={tabsStuck ? 'true' : 'false'}
        data-course-review-tabs
        style={{
          top: 'var(--sat, 0px)',
          zIndex: Z.stickyTabs,
          background: A.CANVAS,
        }}
      >
        <CourseDetailShellTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
      {tabContent}
    </div>
  );
};

export default GolfClubView;

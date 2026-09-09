import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
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
import CourseCommunityRating from '@/components/courses/CourseCommunityRating';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseTop100Standing } from '@/hooks/useCourseTop100Standing';
import { EXPLORE_COURSE_HERO_HEIGHT } from '@/lib/heroHeights';
import { Z } from '@/config/zIndex';
import { TAB_LEAD_IN } from '@/components/courses/course-detail/about/AboutSection';
import StickySafeAreaScrim, { useStickySafeAreaState } from '@/components/chrome/StickySafeAreaScrim';
import YourRoundsSheet from '@/components/courses/course-detail/you/YourRoundsSheet';


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
  // One course, one destination page the member deliberately navigated to —
  // see the hook header: the "never prefetch" rule is about N courses in a feed.
  const { data: courseStats } = useCourseStatsDetail(courseId, true);
  const communityRating = ratingAggregate?.avg_overall_score ?? null;
  const [statsSheetOpen, setStatsSheetOpen] = useState(false);
  const roundsSheetOpen = searchParams.get('sheet') === 'rounds';
  const closeRoundsSheet = useCallback(() => {
    if (!roundsSheetOpen) return;
    const next = new URLSearchParams(searchParams);
    next.delete('sheet');
    setSearchParams(next, { replace: true });
  }, [roundsSheetOpen, searchParams, setSearchParams]);
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


  // Both mounts share Explore's fixed hero height. The scrim ends transparent,
  // not on canvas, so the image keeps a straight lower edge.
  const heroImageBackground = course.thumbnail_image
    ? `url("${course.thumbnail_image}") center 40% / cover no-repeat`
    : A.CANVAS;
  const heroLegibilityScrim =
    'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.40) 72%, rgba(0,0,0,0.78) 100%)';

  // Modal-mode hero.
  const modalHeroBlock = (
    <div
      className="relative overflow-hidden"
      style={{
        height: EXPLORE_COURSE_HERO_HEIGHT,
        marginTop: 0,
        background: heroImageBackground,
        backgroundColor: A.CANVAS,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: heroLegibilityScrim }}
      />
      {/* Modal-path back chevron deleted (BRIEF_COURSES_CHROME_DARK): no caller
          passes onClose — the sole caller is CourseDetailPage.tsx:53 with
          isInModal={false} — so it was dead alongside the H3 FloatingPageHeader
          removal. The routed page's only back affordance is the ChromeIsland. */}

      <CourseTitleOverlay
        course={course}
        courseStats={courseStats ?? null}
        communityRating={communityRating}
        onOpenStats={() => setStatsSheetOpen(true)}
      />
    </div>
  );

  // Standalone (non-modal) full-bleed cinematic hero — bleeds into the notch.
  const cinematicHero = (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        height: EXPLORE_COURSE_HERO_HEIGHT,
        background: heroImageBackground,
        backgroundColor: A.CANVAS,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: heroLegibilityScrim }}
      />
      <CourseTitleOverlay
        course={course}
        courseStats={courseStats ?? null}
        communityRating={communityRating}
        onOpenStats={() => setStatsSheetOpen(true)}
      />
    </div>
  );

  const tabContent = (
    <div className="course-hero-wrapper" style={{ paddingTop: TAB_LEAD_IN }}>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsContent
          value="course"
          className={`mt-0 transition-opacity duration-200 ${activeTab === 'course' ? 'opacity-100' : 'hidden'}`}
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
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'legends' ? 'opacity-100' : 'hidden'}`}
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
            />

          </TabsContent>
        )}

        {visitedTabs.has('reviews') && (
          <TabsContent
            value="reviews"
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'reviews' ? 'opacity-100' : 'hidden'}`}
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
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'media' ? 'opacity-100' : 'hidden'}`}
          >
            <CourseMediaTabNew courseId={course.id} courseName={course.name} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  if (isInModal) {
    return (
      <div className="w-full">
        {modalHeroBlock}
        {/* Modal mode: legacy sticky underline tabs (no CompactHeader present) */}
        <div
          className="sticky bg-background"
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
        fieldAverage={fieldGross}
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
        fieldAverage={fieldGross}
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
  communityRating: number | null;
  onOpenStats: () => void;
}

// SF Pro tabular numerals, NOT a monospace face: Menlo / SF Mono / Consolas draw
// a slashed zero that `font-feature-settings: "zero" 0` cannot switch off.
const MONO_FIGURE: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"zero" 0, "tnum" 1',
  letterSpacing: '-0.03em',
  fontWeight: 700,
  fontSize: 12,
  color: 'rgba(255,255,255,0.95)',
  whiteSpace: 'nowrap',
};

const CELL_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.7)',
  whiteSpace: 'nowrap',
};

/** Round FIRST, then decide direction — otherwise -0.04 prints as "-0.0". */
const signedToPar = (raw: number): string => {
  const v = Math.round(raw * 10) / 10;
  if (v > 0) return `+${v.toFixed(1)}`;
  if (v < 0) return `-${Math.abs(v).toFixed(1)}`;
  return 'E';
};

const HeroStatCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
    <span style={CELL_LABEL}>{label}</span>
    <span style={MONO_FIGURE}>{value}</span>
  </span>
);

const CourseTitleOverlay: React.FC<CourseTitleOverlayProps> = ({
  course,
  courseStats,
  communityRating,
  onOpenStats,
}) => {
  const { t } = useTranslation('courses');
  const rounds = typeof courseStats?.rounds_tracked === 'number' ? courseStats.rounds_tracked : 0;
  const showBand = rounds > 0;

  const courseId = (course as { id?: string }).id ?? null;

  /**
   * The standing comes from course_top100_memberships — the lists are the one
   * source. The legacy global_rank / regional_rank / usa_rank columns on the
   * course record are deliberately NOT read here: nothing writes them, and on a
   * US course regional_rank actually holds the USA rank.
   */
  const { data: standing } = useCourseTop100Standing(courseId);
  const hasRank = Boolean(standing?.globalRank || standing?.regionalRank || standing?.usaRank);

  const shownRef = useRef<string | null>(null);
  useEffect(() => {
    if (!showBand || !courseId) return;
    if (shownRef.current === courseId) return;
    shownRef.current = courseId;
    analyticsEvents.track('course_hero_stats_shown', {
      course_id: courseId,
      rounds_tracked: rounds,
      has_your_pb: Boolean((courseStats?.your_rounds ?? 0) > 0 && courseStats?.your_best != null),
    });
  }, [showBand, courseId, rounds, courseStats?.your_rounds, courseStats?.your_best]);

  const cells: React.ReactNode[] = [];
  if (showBand && courseStats) {
    cells.push(<HeroStatCell key="rounds" label={t('courseHero.rounds')} value={String(rounds)} />);
    if (courseStats.avg_over_par != null) {
      cells.push(
        <HeroStatCell key="atp" label={t('courseHero.avgToPar')} value={signedToPar(courseStats.avg_over_par)} />
      );
    }
    if ((courseStats.your_rounds ?? 0) > 0 && courseStats.your_best != null) {
      cells.push(
        <HeroStatCell key="pb" label={t('courseHero.yourPb')} value={String(courseStats.your_best)} />
      );
    } else if (courseStats.harder_than_pct != null) {
      cells.push(
        <span key="harder" style={CELL_LABEL}>
          {t('courseHero.harderThan', { pct: Math.round(courseStats.harder_than_pct) })}
        </span>
      );
    }
  }
  if (communityRating != null) {
    cells.push(
      <CourseCommunityRating
        key="rating"
        rating={communityRating}
        size="sm"
        showLogo
        onDark
        forceNeutral
      />
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-4 px-4 z-[1] flex flex-col gap-2">
      <h1
        className="text-[23px] md:text-[26px] font-bold tracking-[-0.3px] text-white drop-shadow-2xl mb-1"
        style={{ lineHeight: 1.15 }}
      >
        {course.name}
      </h1>
      <p
        className="drop-shadow-lg mb-1"
        style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}
      >
        {formatCourseLocation(course)}
      </p>

      {/* Stats band sits above the rank badges so the two rows never collide. */}
      {cells.length > 0 && (
        <button
          type="button"
          onClick={() => {
            analyticsEvents.track('course_hero_stats_tapped', { course_id: courseId, rounds_tracked: rounds });
            onOpenStats();
          }}
          className="inline-flex items-center self-start drop-shadow-lg active:scale-[0.98] transition-transform"
          style={{
            padding: '4px 8px',
            marginLeft: -8,
            border: 0,
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {cells.map((cell, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>·</span>}
              {cell}
            </React.Fragment>
          ))}
        </button>
      )}

      {/* CR / SLOPE is deliberately NOT rendered here: get_course_meta resolves
          one tee while CourseCardPanel resolves the member's own tee, so the two
          figures legitimately differ. The tee card, 300px below, owns and
          labels tee data. */}

      {hasRank && (
        <div
          className="inline-flex items-center self-end shrink-0"
          style={{
            gap: 8,
          }}
        >
          <CourseRankBadges
            globalRank={standing?.globalRank ?? null}
            regionalRank={standing?.regionalRank ?? null}
            usaRank={standing?.usaRank ?? null}
            country={course.country}
            positioning="inline"
          />
        </div>
      )}
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
    <div className="min-h-screen w-full">
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

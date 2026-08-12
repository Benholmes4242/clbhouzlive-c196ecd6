import React, { useState, useCallback, useEffect, useRef } from 'react';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import { CourseTabs, type CourseTabId } from '@/components/courses/course-detail/CourseTabs';
import CourseDetailShellTabs from '@/features/courses/components/CourseDetailShellTabs';
// FloatingPageHeader removed (H3) — chrome now driven by ChromeIsland registry.
import { buildOverviewHeroBackground } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
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
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>Couldn't load this course</h2>
        <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, maxWidth: 280 }}>
          It may have been removed, or your connection dropped.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => refetchCourse()}
            style={{ background: '#0F172A', color: '#fff', border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </button>
          <button
            onClick={() => (isInModal && onClose ? onClose() : safeGoBack(navigate, '/courses'))}
            style={{ background: '#fff', color: '#0F172A', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
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


  // Modal-mode hero (legacy boxed image, 306px).
  const modalHeroBlock = (
    <div
      className="relative overflow-hidden bg-background"
      style={{
        height: 'calc(306px + var(--sat, env(safe-area-inset-top, 0px)))',
        marginTop: 0,
      }}
    >
      <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />
      {course.thumbnail_image && (
        <img
          src={course.thumbnail_image}
          alt={course.name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)',
        }}
      />
      {onClose && (
        <button
          onClick={onClose}
          className="absolute left-4 flex h-[34px] w-[34px] items-center justify-center active:scale-95 transition-all z-10"
          style={{
            top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 12px)',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.28)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </button>
      )}
      <CourseTitleOverlay
        course={course}
        courseStats={courseStats ?? null}
        communityRating={communityRating}
        onOpenStats={() => setStatsSheetOpen(true)}
      />
    </div>
  );

  // Standalone (non-modal) full-bleed cinematic hero — bleeds into the notch.
  // Pattern mirrors Tour hero: image as container `background` + paddingTop env(sat).
  // Same layered scrim as PhotoBand (Tour Overview hero) — see
  // `buildOverviewHeroBackground` in HybridHero.constants. Kept as a
  // dynamic import target so grep from either surface finds the pair.
  const heroBackground = buildOverviewHeroBackground(course.thumbnail_image ?? null);

  const cinematicHero = (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        minHeight: 'calc(clamp(280px, 35dvh, 390px) + env(safe-area-inset-top, 0px))',
        background: heroBackground,
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <CourseTitleOverlay
        course={course}
        courseStats={courseStats ?? null}
        communityRating={communityRating}
        onOpenStats={() => setStatsSheetOpen(true)}
      />
    </div>
  );

  const tabContent = (
    <div className="course-hero-wrapper bg-background">
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
            <CourseYouTab courseId={course.id} courseName={course.name} />
          </TabsContent>
        )}

        {visitedTabs.has('legends') && (
          <TabsContent
            value="legends"
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'legends' ? 'opacity-100' : 'hidden'}`}
          >
            <div className="hcp-light">
              <CourseLegendsDrilldown
                selection={{
                  courseId: course.id,
                  courseName: course.name,
                  courseRegion: course.region ?? null,
                  courseCountry: course.country ?? null,
                  courseType: (course as { course_type?: string | null }).course_type ?? null,
                }}
                hideHeader
                theme="light"
              />
            </div>
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
  fontSize: 13,
  color: 'rgba(255,255,255,0.95)',
};

const CELL_LABEL: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.7)',
};

/** Round FIRST, then decide direction — otherwise -0.04 prints as "-0.0". */
const signedToPar = (raw: number): string => {
  const v = Math.round(raw * 10) / 10;
  if (v > 0) return `+${v.toFixed(1)}`;
  if (v < 0) return `-${Math.abs(v).toFixed(1)}`;
  return 'E';
};

const HeroStatCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
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
  const hasRank = Boolean(course.global_rank || course.regional_rank || course.usa_rank);

  const courseId = (course as { id?: string }).id ?? null;
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
          className="inline-flex items-center self-start active:scale-[0.98] transition-transform"
          style={{
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: '4px 8px',
            marginLeft: -8,
            border: 0,
            gap: 6,
            flexWrap: 'wrap',
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
          one tee while CourseTeeCard resolves the member's own tee, so the two
          figures legitimately differ. The tee card, 300px below, owns and
          labels tee data. */}

      {hasRank && (
        <div
          className="inline-flex items-center self-end shrink-0"
          style={{
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: '4px 8px',
            gap: 8,
          }}
        >
          <CourseRankBadges
            globalRank={course.global_rank ?? null}
            regionalRank={course.regional_rank ?? null}
            usaRank={course.usa_rank ?? null}
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    setTabsStuck(window.scrollY > 200);
    const io = new IntersectionObserver(
      ([entry]) => setTabsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      className="min-h-screen w-full bg-background"
      style={{ paddingBottom: 'calc(var(--bottom-nav-height, 88px) + 16px)' }}
    >
      {/* H3: header rendered globally by ChromeIsland (bleed=true, /courses fallback). */}
      <GlassHeaderPlate visible={tabsStuck} />
      {cinematicHero}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
      <div
        className="sticky"
        style={{
          top: 'var(--sat, 0px)',
          zIndex: 30,
          background: 'rgba(248,250,252,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
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

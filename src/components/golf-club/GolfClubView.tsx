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
import { safeGoBack } from '@/utils/navigation';
import { formatCourseLocation } from '@/utils/courseLocation';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import CourseHolesTab from '@/features/courses/components/holes/CourseHolesTab';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';


interface GolfClubViewProps {
  courseId: string;
  isInModal?: boolean;
  onClose?: () => void;
}

const VALID_TABS: readonly CourseTabId[] = ['about', 'reviews', 'media', 'holes', 'legends'] as const;
const asTabId = (v: unknown): CourseTabId => (VALID_TABS.includes(v as CourseTabId) ? (v as CourseTabId) : 'about');

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
  const initialTab: CourseTabId = asTabId(tabFromState ?? tabFromQuery ?? 'about');
  const [activeTab, setActiveTab] = useState<CourseTabId>(initialTab);

  const highlightReviewId = searchParams.get('review');

  const [visitedTabs, setVisitedTabs] = useState<Set<CourseTabId>>(new Set([initialTab]));

  // Sync activeTab when URL/state changes (handles deep links when already mounted on this course)
  useEffect(() => {
    const nextState = (location.state ?? null) as { activeTab?: string } | null;
    const next = asTabId(nextState?.activeTab ?? searchParams.get('tab') ?? 'about');
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

  const { isLoading: ratingStatsLoading } = useCourseRatingAggregates(courseId);
  const { data: courseMeta } = useCourseMeta(courseId);
  void ratingStatsLoading;

  const handleTabChange = useCallback((newTab: CourseTabId) => {
    setActiveTab(newTab);
    setVisitedTabs(prev => new Set(prev).add(newTab));

    if (!isInModal) {
      const next = new URLSearchParams(searchParams);
      if (newTab === 'about') next.delete('tab'); else next.set('tab', newTab);
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
      <CourseTitleOverlay course={course} courseMeta={courseMeta} />
    </div>
  );

  // Standalone (non-modal) full-bleed cinematic hero — bleeds into the notch.
  // Pattern mirrors Tour hero: image as container `background` + paddingTop env(sat).
  const heroScrim =
    'linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.12) 22%, rgba(15,23,42,0) 42%, rgba(15,23,42,0) 55%, rgba(15,23,42,0.6) 100%)';
  const heroBackground = course.thumbnail_image
    ? `${heroScrim}, url(${course.thumbnail_image}) center 40% / cover no-repeat`
    : 'linear-gradient(180deg,#1E4D38,#0F172A)';

  const cinematicHero = (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        minHeight: 'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))',
        background: heroBackground,
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <CourseTitleOverlay course={course} courseMeta={courseMeta} />
    </div>
  );

  const tabContent = (
    <div className="course-hero-wrapper bg-background">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsContent
          value="about"
          className={`mt-0 transition-opacity duration-200 ${activeTab === 'about' ? 'opacity-100' : 'hidden'}`}
        >
          <CourseAboutTab
            course={course}
            onTabChange={handleTabChange}
          />
        </TabsContent>

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
        {visitedTabs.has('holes') && (
          <TabsContent
            value="holes"
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'holes' ? 'opacity-100' : 'hidden'}`}
          >
            <CourseHolesTab courseId={course.id} />
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
                  courseType: course.course_type ?? null,
                }}
                hideHeader
                theme="light"
              />
            </div>
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
          <CourseTabs activeTab={activeTab as any} onChange={handleTabChange as any} />
        </div>
        {tabContent}
      </div>
    );
  }

  return <StandaloneCourseDetail
    course={course}
    courseMeta={courseMeta}
    activeTab={activeTab}
    handleTabChange={handleTabChange}
    cinematicHero={cinematicHero}
    tabContent={tabContent}
  />;
};

interface CourseTitleOverlayProps {
  course: any;
  courseMeta: any;
}

const CourseTitleOverlay: React.FC<CourseTitleOverlayProps> = ({ course, courseMeta }) => (
  <div className="absolute inset-x-0 bottom-4 px-4 z-[1]">
    <h1
      className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.3px] text-white drop-shadow-2xl mb-1"
      style={{ lineHeight: 1.15 }}
    >
      {course.name}
    </h1>
    <p
      className="drop-shadow-lg mb-1"
      style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}
    >
      {formatCourseLocation(course)}
    </p>
    {(courseMeta?.course_cr != null || courseMeta?.course_slope != null) && (
      <p
        className="drop-shadow-lg mb-2"
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.7)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {[
          courseMeta?.course_cr != null ? `CR ${courseMeta.course_cr}` : null,
          courseMeta?.course_slope != null ? `SLOPE ${courseMeta.course_slope}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
    )}
    {(course.global_rank || course.regional_rank || course.usa_rank) && (
      <div
        className="inline-flex"
        style={{
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 8,
          padding: '4px 8px',
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

interface StandaloneCourseDetailProps {
  course: any;
  courseMeta: any;
  activeTab: string;
  handleTabChange: (tab: string) => void;
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
      style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 32px)' }}
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
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        }}
      >
        <CourseDetailShellTabs
          activeTab={activeTab as any}
          onTabChange={handleTabChange as any}
        />
      </div>
      {tabContent}
    </div>
  );
};

export default GolfClubView;

import React, { useState, useCallback, useEffect } from 'react';
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
import { CourseTabs } from '@/components/courses/course-detail/CourseTabs';
import CourseDetailShellTabs from '@/features/courses/components/CourseDetailShellTabs';
import FloatingPageHeader from '@/components/header/FloatingPageHeader';
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

const GolfClubView: React.FC<GolfClubViewProps> = ({ courseId, isInModal = false, onClose }) => {
  const { user } = useSupabaseSession();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const tabFromState = (location.state as any)?.activeTab;
  const tabFromQuery = searchParams.get('tab');
  const initialTab = tabFromState || tabFromQuery || 'about';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const highlightReviewId = searchParams.get('review');
  
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([initialTab]));

  // Sync activeTab when URL/state changes (handles deep links when already mounted on this course)
  useEffect(() => {
    const next = (location.state as any)?.activeTab || searchParams.get('tab') || 'about';
    setActiveTab(next);
    setVisitedTabs(prev => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, [searchParams, location.state]);

  const { data: course, isLoading: courseLoading } = useQuery({
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
      return data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { isLoading: ratingStatsLoading } = useCourseRatingAggregates(courseId);
  const { data: courseMeta } = useCourseMeta(courseId);

  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    setVisitedTabs(prev => new Set(prev).add(newTab));
    
    if (user?.id && courseId) {
      queryClient.invalidateQueries({ 
        queryKey: ['user-course-rating', courseId, user.id],
        refetchType: 'active'
      });
    }
  }, [user?.id, courseId, queryClient]);

  if ((courseLoading || !course) && ratingStatsLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
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
  const cinematicHero = (
    <div
      className="relative overflow-hidden bg-background"
      style={{
        height: 'clamp(380px, 44dvh, 460px)',
        width: '100%',
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

      {/* Top scrim — legibility for floating controls + status clock */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: 'calc(env(safe-area-inset-top, 0px) + 110px)',
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.1) 60%, rgba(15,23,42,0) 100%)',
        }}
      />

      {/* Bottom scrim — title legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '55%',
          background:
            'linear-gradient(180deg, rgba(15,23,42,0) 45%, rgba(15,23,42,0.55) 100%)',
        }}
      />

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
                  courseRegion: (course as any).region ?? null,
                  courseCountry: (course as any).country ?? null,
                  courseType: (course as any).course_type ?? null,
                }}
                hideHeader
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
        {heroBlock}
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

  return (
    <div
      className="min-h-screen w-full bg-background"
      style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}
    >
      <ShellSlot>
        <CourseDetailShellTabs
          activeTab={activeTab as any}
          onTabChange={handleTabChange as any}
        />
      </ShellSlot>
      <div style={{ paddingTop: 'calc(var(--chrome-total-h, 0px) - 1px)' }}>
        {heroBlock}
        {tabContent}
      </div>
    </div>
  );
};

export default GolfClubView;

import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { IoMdArrowBack } from 'react-icons/io';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTab from '@/components/courses/course-detail/CourseMediaTab';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import { CourseTabs } from '@/components/courses/course-detail/CourseTabs';
import { formatCourseLocation } from '@/utils/courseLocation';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';


interface GolfClubViewProps {
  courseId: string;
  isInModal?: boolean;
  onClose?: () => void;
}

const GolfClubView: React.FC<GolfClubViewProps> = ({ courseId, isInModal = false, onClose }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Support both location.state and query params for tab selection
  // Priority: state > query param > default
  const tabFromState = (location.state as any)?.activeTab;
  const tabFromQuery = searchParams.get('tab');
  const initialTab = tabFromState || tabFromQuery || 'about';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Read reviewId for deep linking (passed to CourseReviewsTab)
  const highlightReviewId = searchParams.get('review');
  
  // Phase 3: Track which tabs have been visited for keep-mounted pattern
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([initialTab]));

  // Fire both queries in parallel for faster initial load
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // FIX #2: Use centralized rating aggregates hook instead of client-side calculation
  const { isLoading: ratingStatsLoading } = useCourseRatingAggregates(courseId);


  // FIX #4: Tab Switch Refetch Safety Net
  // Force refetch of user-specific data when switching tabs
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    setVisitedTabs(prev => new Set(prev).add(newTab));
    
    // Force refetch user-specific data when switching tabs
    // This acts as a safety net for any edge cases missed by optimistic updates
    if (user?.id && courseId) {
      queryClient.invalidateQueries({ 
        queryKey: ['user-course-rating', courseId, user.id],
        refetchType: 'active' // Only refetch if query is actively being used
      });
    }
  }, [user?.id, courseId, queryClient]);

  // Phase 2 Perf: Only show skeleton if both queries are loading
  // This prevents unnecessary skeleton flash when data is cached
  if ((courseLoading || !course) && ratingStatsLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return <CourseDetailSkeleton />;
  }

  return (
      <div className={isInModal ? "w-full" : "min-h-screen w-full bg-muted"}>
      {/* Hero Image - bleeds into safe area */}
      <div 
        className="relative overflow-hidden bg-muted"
        style={{
          height: 'calc(16rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
          marginTop: 0,
        }}
      >
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />
        )}
        
        {/* Dark gradient overlay for text legibility - matches PostPlayRatingModal */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Glass back button - positioned below safe area */}
        {!isInModal && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all z-10"
            style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        )}
        
        {/* Back button for modal */}
        {isInModal && onClose && (
          <button
            onClick={onClose}
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all z-10"
            style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
            aria-label="Go back"
          >
            <IoMdArrowBack className="h-6 w-6 text-white" />
          </button>
        )}

        {/* Course name and location overlay on image - matches PostPlayRatingModal */}
        <div className="absolute inset-x-0 bottom-4 px-4">
          <h1 className="text-4xl md:text-5xl font-semibold text-white drop-shadow-2xl mb-1.5">
            {course.name}
          </h1>
          <p className="text-lg md:text-xl text-white opacity-90 drop-shadow-lg mb-2">
            {formatCourseLocation(course)}
          </p>
          
          {/* Top 100 Pills */}
          {(course.global_rank || course.regional_rank || course.usa_rank) && (
            <CourseRankBadges 
              globalRank={course.global_rank ?? null}
              regionalRank={course.regional_rank ?? null}
              usaRank={course.usa_rank ?? null}
              country={course.country}
              positioning="inline"
            />
          )}
        </div>
      </div>

      {/* Segmented Control Tabs - positioned below hero */}
      <CourseTabs activeTab={activeTab as any} onChange={handleTabChange as any} />

      {/* Phase 3: Keep-mounted tabs - render all visited tabs, hide inactive */}
      <div className="course-hero-wrapper bg-muted">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* About Tab - always rendered */}
          <TabsContent 
            value="about" 
            className={`mt-0 transition-opacity duration-200 ${activeTab === 'about' ? 'opacity-100' : 'hidden'}`}
          >
            <CourseAboutTab 
              course={course} 
              onTabChange={handleTabChange}
            />
          </TabsContent>
          
          {/* Reviews Tab - render after first visit */}
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
          
          {/* Media Tab - render after first visit */}
          {visitedTabs.has('media') && (
            <TabsContent 
              value="media" 
              className={`mt-0 transition-opacity duration-200 ${activeTab === 'media' ? 'opacity-100' : 'hidden'}`}
            >
              <CourseMediaTab courseId={course.id} courseName={course.name} />
            </TabsContent>
          )}
        </Tabs>
      </div>

    </div>
  );
};

export default GolfClubView;
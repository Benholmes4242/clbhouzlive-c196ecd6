import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import { CourseTabs } from '@/components/courses/course-detail/CourseTabs';
import { formatCourseLocation } from '@/utils/courseLocation';
import { safeGoBack } from '@/utils/navigation';
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
  
  const tabFromState = (location.state as any)?.activeTab;
  const tabFromQuery = searchParams.get('tab');
  const initialTab = tabFromState || tabFromQuery || 'about';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const highlightReviewId = searchParams.get('review');
  
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([initialTab]));

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

  return (
    <div
      className={isInModal ? "w-full" : "min-h-screen w-full bg-background"}
      style={!isInModal ? { paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' } : undefined}
    >
      {/* Hero Image - bleeds into safe area */}
      <div 
        className="relative overflow-hidden bg-background"
        style={{
          height: 'calc(45dvh + var(--sat, env(safe-area-inset-top, 0px)))',
          minHeight: '220px',
          maxHeight: '400px',
          marginTop: 0,
        }}
      >
        {/* Always render gradient fallback behind image */}
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />
        {course.thumbnail_image && (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        
        {/* Dark gradient scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)',
          }}
        />
        
        {/* Back button for modal */}
        {isInModal && onClose && (
          <button
            onClick={onClose}
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm active:scale-95 transition-all z-10"
            style={{ top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 12px)' }}
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2} />
          </button>
        )}

        {/* Back button for non-modal */}
        {!isInModal && (
          <button
            onClick={() => safeGoBack(navigate, '/courses')}
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm active:scale-95 transition-all z-10"
            style={{ top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 12px)' }}
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2} />
          </button>
        )}

        {/* Course name and location overlay */}
        <div className="absolute inset-x-0 bottom-4 px-4">
          <h1 className="text-[22px] md:text-[28px] font-extrabold tracking-[-0.3px] text-white drop-shadow-2xl mb-1.5">
            {course.name}
          </h1>
          <p className="drop-shadow-lg mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
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

      {/* Tabs — flush below hero */}
      <CourseTabs activeTab={activeTab as any} onChange={handleTabChange as any} />

      {/* Keep-mounted tabs */}
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
        </Tabs>
      </div>
    </div>
  );
};

export default GolfClubView;

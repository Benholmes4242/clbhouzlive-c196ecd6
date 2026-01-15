import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
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
  useSupabaseSession(); // Keep session check for auth context
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check location state for initial tab and highlight flag
  const initialTab = (location.state as any)?.activeTab || 'about';
  const [activeTab, setActiveTab] = useState(initialTab);
  
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


  // Phase 3: Track visited tabs and handle tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setVisitedTabs(prev => new Set(prev).add(newTab));
  };

  // Phase 2 Perf: Only show skeleton if both queries are loading
  // This prevents unnecessary skeleton flash when data is cached
  if ((courseLoading || !course) && ratingStatsLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return <CourseDetailSkeleton />;
  }

  return (
    <div className={isInModal ? "w-full" : "min-h-screen w-full bg-slate-50"}>
      {/* Extended Hero Banner - continues behind tabs */}
      <div className="course-hero-container relative overflow-hidden">
        {/* Back button - positioned over hero image */}
        {!isInModal && (
          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 left-3 md:top-4 md:left-4 z-20 h-9 w-9 bg-black/20 backdrop-blur-sm rounded-md flex items-center justify-center hover:bg-black/40 transition-colors focus:outline-none"
            aria-label="Go back"
          >
            <ArrowLeft className="!h-5 !w-5 text-white" />
          </button>
        )}
        
        {/* Back button for modal */}
        {isInModal && onClose && (
          <button
            onClick={onClose}
            className="glass-dark absolute top-3 left-3 md:top-4 md:left-4 z-20 rounded-xl p-2 flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="Go back"
          >
            <IoMdArrowBack className="h-6 w-6 text-white" />
          </button>
        )}
        
        <img
          src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop'}
          srcSet={course.thumbnail_image ? `
            ${course.thumbnail_image}?w=1200&h=600&fit=crop&q=80 1200w,
            ${course.thumbnail_image}?w=1920&h=960&fit=crop&q=85 1920w
          ` : `
            https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop 1200w,
            https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920&h=960&fit=crop 1920w
          `}
          sizes="(max-width: 768px) 100vw, 1200px"
          alt={course.name}
          loading="eager"
          fetchPriority="high"
          className="course-hero-image w-full h-full object-cover !rounded-bl-none"
          onLoad={(e) => {
            e.currentTarget.classList.add('loaded');
          }}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop';
            e.currentTarget.srcset = `
              https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop 1200w,
              https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920&h=960&fit=crop 1920w
            `;
          }}
        />
        
        {/* Cinematic gradient overlay for premium look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        
        {/* Course Title & Location - Bottom Left with text shadows */}
        <div className="absolute bottom-8 left-6 text-white z-10">
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1.5"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            {course.name}
          </h1>
          <p 
            className="text-base md:text-lg text-white/90 mb-3"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
          >
            {formatCourseLocation(course)}
          </p>
          
          {/* Top 100 Pills - Premium styled */}
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
      <div className="course-hero-wrapper bg-slate-50">
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
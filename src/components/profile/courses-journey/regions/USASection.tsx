import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import EnhancedRegionalCoursesModal from '@/components/profile/EnhancedRegionalCoursesModal';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { usePlayedCoursesWithRatings } from '@/hooks/usePlayedCoursesWithRatings';
import { getRegionalSortedCourses } from '../utils/courseSorting';
import type { RegionSectionProps, RegionNavigationProps, ConditionalSectionProps } from '../types';

// Navigation Component
const USANavigation: React.FC<RegionNavigationProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: usaCourses = [] } = useQuery({
    queryKey: ['usaCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image,
            course_rating_aggregates(avg_overall_score, review_count)
          )
        `)
        .eq('user_id', userId)
        .not('rating', 'is', null);

      if (ratedError) throw ratedError;

      const coursesWithFormat = (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at,
        id: `rating-${course.course_id}`,
        averageRating: course.golf_courses?.course_rating_aggregates?.[0]?.avg_overall_score || null,
        userRating: course.rating
      }));

      const usaCourses = coursesWithFormat.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.country === 'USA';
      });

      const uniqueCoursesMap = new Map();
      
      usaCourses.forEach(course => {
        const courseId = course.course_id;
        if (!uniqueCoursesMap.has(courseId)) {
          uniqueCoursesMap.set(courseId, course);
        }
      });

      const rawCourses = Array.from(uniqueCoursesMap.values());
      return getRegionalSortedCourses(rawCourses);
    },
    enabled: !!userId,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        See All
      </Button>
      <EnhancedRegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="USA"
        courses={usaCourses}
        isOwnProfile={isOwnProfile}
        userId={userId}
      />
    </>
  );
};

// Section Component
const USASection: React.FC<RegionSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: usaCourses = [], isLoading: usaLoading } = usePlayedCoursesWithRatings(userId || '', 'usa');

  const { isHydrated } = useViewPreference();

  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(usaCourses.length);

  const usaRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  return (
    <div className="w-full pt-0">
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : usaCourses.length > 0 ? (
            <div className="relative">
              <div
                ref={usaRefCallback}
                className="
                  flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                  [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                  [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
                "
              >
                {usaCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id}
                    className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))]"
                  >
                    <div className="w-full overflow-hidden rounded-none relative aspect-[4/5]">
                      <CourseCard 
                        course={{
                          ...userCourse.golf_courses,
                          average_rating: userCourse.averageRating
                        }}
                        viewingUserId={userId}
                        viewContext="global"
                        userRating={userCourse.userRating}
                        isReadOnly={!isOwnProfile}
                        showUserRating={true}
                        showAverageRating={true}
                        showRatingOnRight={true}
                        isFromUserCoursesPage={true}
                        customHeight="h-full"
                        currentUserId={userId}
                        profileOwnerFirstName={isOwnProfile ? "You" : "User"}
                        badgesOnTop={true}
                        mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "You haven't played any USA courses yet." 
                  : `${userDisplayName || 'User'} hasn't played any USA courses yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Conditional Wrapper
const USAConditionalSection: React.FC<ConditionalSectionProps> = ({ userId, isOwnProfile, userDisplayName }) => {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['usaCoursesCheck', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .not('rating', 'is', null)
        .eq('golf_courses.country', 'USA');

      if (ratedError) throw ratedError;

      return ratedData || [];
    },
    enabled: !!userId,
  });

  return (
    <>
      <div className="w-full pt-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-0">
            <h4 className="text-xl text-muted-foreground mb-0">USA</h4>
            <div className="flex gap-2">
              <USANavigation userId={userId} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>
      </div>
      {!isLoading && courses.length > 0 ? (
        <USASection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      ) : !isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "You haven't played any USA courses yet." 
              : `${userDisplayName?.split(' ')[0] || 'User'} hasn't played any USA courses yet.`}
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </>
  );
};

export default USAConditionalSection;

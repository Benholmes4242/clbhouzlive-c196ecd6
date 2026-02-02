import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useSectionLoader } from '@/hooks/useSectionLoader';
import SkeletonRow from '@/components/ui/SkeletonRow';
import { getSortedUserCourses } from './utils/courseSorting';
import type { RecentlyPlayedSectionProps } from './types';

const RecentlyPlayedSection: React.FC<RecentlyPlayedSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const recentlyPlayedLoader = useSectionLoader(useCallback(async () => {
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
          thumbnail_image
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ratedError) throw ratedError;

    const rawCourses = (ratedData || []).map(course => ({
      ...course,
      played_date: course.created_at,
    }));
    
    return getSortedUserCourses(rawCourses, 'recent');
  }, [userId]));

  const filteredCourses = useMemo(() => {
    let coursesToFilter = recentlyPlayedLoader.data;
    
    if (activeFilter) {
      coursesToFilter = coursesToFilter.filter((userCourse) => {
        const course = userCourse.golf_courses;
        if (!course) return false;

        switch (activeFilter) {
          case 'britain-ireland':
            return course.country === 'Britain & Ireland' && course.regional_rank && course.regional_rank <= 100;
          case 'europe':
            return course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100;
          case 'usa':
            return course.country === 'USA' && course.regional_rank && course.regional_rank <= 100;
          case 'global':
            return course.global_rank && course.global_rank <= 100;
          default:
            return true;
        }
      });
    }
    
    return getSortedUserCourses(coursesToFilter, sortBy);
  }, [recentlyPlayedLoader.data, activeFilter, sortBy]);

  const { carouselRef, canScrollLeft, canScrollRight, scroll } = useCarouselNavigation(filteredCourses.length);

  if (recentlyPlayedLoader.isEmpty) {
    return null;
  }

  return (
    <section className="w-full fullbleed md:mx-auto md:px-0 pt-4 pb-4" data-section="recently-rated">
      <div className="max-w-none md:max-w-6xl md:mx-auto">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Recently Rated
          </h3>
          <div className="flex gap-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative">
          {recentlyPlayedLoader.loading && <SkeletonRow count={6} />}
          {recentlyPlayedLoader.hasData && (
            <div
              ref={carouselRef}
              className="
                flex overflow-x-auto no-scrollbar
                gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
              "
            >
              {filteredCourses.map((userCourse, index) => (
                <article 
                  key={`recently-played-${userCourse.course_id || userCourse.golf_courses?.id}-${index}`}
                  className="
                    shrink-0
                    basis-[calc(100vw/2.6)]
                    md:basis-[calc((100%-((var(--g,1rem)*(var(--cards,4)-1))))/var(--cards,4))]
                  "
                >
                  <div className="relative w-[calc(100vw/2.6)] md:w-full aspect-[4/5] overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                      <CourseCard 
                        course={userCourse.golf_courses}
                        viewingUserId={userId}
                        viewContext="global"
                        userRating={userCourse.rating}
                        isReadOnly={!isOwnProfile}
                        showUserRating={false}
                        showAverageRating={false}
                        isFromUserCoursesPage={true}
                        customHeight="h-full"
                        showCountryWithFlag={true}
                        hideRankingBadges={true}
                        mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
                        mobileFlagSize={windowWidth < 768 ? 'md' : 'md'}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(RecentlyPlayedSection);

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { getSortedUserCourses } from './utils/courseSorting';
import type { HighlightReelSectionProps } from './types';

const HighlightReelSection: React.FC<HighlightReelSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent');
  const { isHydrated } = useViewPreference();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['highlightReelCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          created_at,
          rating,
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
        .not('rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ratingsError) throw ratingsError;

      return (ratingsData || []).map(rating => ({
        course_id: rating.course_id,
        played_date: rating.created_at,
        rating: rating.rating,
        id: `course-${rating.course_id}`,
        golf_courses: rating.golf_courses
      }));
    },
    enabled: !!userId,
  });
  
  const filteredCourses = useMemo(() => {
    let coursesToFilter = allPlayedCourses;
    
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
  }, [allPlayedCourses, activeFilter, sortBy]);

  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(filteredCourses.length);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => scroll('right'),
    onSwipeRight: () => scroll('left'),
    threshold: 50
  });

  const highlightReelRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
    swipeRef.current = node;
  }, [combinedRef, swipeRef]);

  if (isHydrated && filteredCourses.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 pb-2" style={{ paddingTop: '16px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Highlights From My Journey
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
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div
              className="
                flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
              "
            >
              {filteredCourses.map((userCourse) => {
                const imageUrl = userCourse.golf_courses?.thumbnail_image;
                
                if (!imageUrl) {
                  return null;
                }

                return (
                  <div 
                    key={userCourse.id}
                    className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] data-card"
                  >
                    <div className="aspect-[4/5] w-full relative group">
                      <img
                        src={imageUrl}
                        alt={userCourse.golf_courses?.name}
                        className="w-full h-full object-cover rounded-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeFilter ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No courses found in the selected region.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile ? "No highlights to show yet. Play some courses to see them here!" : "No highlights available."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(HighlightReelSection);

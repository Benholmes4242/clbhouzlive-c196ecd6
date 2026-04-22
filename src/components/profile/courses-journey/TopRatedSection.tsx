import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useSectionLoader } from '@/hooks/useSectionLoader';
import SkeletonRow from '@/components/ui/SkeletonRow';
import type { TopRatedSectionProps } from './types';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';

const TopRatedSection: React.FC<TopRatedSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const { user: currentUser } = useSupabaseSession();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  const { data: profileOwner } = useQuery({
    queryKey: ['profileOwner', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const topRatedLoader = useSectionLoader(useCallback(async () => {
    if (!userId) return [];

    const { data: ratedData, error: ratedError } = await supabase
      .from('course_ratings')
      .select(`
        course_id,
        rating,
        created_at,
        review_date,
        design_score,
        condition_score,
        clubhouse_score,
        facilities_score,
        golf_courses!inner (
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
      // Server-side primary sort; we re-apply the full canonical comparator
      // client-side so the chain is identical to every other own-rating surface.
      .order('rating', { ascending: false })
      .limit(50);

    if (ratedError) throw ratedError;

    const courseIds = (ratedData || []).map(course => course.course_id);
    
    const { data: statsData, error: statsError } = await supabase
      .from('course_rating_aggregates')
      .select('course_id, avg_overall_score')
      .in('course_id', courseIds);

    if (statsError) throw statsError;

    const statsMap = new Map();
    (statsData || []).forEach(stat => {
      statsMap.set(stat.course_id, stat.avg_overall_score);
    });

    return (ratedData || []).map(course => ({
      ...course,
      played_date: course.created_at,
      id: `rating-${course.course_id}`,
      golf_courses: {
        ...course.golf_courses,
        average_rating: statsMap.get(course.course_id) || null
      }
    }));
  }, [userId]));

  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(topRatedLoader.data.length);

  const topRatedRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  const getTopAccentGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent';
      case 1: return 'bg-gradient-to-r from-transparent via-gray-400 to-transparent';
      case 2: return 'bg-gradient-to-r from-transparent via-amber-700 to-transparent';
      default: return '';
    }
  };

  const getRankBadgeGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600';
      case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500';
      case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800';
      default: return 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30';
    }
  };

  const getCardShadow = (position: number) => {
    return position < 3 ? 'shadow-xl shadow-black/20' : 'shadow-lg';
  };

  return (
    <div className="w-full px-4 pt-0 pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Top 10 Rated by You
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
          {topRatedLoader.loading && <SkeletonRow count={6} />}
          {topRatedLoader.hasData && (
            <div
              ref={topRatedRefCallback}
              className="
                flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
              "
            >
              {topRatedLoader.data.map((userCourse, index) => {
                const isTopThree = index < 3;

                return (
                  <div 
                    key={userCourse.id}
                    className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] relative"
                  >
                    <div className={`${index === 0 ? 'rated-card ' : ''}w-full aspect-[4/5] relative overflow-hidden rounded-none ${getCardShadow(index)}`}>
                      {isTopThree && (
                        <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
                      )}
                      
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
                      
                      <div className="absolute top-3 left-3 z-20">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${getRankBadgeGradient(index)}
                          ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
                          ${isTopThree ? 'ring-1 ring-white/20' : ''}
                        `}>
                          <span className={`
                            text-white font-medium text-sm leading-none
                            ${isTopThree ? 'drop-shadow-sm' : ''}
                          `}>
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {topRatedLoader.isEmpty && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You haven't rated any courses yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TopRatedSection);

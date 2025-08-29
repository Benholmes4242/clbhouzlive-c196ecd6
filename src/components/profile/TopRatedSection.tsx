import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Custom sorting function for user courses with different sort options
const getSortedUserCourses = (userCourses: any[], sortBy: string) => {
  const sortedCourses = userCourses.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        // Sort by most recent played date
        const dateA = new Date(a.played_date || a.created_at || '1970-01-01').getTime();
        const dateB = new Date(b.played_date || b.created_at || '1970-01-01').getTime();
        return dateB - dateA;
      
      case 'rating':
        // Sort by highest rating first
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingA !== ratingB) {
          return ratingB - ratingA;
        }
        // If ratings are equal, sort by date
        const dateA2 = new Date(a.played_date || a.created_at || '1970-01-01').getTime();
        const dateB2 = new Date(b.played_date || b.created_at || '1970-01-01').getTime();
        return dateB2 - dateA2;
      
      default:
        return 0;
    }
  });
  
  return sortedCourses;
};

interface TopRatedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const TopRatedSection: React.FC<TopRatedSectionProps> = ({ 
  userId = '',
  isOwnProfile = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Query to get top rated courses
  const { data: allRatedCourses = [] } = useQuery({
    queryKey: ['topRatedCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from course_ratings only (these have ratings)
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
        .not('rating', 'is', null); // Only get courses with ratings

      if (ratedError) throw ratedError;

      const coursesWithRatings = (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at,
        id: `rating-${course.course_id}`
      }));
      
      // Sort by rating (highest first)
      return getSortedUserCourses(coursesWithRatings, 'rating');
    },
    enabled: !!userId,
  });

  // Take only the top 10 rated courses
  const topRatedCourses = useMemo(() => {
    return allRatedCourses.slice(0, 10);
  }, [allRatedCourses]);

  const cardsPerView = 3; // Show 3 cards at a time
  const maxIndex = Math.max(0, topRatedCourses.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (topRatedCourses.length === 0) {
    return null; // Don't render if no rated courses
  }

  return (
    <div className="w-full px-4 pt-6 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Top 10 Rated by You
          </h3>
          
          {/* Navigation arrows */}
          {topRatedCourses.length > cardsPerView && (
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="p-2 rounded-full bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Course cards carousel */}
        <div className="relative overflow-hidden">
          <div 
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              width: `${(topRatedCourses.length / cardsPerView) * 100}%`
            }}
          >
            {topRatedCourses.map((userCourse, index) => {
              const course = userCourse.golf_courses;
              if (!course) return null;

              return (
                <div 
                  key={`${course.id}-${index}`}
                  className="flex-shrink-0"
                  style={{ width: `${100 / topRatedCourses.length}%` }}
                >
                  <CourseCard
                    course={{
                      ...course,
                      id: course.id,
                      name: course.name || 'Unknown Course',
                      thumbnail_image: course.thumbnail_image,
                      global_rank: course.global_rank,
                      regional_rank: course.regional_rank,
                      usa_rank: course.usa_rank,
                      country: course.country,
                      region: course.region
                    }}
                    userRating={userCourse.rating}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopRatedSection;
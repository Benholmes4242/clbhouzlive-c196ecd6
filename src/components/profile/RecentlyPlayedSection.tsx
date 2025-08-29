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

interface RecentlyPlayedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const RecentlyPlayedSection: React.FC<RecentlyPlayedSectionProps> = ({ 
  userId = '',
  isOwnProfile = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Query to get recently played courses
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['recentlyPlayedCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from user_top100_courses
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
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
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings
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
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      // Combine and deduplicate, ensuring consistent structure
      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null, // Add rating field for consistency
          id: `top100-${course.course_id}` // Unique ID for deduplication
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at, // Use rating date as played date
          id: `rating-${course.course_id}` // Unique ID for deduplication
        }))
      ];

      // Remove duplicates based on course_id, preferring rated courses over top100 courses
      const uniqueCoursesMap = new Map();
      
      combinedCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          // Prefer courses with ratings over those without
          if (course.rating !== null && course.rating !== undefined && 
              (existing.rating === null || existing.rating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      const rawCourses = Array.from(uniqueCoursesMap.values());
      
      // Apply sorting here to ensure proper order
      return getSortedUserCourses(rawCourses, 'recent');
    },
    enabled: !!userId,
  });

  // Take only the first 10 courses for recently played
  const recentCourses = useMemo(() => {
    return allPlayedCourses.slice(0, 10);
  }, [allPlayedCourses]);

  const cardsPerView = 3; // Show 3 cards at a time
  const maxIndex = Math.max(0, recentCourses.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (recentCourses.length === 0) {
    return null; // Don't render if no courses
  }

  return (
    <div className="w-full px-4 pt-6 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Recently Played
          </h3>
          
          {/* Navigation arrows */}
          {recentCourses.length > cardsPerView && (
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
              width: `${(recentCourses.length / cardsPerView) * 100}%`
            }}
          >
            {recentCourses.map((userCourse, index) => {
              const course = userCourse.golf_courses;
              if (!course) return null;

              return (
                <div 
                  key={`${course.id}-${index}`}
                  className="flex-shrink-0"
                  style={{ width: `${100 / recentCourses.length}%` }}
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

export default RecentlyPlayedSection;
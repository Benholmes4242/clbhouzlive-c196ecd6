
import React, { useState, useMemo } from 'react';
import { useUserCoursesData } from './user/useUserCoursesData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import UserCoursesHeader from './user/UserCoursesHeader';
import UserCoursesRegionalTiles from './user/UserCoursesRegionalTiles';
import CourseCard from './CourseCard';
import { EmptyTop100State } from './user/UserCoursesEmptyStates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Top100AchievementsSection from '@/components/profile/Top100AchievementsSection';
import Top100VideoHighlights from '@/components/profile/Top100VideoHighlights';

interface UserCoursesContentProps {
  username?: string;
  isOwnProfile?: boolean;
  displayName?: string;
}

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999;
};

// Custom sorting function for user courses with different sort options
const getSortedUserCourses = (userCourses: any[], sortBy: string) => {
  console.log('Sorting user courses in UserCoursesContent:', userCourses.map(c => ({ 
    name: c.golf_courses?.name, 
    rating: c.rating 
  })));
  
  const sortedCourses = userCourses.sort((a, b) => {
    switch (sortBy) {
      case 'rating-high-low':
        // Sort by rating descending (10, 9, 8, ...)
        const aRating = a.rating;
        const bRating = b.rating;
        
        if (aRating !== null && aRating !== undefined && bRating !== null && bRating !== undefined) {
          return bRating - aRating;
        }
        if (aRating !== null && aRating !== undefined) return -1;
        if (bRating !== null && bRating !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRank = getCourseRanking(a.golf_courses);
        const bRank = getCourseRanking(b.golf_courses);
        return aRank - bRank;
        
      case 'rating-low-high':
        // Sort by rating ascending (0.5, 1, 2, ...)
        const aRatingLow = a.rating;
        const bRatingLow = b.rating;
        
        if (aRatingLow !== null && aRatingLow !== undefined && bRatingLow !== null && bRatingLow !== undefined) {
          return aRatingLow - bRatingLow;
        }
        if (aRatingLow !== null && aRatingLow !== undefined) return -1;
        if (bRatingLow !== null && bRatingLow !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRankLow = getCourseRanking(a.golf_courses);
        const bRankLow = getCourseRanking(b.golf_courses);
        return aRankLow - bRankLow;
        
      case 'recently-played':
      default:
        // Sort by most recent date (played_date or created_at for ratings)
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
    }
  });
  
  console.log('Final sorted order in UserCoursesContent:', sortedCourses.map(c => ({ 
    name: c.golf_courses?.name, 
    rating: c.rating 
  })));
  
  return sortedCourses;
};

const UserCoursesContent: React.FC<UserCoursesContentProps> = ({ 
  username,
  isOwnProfile = false,
  displayName
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('rating-high-low');
  
  const {
    targetUserId,
    displayName: hookDisplayName,
    isOwnProfile: hookIsOwnProfile,
    top100CoursesRaw,
    isLoadingTop100
  } = useUserCoursesData(username);

  // Use props if provided, fallback to hook values
  const finalDisplayName = displayName || hookDisplayName;
  const finalIsOwnProfile = isOwnProfile !== undefined ? isOwnProfile : hookIsOwnProfile;

  const { regionProgress, isLoading: isLoadingProgress } = useTop100CoursesData(
    targetUserId || '',
    finalIsOwnProfile
  );

  // Query to get all played courses (from both tables) for filtering
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['allPlayedCourses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      // Get courses from user_top100_courses table
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
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings table
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
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId);

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
      console.log('Raw combined courses before sorting:', rawCourses.map(c => ({ 
        name: c.golf_courses?.name, 
        rating: c.rating 
      })));
      
      // Apply sorting here to ensure proper order
      return getSortedUserCourses(rawCourses, 'rating-high-low');
    },
    enabled: !!targetUserId,
  });

  // Filter and sort courses based on active filter and sort option
  const filteredCourses = useMemo(() => {
    let coursesToFilter = allPlayedCourses;
    
    // First apply regional filtering if active
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
    
    // Then apply sorting
    const sortedCourses = getSortedUserCourses(coursesToFilter, sortBy);
    
    console.log('Final filtered and sorted courses:', sortedCourses.map(c => ({ 
      name: c.golf_courses?.name, 
      rating: c.rating,
      sortBy 
    })));
    
    return sortedCourses;
  }, [allPlayedCourses, activeFilter, sortBy]);

  return (
    <div className="space-y-8">
      <UserCoursesHeader 
        displayName={finalDisplayName} 
        isOwnProfile={finalIsOwnProfile} 
      />

      {/* Achievements and Video Highlights Section */}
      {targetUserId && (
        <div className="flex gap-4">
          <Top100AchievementsSection 
            userId={targetUserId} 
            isOwnProfile={finalIsOwnProfile}
            userDisplayName={finalDisplayName}
          />
          <Top100VideoHighlights />
        </div>
      )}

      <UserCoursesRegionalTiles
        regionProgress={regionProgress}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        isLoading={isLoadingProgress}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="space-y-4">
        {isLoadingTop100 ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourses.map((userCourse) => (
              <CourseCard 
                key={userCourse.id} 
                course={userCourse.golf_courses}
                viewingUserId={targetUserId}
                viewContext="global"
                userRating={userCourse.rating}
                isReadOnly={!finalIsOwnProfile}
                showUserRating={true}
                isFromUserCoursesPage={true}
              />
            ))}
          </div>
        ) : activeFilter ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No courses found in the selected region.
            </p>
          </div>
        ) : (
          <EmptyTop100State isOwnProfile={finalIsOwnProfile} displayName={finalDisplayName} />
        )}
      </div>
    </div>
  );
};

export default UserCoursesContent;

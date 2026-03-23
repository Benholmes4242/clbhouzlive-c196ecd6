
import React, { useState, useMemo } from 'react';
import { useUserCoursesData } from './user/useUserCoursesData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { useMilestoneUnlockDates } from '@/hooks/useMilestoneUnlockDates';
import UserCoursesHeader from './user/UserCoursesHeader';
import UserCoursesRegionalTiles from './user/UserCoursesRegionalTiles';
import CourseCard from './CourseCard';
import CourseListItem from './CourseListItem';
import { EmptyTop100State } from './user/UserCoursesEmptyStates';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ViewToggle from '@/components/profile/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CoursePickerModal from '@/components/profile/CoursePickerModal';
import CoursesControls from '@/components/profile/CoursesControls';

import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

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
      case 'rank-desc':
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
        
      case 'rank-asc':
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
        
      case 'recent':
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
  const [sortBy, setSortBy] = useState<string>('rank-desc');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState(false);
  const { viewType, setViewType, isHydrated } = useViewPreference();
  const isMobile = useIsMobile();
  
  // Always call the hook to avoid conditional hook errors
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setCarouselIndex(1),
    onSwipeRight: () => setCarouselIndex(0),
    threshold: 50
  });
  
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

  // Fetch milestone unlock dates
  const { data: milestoneUnlockDates = {} } = useMilestoneUnlockDates(targetUserId);

  // Query to get all played courses (ratings-only)
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['allPlayedCourses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      // Ratings-only: get all rated courses
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

      // Map to expected structure
      const courses = (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at,
        id: `rating-${course.course_id}`
      }));

      console.log('Rated courses:', courses.map(c => ({ 
        name: c.golf_courses?.name, 
        rating: c.rating 
      })));
      
      return getSortedUserCourses(courses, 'rank-desc');
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

  // Calculate total completed Top 100 courses (with global or regional rankings)
  const top100CompletedCount = useMemo(() => {
    return allPlayedCourses.filter((userCourse) => {
      const course = userCourse.golf_courses;
      if (!course) return false;
      
      // Count courses that have either global rank ≤ 100 or regional rank ≤ 100
      return (course.global_rank && course.global_rank <= 100) || 
             (course.regional_rank && course.regional_rank <= 100);
    }).length;
  }, [allPlayedCourses]);

  return (
    <div className="relative">
      <UserCoursesHeader
        displayName={finalDisplayName} 
        isOwnProfile={finalIsOwnProfile} 
      />


      {isLoadingTop100 || !isHydrated ? (
        <div className="text-center py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted-foreground">
              {!isHydrated ? 'Loading preferences...' : 'Loading courses...'}
            </span>
          </div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <>
          {/* CoursesControls component now handles all filtering and sorting */}
          <div className="flex flex-col">
            <CoursesControls
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewType={viewType}
              onViewTypeChange={setViewType}
            />
          </div>
          
          {viewType === 'cards' ? (
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
                   hideRankingBadges={sortBy === 'recent' || sortBy === 'recently-played'}
                 />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredCourses.map((userCourse) => (
                <CourseListItem
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
          )}
        </>
      ) : activeFilter ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No courses found in the selected region.
          </p>
        </div>
      ) : (
        <EmptyTop100State isOwnProfile={finalIsOwnProfile} displayName={finalDisplayName} />
      )}

      {/* Course Picker Modal */}
      <CoursePickerModal
        isOpen={isCoursePickerOpen}
        onClose={() => setIsCoursePickerOpen(false)}
        userId={targetUserId || ''}
        region="global"
        onCoursesAdded={() => {
          // Refetch data when courses are added
          window.location.reload();
        }}
      />
    </div>
  );
};

export default UserCoursesContent;

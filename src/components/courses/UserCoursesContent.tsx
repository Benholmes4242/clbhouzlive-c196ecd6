
import React, { useState, useMemo } from 'react';
import { useUserCoursesData } from './user/useUserCoursesData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import UserCoursesHeader from './user/UserCoursesHeader';
import UserCoursesRegionalTiles from './user/UserCoursesRegionalTiles';
import CourseCard from './CourseCard';
import { EmptyTop100State } from './user/UserCoursesEmptyStates';

interface UserCoursesContentProps {
  username?: string;
}

const UserCoursesContent: React.FC<UserCoursesContentProps> = ({ username }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const {
    targetUserId,
    displayName,
    isOwnProfile,
    top100CoursesRaw,
    isLoadingTop100
  } = useUserCoursesData(username);

  const { regionProgress, isLoading: isLoadingProgress } = useTop100CoursesData(
    targetUserId || '',
    isOwnProfile
  );

  // Filter courses based on active filter
  const filteredCourses = useMemo(() => {
    if (!activeFilter || !top100CoursesRaw.length) {
      return top100CoursesRaw;
    }

    return top100CoursesRaw.filter((userCourse) => {
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
  }, [top100CoursesRaw, activeFilter]);

  return (
    <div className="space-y-8">
      <UserCoursesHeader 
        displayName={displayName} 
        isOwnProfile={isOwnProfile} 
      />

      <UserCoursesRegionalTiles
        regionProgress={regionProgress}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        isLoading={isLoadingProgress}
      />

      <div className="space-y-4">
        {isLoadingTop100 ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((userCourse) => (
              <CourseCard 
                key={userCourse.id} 
                course={userCourse.golf_courses}
                viewingUserId={targetUserId}
                showPlayedButton={isOwnProfile}
                viewContext="global"
                userRating={userCourse.rating}
                isReadOnly={!isOwnProfile}
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
          <EmptyTop100State isOwnProfile={isOwnProfile} displayName={displayName} />
        )}
      </div>
    </div>
  );
};

export default UserCoursesContent;

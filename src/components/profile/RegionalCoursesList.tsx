import React from 'react';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import CourseCard from '@/components/courses/CourseCard';

interface RegionalCoursesListProps {
  userId: string;
  region: 'britain-ireland' | 'usa' | 'europe' | 'global';
  title: string;
  isOwnProfile: boolean;
}

const RegionalCoursesList: React.FC<RegionalCoursesListProps> = ({
  userId,
  region,
  title,
  isOwnProfile
}) => {
  const { 
    courses, 
    playedCourses, 
    getUserRating, 
    isLoading
  } = useTop100CoursesList(region, userId, isOwnProfile);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
              <div className="h-32 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter to only show played courses
  const playedCoursesData = courses.filter(course => 
    playedCourses.has(course.id)
  );

  if (playedCoursesData.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="text-center py-8 text-muted-foreground">
          No {title.toLowerCase()} courses played yet
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      
      {/* Carousel for mobile and desktop */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
             style={{
               scrollbarWidth: 'none',
               msOverflowStyle: 'none',
               WebkitOverflowScrolling: 'touch',
               scrollSnapType: 'x mandatory'
             }}>
          {playedCoursesData.map((course, index) => {
            const isLast = index === playedCoursesData.length - 1;
            return (
              <div 
                key={course.id}
                className={`flex-shrink-0 w-36 md:w-80 ${isLast ? 'pr-4' : ''}`}
                style={{ scrollSnapAlign: 'start' }}
              >
                <CourseCard 
                  course={course}
                  viewingUserId={userId}
                  viewContext="global"
                  userRating={getUserRating(course.id)}
                  isReadOnly={!isOwnProfile}
                  showUserRating={true}
                  isFromUserCoursesPage={true}
                  xp={120}
                  showXP={true}
                />
              </div>
            );
          })}
          
          {/* Peek indicator for more content */}
          {playedCoursesData.length > 1 && (
            <div className="flex-shrink-0 w-8 flex items-center justify-center opacity-50">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionalCoursesList;
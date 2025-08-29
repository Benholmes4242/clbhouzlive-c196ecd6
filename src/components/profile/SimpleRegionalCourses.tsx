import React, { useState } from 'react';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import CourseCard from '@/components/courses/CourseCard';
import RegionalCoursesModal from './RegionalCoursesModal';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';

interface SimpleRegionalCoursesProps {
  userId: string;
  region: 'britain-ireland' | 'usa' | 'europe' | 'global';
  title: string;
  isOwnProfile: boolean;
}

const SimpleRegionalCourses: React.FC<SimpleRegionalCoursesProps> = ({
  userId,
  region,
  title,
  isOwnProfile
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    courses, 
    playedCourses, 
    getUserRating, 
    isLoading
  } = useTop100CoursesList(region === 'global' ? 'global' : region, userId, isOwnProfile);

  // Filter to only show played courses
  const playedCoursesData = courses.filter(course => 
    playedCourses.has(course.id)
  );

  const { carouselRef, isMobile } = useCarouselNavigation(playedCoursesData.length);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <div className="bg-card rounded-lg border p-4 animate-pulse h-64">
                <div className="h-32 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (playedCoursesData.length === 0) {
    return null; // Don't render empty regional sections
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xl font-semibold text-foreground hover:text-foreground/80 transition-colors"
          >
            See All
          </button>
        </div>
        
        {/* Carousel with scaled up cards */}
        <div className="relative">
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory'
            }}
          >
            {playedCoursesData.map((course, index) => {
              const isLast = index === playedCoursesData.length - 1;
              return (
                <div 
                  key={course.id}
                  className={`flex-shrink-0 ${isMobile ? 'w-72' : 'w-80'} ${isLast ? 'pr-4' : ''}`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Scaled up card to match Rated by U Height */}
                  <div className="h-64"> 
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
                      customHeight="h-full"
                    />
                  </div>
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

      <RegionalCoursesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        region={region}
        title={title}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
};

export default SimpleRegionalCourses;
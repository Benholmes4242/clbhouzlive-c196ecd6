
import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import Top100CourseCard from './Top100CourseCard';

interface Top100CoursesContentProps {
  courses: any[];
  playedCourses: Set<string>;
  searchTerm: string;
  region: string;
  isOwnProfile: boolean;
  isLoading: boolean;
  toggleCourse: (courseId: string) => void;
  getUserRating: (courseId: string) => number | null;
  viewType?: 'cards' | 'list';
  sortType?: 'rank-asc' | 'rank-desc' | 'recent';
}

const Top100CoursesContent: React.FC<Top100CoursesContentProps> = ({
  courses,
  playedCourses,
  searchTerm,
  region,
  isOwnProfile,
  isLoading,
  toggleCourse,
  getUserRating,
  viewType = 'cards',
  sortType = 'rank-asc'
}) => {
  const isMobile = useIsMobile();
  // Filter and sort courses based on search term and sort preference
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses;
    
    // First filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = courses.filter(course => 
        course.name.toLowerCase().includes(term) ||
        course.country.toLowerCase().includes(term) ||
        course.region?.toLowerCase().includes(term)
      );
    }
    
    // Then sort based on sortType
    const sorted = [...filtered].sort((a, b) => {
      if (sortType === 'rank-asc') {
        const rankA = region === 'global' ? a.global_rank : a.regional_rank;
        const rankB = region === 'global' ? b.global_rank : b.regional_rank;
        return (rankA || 999) - (rankB || 999);
      } else if (sortType === 'rank-desc') {
        const rankA = region === 'global' ? a.global_rank : a.regional_rank;
        const rankB = region === 'global' ? b.global_rank : b.regional_rank;
        return (rankB || 0) - (rankA || 0);
      } else if (sortType === 'recent') {
        // For recent, we'd need played_date from the user_top100_courses table
        // For now, just sort by rank ascending as fallback
        const rankA = region === 'global' ? a.global_rank : a.regional_rank;
        const rankB = region === 'global' ? b.global_rank : b.regional_rank;
        return (rankA || 999) - (rankB || 999);
      }
      return 0;
    });
    
    return sorted;
  }, [courses, searchTerm, sortType, region]);

  // Debug logging for viewType
  console.log('🔍 Top100CoursesContent DEBUG:', {
    viewType,
    sortType,
    coursesCount: filteredAndSortedCourses.length,
    isListView: viewType === 'list'
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">Loading courses...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      {/* Dynamic layout based on view type and device */}
      {viewType === 'list' ? (
        <div className="space-y-3">
          {filteredAndSortedCourses.map((course) => {
            const isPlayed = playedCourses.has(course.id);
            const userRating = getUserRating(course.id);
            
            return (
              <Top100CourseCard
                key={course.id}
                course={course}
                isPlayed={isPlayed}
                region={region}
                isOwnProfile={isOwnProfile}
                onToggle={isOwnProfile ? () => toggleCourse(course.id) : undefined}
                userRating={userRating}
                viewType={viewType}
              />
            );
          })}
        </div>
      ) : (
        // Cards view with carousel-style peek effect
        <div className={
          isMobile 
            ? "overflow-x-auto scrollbar-hide -mx-4 px-4" 
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        }>
          <div className={
            isMobile 
              ? "flex gap-4 pb-2" 
              : "contents"
          }>
            {filteredAndSortedCourses.map((course, index) => {
              const isPlayed = playedCourses.has(course.id);
              const userRating = getUserRating(course.id);
              
              // Debug logging
              if (course.name === "Trump Turnberry Resort - Ailsa") {
                console.log('Top100CourseCard debug:', {
                  courseName: course.name,
                  courseId: course.id,
                  userRating,
                  isPlayed,
                  showUserRating: !!userRating
                });
              }
              
              return (
                <div
                  key={course.id}
                  className={
                    isMobile 
                      ? "flex-shrink-0 w-[280px]" 
                      : ""
                  }
                  style={
                    isMobile && index === filteredAndSortedCourses.length - 1 
                      ? { marginRight: '16px' } 
                      : {}
                  }
                >
                  <Top100CourseCard
                    course={course}
                    isPlayed={isPlayed}
                    region={region}
                    isOwnProfile={isOwnProfile}
                    onToggle={isOwnProfile ? () => toggleCourse(course.id) : undefined}
                    userRating={userRating}
                    viewType={viewType}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {filteredAndSortedCourses.length === 0 && courses.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No courses found matching "{searchTerm}".
        </div>
      )}
      
      {courses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No courses found for this region.
        </div>
      )}
    </ScrollArea>
  );
};

export default Top100CoursesContent;

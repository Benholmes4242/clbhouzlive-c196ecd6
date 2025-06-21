
import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Top100CourseCard from './Top100CourseCard';
import Top100CourseListItem from './Top100CourseListItem';

interface Top100CoursesContentProps {
  courses: any[];
  playedCourses: Set<string>;
  searchTerm: string;
  region: string;
  isOwnProfile: boolean;
  isLoading: boolean;
  toggleCourse: (courseId: string) => void;
}

const Top100CoursesContent: React.FC<Top100CoursesContentProps> = ({
  courses,
  playedCourses,
  searchTerm,
  region,
  isOwnProfile,
  isLoading,
  toggleCourse
}) => {
  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    
    const term = searchTerm.toLowerCase();
    return courses.filter(course => 
      course.name.toLowerCase().includes(term) ||
      course.country.toLowerCase().includes(term) ||
      course.region?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const renderListView = () => (
    <div className="space-y-3">
      {filteredCourses.map((course) => {
        const isPlayed = playedCourses.has(course.id);
        
        return (
          <Top100CourseListItem
            key={course.id}
            course={course}
            isPlayed={isPlayed}
            isOwnProfile={isOwnProfile}
            onToggle={toggleCourse}
            region={region}
          />
        );
      })}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredCourses.map((course) => {
        const isPlayed = playedCourses.has(course.id);
        
        return (
          <Top100CourseCard
            key={course.id}
            course={course}
            isPlayed={isPlayed}
            region={region}
          />
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">Loading courses...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      {/* Render different views based on profile ownership */}
      {isOwnProfile ? renderListView() : renderGridView()}
      
      {filteredCourses.length === 0 && courses.length > 0 && (
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

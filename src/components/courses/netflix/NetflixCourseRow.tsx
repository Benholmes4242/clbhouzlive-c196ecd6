import React from 'react';
import NetflixCourseCard from './NetflixCourseCard';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NetflixCourseRowProps {
  title: string;
  courses: any[];
  onCourseClick?: (course: any) => void;
  getUserRating?: (courseId: string) => number | null;
  size?: 'large' | 'medium';
}

const NetflixCourseRow: React.FC<NetflixCourseRowProps> = ({
  title,
  courses,
  onCourseClick,
  getUserRating,
  size = 'medium'
}) => {
  const { carouselRef, canScrollLeft, canScrollRight, scroll, isMobile } = useCarouselNavigation(courses.length);

  if (courses.length === 0) return null;

  return (
    <div className="relative group/row mb-8">
      {/* Row title */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 px-4 md:px-0">
        {title}
      </h2>
      
      {/* Carousel container */}
      <div className="relative">
        {/* Left scroll button */}
        {!isMobile && canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        {/* Right scroll button */}
        {!isMobile && canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
        
        {/* Scrollable course cards */}
        <div
          ref={carouselRef}
          className={`flex overflow-x-auto scrollbar-hide px-4 md:px-0 ${
            size === 'large' 
              ? 'gap-3 sm:gap-4 md:gap-5 lg:gap-6' 
              : 'gap-3 sm:gap-4 md:gap-5 lg:gap-6'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {courses.map((course, index) => {
            // Responsive width classes based on size and breakpoints
            const widthClasses = size === 'large' 
              ? 'flex-shrink-0 w-[82vw] sm:w-[45%] md:w-[32%] lg:w-[31%]'  // Large cards
              : 'flex-shrink-0 w-[77vw] sm:w-[41%] md:w-[29%] lg:w-[28%]';   // Medium cards
            
            return (
              <NetflixCourseCard
                key={`${course.course_id || course.id}-${index}`}
                course={course.golf_courses || course}
                userRating={getUserRating ? getUserRating(course.course_id || course.id) : course.rating}
                className={widthClasses}
                onClick={() => onCourseClick?.(course.golf_courses || course)}
                size={size}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NetflixCourseRow;
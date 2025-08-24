import React from 'react';
import NetflixCourseCard from './NetflixCourseCard';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RegionClickHandler {
  (region: string): void;
}

interface NetflixCourseRowProps {
  title: string;
  courses: any[];
  onCourseClick?: (course: any) => void;
  getUserRating?: (courseId: string) => number | null;
  size?: 'large' | 'medium';
  hasHeroBanner?: boolean;
  onRegionClick?: RegionClickHandler;
}

const NetflixCourseRow: React.FC<NetflixCourseRowProps> = ({
  title,
  courses,
  onCourseClick,
  getUserRating,
  size = 'medium',
  hasHeroBanner = false,
  onRegionClick
}) => {
  const { carouselRef, canScrollLeft, canScrollRight, scroll, isMobile } = useCarouselNavigation(courses.length);

  if (courses.length === 0) return null;

  const isFirstRow = title === "Recently Played";

  return (
    <div className={`relative group/row ${isFirstRow ? 'mb-4 md:mb-6' : 'mb-4 md:mb-6 lg:mb-8'}`}>
      {/* Row title */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 px-4 md:px-0">
        {title}
      </h2>
      
      {/* Carousel container */}
      <div className="relative">
        {/* Left scroll button */}
        {!isMobile && canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 opacity-0 group-hover/row:opacity-100 transition-all duration-300 ${
              isFirstRow ? 'hover:scale-110' : 'hover:scale-105'
            }`}
            style={{
              background: isFirstRow ? 'rgba(247, 147, 30, 0.8)' : 'rgba(0, 0, 0, 0.5)'
            }}
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
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 opacity-0 group-hover/row:opacity-100 transition-all duration-300 ${
              isFirstRow ? 'hover:scale-110' : 'hover:scale-105'
            }`}
            style={{
              background: isFirstRow ? 'rgba(247, 147, 30, 0.8)' : 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
        
        {/* Scrollable course cards */}
        <div
          ref={carouselRef}
          className={`flex overflow-x-auto scrollbar-hide px-4 md:px-0 snap-x snap-mandatory ${
            size === 'large' 
              ? 'gap-3 sm:gap-4 md:gap-5 lg:gap-6' 
              : 'gap-3 sm:gap-4 md:gap-5 lg:gap-6'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Hero Banner (if this row has one) */}
          {hasHeroBanner && courses.length > 0 && (
            <div className="mb-6">
              <NetflixCourseCard
                course={courses[0].golf_courses || courses[0]}
                userRating={getUserRating ? getUserRating(courses[0].course_id || courses[0].id) : courses[0].rating}
                className="w-full"
                onClick={() => onCourseClick?.(courses[0].golf_courses || courses[0])}
                isHeroBanner={true}
              />
            </div>
          )}
          
          {/* Regular course cards */}
          {courses.slice(hasHeroBanner ? 1 : 0).map((course, index) => {
            // Responsive width classes based on size and breakpoints
            // For top rated section with hero banner, show peek of next card
            const isTopRatedWithHero = hasHeroBanner && title.includes("Top 10 Rated");
            const widthClasses = size === 'large' 
              ? isTopRatedWithHero 
                ? 'flex-shrink-0 w-[85vw] sm:w-[47%] md:w-[34%] lg:w-[33%] snap-start'  // Slightly wider to show peek
                : 'flex-shrink-0 w-[82vw] sm:w-[45%] md:w-[32%] lg:w-[31%] snap-start'  // Large cards
              : 'flex-shrink-0 w-[77vw] sm:w-[41%] md:w-[29%] lg:w-[28%] snap-start';   // Medium cards
            
            const cardTransition = isFirstRow 
              ? 'transition-all duration-200 ease-out' 
              : 'transition-all duration-300 ease-in-out';
            
            return (
              <NetflixCourseCard
                key={`${course.course_id || course.id}-${index}`}
                course={course.golf_courses || course}
                userRating={getUserRating ? getUserRating(course.course_id || course.id) : course.rating}
                className={`${widthClasses} ${cardTransition}`}
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
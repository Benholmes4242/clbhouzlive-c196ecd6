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
      {/* Row title with responsive typography */}
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl font-bold text-foreground mb-3 px-4 md:px-0">
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
          className="flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4 [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5] [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]"
          style={{
            // momentum + no snap (defends against any global/parent styles)
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            scrollSnapType: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            // prevents width shift when a scrollbar appears
            scrollbarGutter: 'stable both-edges'
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
            const cardTransition = isFirstRow 
              ? 'transition-all duration-200 ease-out' 
              : 'transition-all duration-300 ease-in-out';
            
            return (
              <NetflixCourseCard
                key={`${course.course_id || course.id}-${index}`}
                course={course.golf_courses || course}
                userRating={getUserRating ? getUserRating(course.course_id || course.id) : course.rating}
                className={`shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] ${cardTransition}`}
                onClick={() => onCourseClick?.(course.golf_courses || course)}
                size={size}
                isTopRated={title.includes("Top 10 Rated")}
                isHighlightReel={title.includes("Highlight")}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NetflixCourseRow;
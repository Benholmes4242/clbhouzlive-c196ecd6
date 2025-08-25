import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Top100CourseCard from '@/components/profile/Top100CourseCard';
import { Button } from '@/components/ui/button';

interface TopRatedCarouselProps {
  courses: any[];
  isOwnProfile: boolean;
  displayName?: string;
  onToggle?: (courseId: string) => void;
  getUserRating: (courseId: string) => number | null;
}

const TopRatedCarousel: React.FC<TopRatedCarouselProps> = ({
  courses,
  isOwnProfile,
  displayName,
  onToggle,
  getUserRating
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollPosition);
      return () => scrollElement.removeEventListener('scroll', checkScrollPosition);
    }
  }, [courses]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth * 0.9; // Scroll by card width
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - cardWidth 
        : currentScroll + cardWidth;
      
      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  if (courses.length === 0) return null;

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground">
          Top 10 Rated by {isOwnProfile ? 'You' : displayName}
        </h3>
        
        {/* Navigation arrows for desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative -mx-4 md:mx-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-4 md:px-0"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {courses.map((course, index) => (
            <div
              key={course.id || `${course.course_id}-${index}`}
              className="flex-none md:w-full"
              style={{
                width: 'calc(100vw - 4rem)', // Full width minus padding and gap for peek on mobile
                minWidth: 'calc(100vw - 4rem)',
                scrollSnapAlign: 'start'
              }}
            >
              <div className="h-32 relative rounded-lg overflow-hidden">
                <Top100CourseCard
                  course={course.golf_courses || course}
                  isPlayed={true}
                  region="global"
                  isOwnProfile={isOwnProfile}
                  onToggle={onToggle ? () => onToggle(course.course_id || course.id) : undefined}
                  userRating={getUserRating(course.course_id || course.id)}
                  viewType="list"
                  userFirstName={displayName?.split(' ')[0]}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll indicators */}
        <div className="flex justify-center mt-3 md:hidden">
          <div className="flex gap-1">
            {courses.map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-muted transition-colors"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopRatedCarousel;
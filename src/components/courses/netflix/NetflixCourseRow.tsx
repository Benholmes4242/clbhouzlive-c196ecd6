import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetflixCourseCard from './NetflixCourseCard';

interface NetflixCourseRowProps {
  title: string;
  courses: any[];
  targetUserId?: string;
  isOwnProfile: boolean;
}

const NetflixCourseRow: React.FC<NetflixCourseRowProps> = ({
  title,
  courses,
  targetUserId,
  isOwnProfile
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    
    const containerWidth = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollBy({
      left: -containerWidth * 0.8,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    
    const containerWidth = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollBy({
      left: containerWidth * 0.8,
      behavior: 'smooth'
    });
  };

  if (!courses.length) return null;

  return (
    <div className="relative group">
      {/* Row Title */}
      <h2 className="text-xl font-bold text-foreground mb-4 px-4 md:px-8">
        {title}
      </h2>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={scrollRight}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Course Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8"
          onScroll={handleScroll}
        >
          {courses.map((course) => (
            <NetflixCourseCard
              key={course.id}
              course={course.golf_courses}
              userRating={course.rating}
              playedDate={course.played_date || course.created_at}
              targetUserId={targetUserId}
              isOwnProfile={isOwnProfile}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetflixCourseRow;
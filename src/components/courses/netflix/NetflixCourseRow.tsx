import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NetflixCourseCard from './NetflixCourseCard';

interface NetflixCourseRowProps {
  title: string;
  courses: any[];
  targetUserId?: string;
  isOwnProfile: boolean;
  showRecentlyPlayedSizing?: boolean;
}

const NetflixCourseRow: React.FC<NetflixCourseRowProps> = ({
  title,
  courses,
  targetUserId,
  isOwnProfile,
  showRecentlyPlayedSizing = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  if (courses.length === 0) return null;

  return (
    <div className="relative group">
      <h2 className="text-xl font-bold text-white mb-4 px-4">{title}</h2>
      
      {/* Left scroll button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right scroll button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Scrollable course cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none px-4 pb-2"
        style={{ 
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory'
        }}
      >
        {courses.map((userCourse, index) => (
          <div 
            key={userCourse.id}
            className={`flex-none ${
              showRecentlyPlayedSizing 
                ? 'w-[87%] sm:w-[55%] md:w-[45%] lg:w-[32%]' // Recently played sizing
                : 'w-72' // Standard sizing for other rows
            }`}
            style={{ scrollSnapAlign: 'start' }}
          >
            <NetflixCourseCard
              course={userCourse.golf_courses}
              userRating={userCourse.rating}
              targetUserId={targetUserId}
              isOwnProfile={isOwnProfile}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetflixCourseRow;
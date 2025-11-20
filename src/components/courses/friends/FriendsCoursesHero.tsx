import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsCoursesHeroProps {
  courses: CourseWithFriends[];
  timeRange: 'week' | '30' | '90' | 'year' | 'all';
}

export const FriendsCoursesHero: React.FC<FriendsCoursesHeroProps> = ({ courses, timeRange }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotate through ALL courses every 4 seconds
  useEffect(() => {
    if (courses.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % courses.length);
    }, 4000); // 4s per course
    
    return () => clearInterval(interval);
  }, [courses.length]);

  // Reset index when courses array changes to prevent out of bounds
  useEffect(() => {
    if (currentIndex >= courses.length) {
      setCurrentIndex(0);
    }
  }, [courses.length, currentIndex]);

  if (courses.length === 0) return null;

  // Rotate through ALL courses in regularCourses - no limit
  const currentCourse = courses[currentIndex];

  // Calculate stats from ALL courses
  const coursesCount = courses.length;
  const regionsSet = new Set(courses.map(c => `${c.country}-${c.sub_country || 'none'}`));
  const regionsCount = regionsSet.size;
  const ratingsWithValues = courses.filter(c => c.average_rating != null).map(c => c.average_rating!);
  const avgRating = ratingsWithValues.length > 0 
    ? (ratingsWithValues.reduce((sum, r) => sum + r, 0) / ratingsWithValues.length).toFixed(1)
    : null;

  const getTimeLabel = () => {
    switch (timeRange) {
      case 'week': return 'This week';
      case '30': return 'This month';
      case '90': return 'Lately';
      case 'year': return 'This year';
      case 'all': return 'Recently';
      default: return 'Recently';
    }
  };

  return (
    <div className="space-y-2">
      {/* Full-width hero card - matches Explore/Top100 style */}
      <div
        className="relative overflow-hidden transition-all duration-300 cursor-pointer h-48 rounded-2xl"
        style={{
          backgroundImage: `url(${currentCourse.thumbnail_url || '/placeholder.svg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        onClick={() => navigate(`/courses/${currentCourse.course_id}`)}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Course ranking badges - top right */}
        <div className="absolute top-3 right-3 z-20">
          <CourseRankBadges
            globalRank={currentCourse.global_rank}
            regionalRank={currentCourse.regional_rank}
            usaRank={currentCourse.usa_rank}
            country={currentCourse.country || ''}
            positioning="inline"
          />
        </div>

        {/* Course info overlay - bottom left */}
        <div className="absolute bottom-3 left-3 right-3 text-white z-20">
          <h3 className="font-semibold text-xl leading-tight mb-1 drop-shadow-lg">
            {currentCourse.course_name}
          </h3>
          <p className="text-sm text-white/90 drop-shadow-lg">
            {currentCourse.country}{currentCourse.sub_country ? `, ${currentCourse.sub_country}` : ''}
          </p>
        </div>

        {/* Smooth fade transition between courses */}
        <div 
          key={currentCourse.course_id} 
          className="absolute inset-0 animate-fade-in pointer-events-none"
        />
      </div>

      {/* Stats summary below image */}
      <div className="px-1">
        <p className="text-sm font-semibold text-foreground">
          {getTimeLabel()} your friends played…
        </p>
        <p className="text-xs text-muted-foreground">
          {coursesCount} {coursesCount === 1 ? 'course' : 'courses'} · {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
          {avgRating && ` · Avg rating ${avgRating}`}
        </p>
      </div>
    </div>
  );
};

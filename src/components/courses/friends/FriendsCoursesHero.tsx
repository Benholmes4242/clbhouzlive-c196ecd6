import React, { useState, useEffect } from 'react';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsCoursesHeroProps {
  courses: CourseWithFriends[];
  timeRange: '30' | '90' | 'all';
}

export const FriendsCoursesHero: React.FC<FriendsCoursesHeroProps> = ({ courses, timeRange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotate images every 3 seconds
  useEffect(() => {
    if (courses.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(courses.length, 5));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [courses.length]);

  if (courses.length < 2) return null;

  const displayCourses = courses.slice(0, 5);
  const mainCourse = displayCourses[currentIndex];
  const sideCourses = displayCourses.filter((_, i) => i !== currentIndex).slice(0, 2);

  // Calculate stats
  const coursesCount = courses.length;
  const regionsSet = new Set(courses.map(c => `${c.country}-${c.sub_country || 'none'}`));
  const regionsCount = regionsSet.size;
  const ratingsWithValues = courses.filter(c => c.average_rating != null).map(c => c.average_rating!);
  const avgRating = ratingsWithValues.length > 0 
    ? (ratingsWithValues.reduce((sum, r) => sum + r, 0) / ratingsWithValues.length).toFixed(1)
    : null;

  const timeLabel = timeRange === '30' ? 'this month' : timeRange === '90' ? 'lately' : 'recently';

  return (
    <div className="rounded-2xl bg-card shadow-sm border overflow-hidden">
      {/* Image Collage */}
      <div className="flex gap-2 p-3">
        {/* Main hero image (left) */}
        <div className="flex-1 h-[120px] rounded-xl overflow-hidden relative">
          <img
            key={mainCourse.course_id}
            src={mainCourse.thumbnail_url || '/placeholder.svg'}
            alt={mainCourse.course_name}
            className="w-full h-full object-cover animate-fadeIn"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white text-xs font-semibold drop-shadow-lg line-clamp-1">
              {mainCourse.course_name}
            </p>
            <p className="text-white/80 text-[10px] drop-shadow-lg">
              {mainCourse.country}
            </p>
          </div>
        </div>

        {/* Side thumbnails (right, stacked) */}
        {sideCourses.length > 0 && (
          <div className="flex flex-col gap-2 w-[100px]">
            {sideCourses.map((course) => (
              <div key={course.course_id} className="h-[56px] rounded-lg overflow-hidden relative">
                <img
                  src={course.thumbnail_url || '/placeholder.svg'}
                  alt={course.course_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="px-4 pb-4">
        <p className="text-sm font-semibold text-foreground mb-0.5">
          {timeLabel.charAt(0).toUpperCase() + timeLabel.slice(1)} your friends played…
        </p>
        <p className="text-xs text-muted-foreground">
          {coursesCount} {coursesCount === 1 ? 'course' : 'courses'} · {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
          {avgRating && ` · Avg rating ${avgRating}`}
        </p>
      </div>
    </div>
  );
};

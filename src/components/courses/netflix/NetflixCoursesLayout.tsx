import React, { useMemo } from 'react';
import NetflixCourseRow from './NetflixCourseRow';

interface NetflixCoursesLayoutProps {
  allCourses: any[];
  isOwnProfile: boolean;
  displayName?: string;
  onCourseClick?: (course: any) => void;
}

const NetflixCoursesLayout: React.FC<NetflixCoursesLayoutProps> = ({
  allCourses,
  isOwnProfile,
  displayName,
  onCourseClick
}) => {
  // Helper function to get user rating for a course
  const getUserRating = (courseId: string) => {
    const userCourse = allCourses.find(uc => 
      (uc.course_id || uc.golf_courses?.id) === courseId
    );
    return userCourse?.rating || null;
  };

  // Organize courses into different rows
  const courseRows = useMemo(() => {
    const rows: { title: string; courses: any[]; }[] = [];

    // Recently Played (last 10 courses by date)
    const recentCourses = [...allCourses]
      .sort((a, b) => {
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 10);

    if (recentCourses.length > 0) {
      rows.push({
        title: "Recently Played",
        courses: recentCourses
      });
    }

    // Highest Rated (courses with ratings 8+)
    const highRatedCourses = allCourses
      .filter(course => course.rating && course.rating >= 8)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    if (highRatedCourses.length > 0) {
      rows.push({
        title: isOwnProfile ? "My Highest Rated" : `${displayName}'s Highest Rated`,
        courses: highRatedCourses
      });
    }

    // Top 100 Courses (global or regional rank <= 100)
    const top100Courses = allCourses
      .filter(course => {
        const golfCourse = course.golf_courses || course;
        return (golfCourse.global_rank && golfCourse.global_rank <= 100) ||
               (golfCourse.regional_rank && golfCourse.regional_rank <= 100);
      })
      .sort((a, b) => {
        const getCourseRank = (course: any) => {
          const golfCourse = course.golf_courses || course;
          return golfCourse.global_rank || golfCourse.regional_rank || 999;
        };
        return getCourseRank(a) - getCourseRank(b);
      });

    if (top100Courses.length > 0) {
      rows.push({
        title: isOwnProfile ? "My Top 100 Courses" : `${displayName}'s Top 100 Courses`,
        courses: top100Courses
      });
    }

    // All Courses (if we have more than what's shown in other rows)
    const remainingCourses = allCourses
      .filter(course => {
        // Don't show courses already in other rows
        const isInRecent = recentCourses.some(rc => 
          (rc.course_id || rc.golf_courses?.id) === (course.course_id || course.golf_courses?.id)
        );
        const isInHighRated = highRatedCourses.some(hrc => 
          (hrc.course_id || hrc.golf_courses?.id) === (course.course_id || course.golf_courses?.id)
        );
        const isInTop100 = top100Courses.some(tc => 
          (tc.course_id || tc.golf_courses?.id) === (course.course_id || course.golf_courses?.id)
        );
        
        return !isInRecent && !isInHighRated && !isInTop100;
      })
      .slice(0, 15);

    if (remainingCourses.length > 0) {
      rows.push({
        title: isOwnProfile ? "All My Courses" : `All ${displayName}'s Courses`,
        courses: remainingCourses
      });
    }

    return rows;
  }, [allCourses, isOwnProfile, displayName]);

  return (
    <div className="space-y-6">
      {courseRows.map((row, index) => (
        <NetflixCourseRow
          key={`${row.title}-${index}`}
          title={row.title}
          courses={row.courses}
          onCourseClick={onCourseClick}
          getUserRating={getUserRating}
        />
      ))}
    </div>
  );
};

export default NetflixCoursesLayout;
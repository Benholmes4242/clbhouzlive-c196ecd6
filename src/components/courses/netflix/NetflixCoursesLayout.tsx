import React, { useMemo, useCallback } from 'react';
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

  // Handle region navigation with smooth scrolling
  const handleRegionClick = useCallback((region: string) => {
    const regionElement = document.getElementById(`region-${region.toLowerCase().replace(/\s+/g, '-').replace('&', 'and')}`);
    if (regionElement) {
      regionElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }, []);

  // Organize courses into different rows
  const courseRows = useMemo(() => {
    const rows: { title: string; courses: any[]; size: 'large' | 'medium'; hasHeroBanner?: boolean; isRegionalSection?: boolean; regionData?: Record<string, any[]>; regionOrder?: string[]; }[] = [];

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
        courses: recentCourses,
        size: 'large' as const
      });
    }

    // Highest Rated (courses with ratings 8+) - Row 2 with Hero Banner
    const highRatedCourses = allCourses
      .filter(course => course.rating && course.rating >= 8)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    if (highRatedCourses.length > 0) {
      rows.push({
        title: isOwnProfile ? "Top 10 Rated by You" : `Top 10 Rated by ${displayName}`,
        courses: highRatedCourses,
        size: 'medium' as const,
        hasHeroBanner: true
      });
    }

    // Courses by Region (Row 3) - Group courses by region
    const coursesByRegion = allCourses.reduce((acc, course) => {
      const golfCourse = course.golf_courses || course;
      let region = 'Worldwide'; // Default
      
      if (golfCourse.country) {
        // Group by regions
        if (['United Kingdom', 'Ireland', 'Scotland', 'England', 'Wales', 'Northern Ireland'].includes(golfCourse.country)) {
          region = 'Great Britain & Ireland';
        } else if (['Germany', 'France', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Sweden', 'Denmark', 'Norway', 'Belgium', 'Austria', 'Switzerland'].includes(golfCourse.country)) {
          region = 'Europe';
        } else if (['United States', 'USA'].includes(golfCourse.country)) {
          region = 'USA';
        }
      }
      
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(course);
      return acc;
    }, {} as Record<string, any[]>);

    // Add regional rows if we have courses
    const regionOrder = ['Great Britain & Ireland', 'Europe', 'USA', 'Worldwide'];
    const hasRegionalCourses = Object.keys(coursesByRegion).some(region => coursesByRegion[region].length > 0);
    
    if (hasRegionalCourses) {
      rows.push({
        title: "Courses by Region",
        courses: [], // This will be handled specially
        size: 'medium' as const,
        isRegionalSection: true,
        regionData: coursesByRegion,
        regionOrder
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
        courses: top100Courses,
        size: 'medium' as const
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
        courses: remainingCourses,
        size: 'medium' as const
      });
    }

    return rows;
  }, [allCourses, isOwnProfile, displayName]);

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {courseRows.map((row, index) => {
        // Handle regional section specially
        if (row.isRegionalSection && row.regionData && row.regionOrder) {
          return (
            <div key={`${row.title}-${index}`} className="mb-4 md:mb-6 lg:mb-8">
              {/* Main section title */}
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 px-4 md:px-0">
                {row.title}
              </h2>
              
              {/* Regional mini-rows */}
              <div className="space-y-4 md:space-y-6">
                {row.regionOrder.map((region) => {
                  const regionCourses = row.regionData![region];
                  if (!regionCourses || regionCourses.length === 0) return null;
                  
                  return (
                    <div key={`region-${region}`} id={`region-${region.toLowerCase().replace(/\s+/g, '-').replace('&', 'and')}`}>
                      <NetflixCourseRow
                        title={region}
                        courses={regionCourses}
                        onCourseClick={onCourseClick}
                        getUserRating={getUserRating}
                        size="medium"
                        onRegionClick={handleRegionClick}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        
        // Regular rows
        return (
          <NetflixCourseRow
            key={`${row.title}-${index}`}
            title={row.title}
            courses={row.courses}
            onCourseClick={onCourseClick}
            getUserRating={getUserRating}
            size={row.size}
            hasHeroBanner={row.hasHeroBanner}
            onRegionClick={handleRegionClick}
          />
        );
      })}
    </div>
  );
};

export default NetflixCoursesLayout;
import React, { useState, useMemo } from 'react';
import { useUserCoursesData } from '../user/useUserCoursesData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { useMilestoneUnlockDates } from '@/hooks/useMilestoneUnlockDates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Top100Progress from '../Top100Progress';
import NetflixCourseRow from './NetflixCourseRow';

interface NetflixCoursesLayoutProps {
  username?: string;
  isOwnProfile?: boolean;
  displayName?: string;
}

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999;
};

// Custom sorting function for user courses
const getSortedUserCourses = (userCourses: any[], sortBy: string) => {
  return userCourses.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
      case 'recently-played':
        // Sort by most recent date (played_date or created_at for ratings)
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      
      case 'rating-high-low':
        // Sort by rating descending (10, 9, 8, ...)
        const aRating = a.rating;
        const bRating = b.rating;
        
        if (aRating !== null && aRating !== undefined && bRating !== null && bRating !== undefined) {
          return bRating - aRating;
        }
        if (aRating !== null && aRating !== undefined) return -1;
        if (bRating !== null && bRating !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRank = getCourseRanking(a.golf_courses);
        const bRank = getCourseRanking(b.golf_courses);
        return aRank - bRank;
        
      default:
        return 0;
    }
  });
};

const NetflixCoursesLayout: React.FC<NetflixCoursesLayoutProps> = ({ 
  username,
  isOwnProfile = false,
  displayName
}) => {
  const {
    targetUserId,
    displayName: hookDisplayName,
    isOwnProfile: hookIsOwnProfile,
    top100CoursesRaw,
    isLoadingTop100
  } = useUserCoursesData(username);

  // Use props if provided, fallback to hook values
  const finalDisplayName = displayName || hookDisplayName;
  const finalIsOwnProfile = isOwnProfile !== undefined ? isOwnProfile : hookIsOwnProfile;

  const { regionProgress, isLoading: isLoadingProgress } = useTop100CoursesData(
    targetUserId || '',
    finalIsOwnProfile
  );

  // Query to get all played courses (from both tables) for filtering
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['allPlayedCourses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      // Get courses from user_top100_courses table
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings table
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId);

      if (ratedError) throw ratedError;

      // Combine and deduplicate
      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null,
          id: `top100-${course.course_id}`
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at,
          id: `rating-${course.course_id}`
        }))
      ];

      // Remove duplicates based on course_id, preferring rated courses
      const uniqueCoursesMap = new Map();
      
      combinedCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          if (course.rating !== null && course.rating !== undefined && 
              (existing.rating === null || existing.rating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      return Array.from(uniqueCoursesMap.values());
    },
    enabled: !!targetUserId,
  });

  // Prepare different rows of courses
  const courseRows = useMemo(() => {
    if (!allPlayedCourses.length) return [];

    // Recently Played (last 30 days, sorted by most recent)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyPlayed = allPlayedCourses
      .filter(course => {
        const playDate = new Date(course.played_date || course.created_at || 0);
        return playDate >= thirtyDaysAgo;
      })
      .sort((a, b) => {
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });

    // Highest Rated (courses with ratings ≥ 8)
    const highestRated = allPlayedCourses
      .filter(course => course.rating !== null && course.rating >= 8)
      .sort((a, b) => b.rating - a.rating);

    // Top 100 Courses (global or regional ranking ≤ 100)
    const top100Courses = allPlayedCourses
      .filter(course => {
        const golfCourse = course.golf_courses;
        return golfCourse && (
          (golfCourse.global_rank && golfCourse.global_rank <= 100) ||
          (golfCourse.regional_rank && golfCourse.regional_rank <= 100)
        );
      })
      .sort((a, b) => {
        const aRank = getCourseRanking(a.golf_courses);
        const bRank = getCourseRanking(b.golf_courses);
        return aRank - bRank;
      });

    const rows = [];
    
    if (recentlyPlayed.length > 0) {
      rows.push({
        title: "Recently Played",
        courses: recentlyPlayed
      });
    }
    
    if (highestRated.length > 0) {
      rows.push({
        title: "Highest Rated",
        courses: highestRated
      });
    }
    
    if (top100Courses.length > 0) {
      rows.push({
        title: "Top 100 Courses",
        courses: top100Courses
      });
    }

    return rows;
  }, [allPlayedCourses]);

  // Calculate total completed Top 100 courses
  const top100CompletedCount = useMemo(() => {
    return allPlayedCourses.filter((userCourse) => {
      const course = userCourse.golf_courses;
      if (!course) return false;
      
      return (course.global_rank && course.global_rank <= 100) || 
             (course.regional_rank && course.regional_rank <= 100);
    }).length;
  }, [allPlayedCourses]);

  if (isLoadingTop100) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Ring Section - Keep as is but remove info below title */}
      <div className="flex justify-center">
        <Top100Progress 
          completedCount={top100CompletedCount}
          totalCount={100}
          className="mb-4"
        />
      </div>

      {/* Netflix-style Course Rows */}
      <div className="space-y-8">
        {courseRows.map((row, index) => (
          <NetflixCourseRow
            key={`${row.title}-${index}`}
            title={row.title}
            courses={row.courses}
            targetUserId={targetUserId}
            isOwnProfile={finalIsOwnProfile}
          />
        ))}
      </div>

      {/* Empty State */}
      {courseRows.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No courses played yet</h3>
          <p className="text-muted-foreground">
            {finalIsOwnProfile 
              ? "Start playing courses to see them here" 
              : `${finalDisplayName} hasn't played any courses yet`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NetflixCoursesLayout;

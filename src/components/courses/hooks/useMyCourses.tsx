import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  // Prioritize rankings in this order: regional, global
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999; // Default for courses without rankings
};

// Custom sorting function for user courses
const getSortedUserCourses = (userCourses: any[]) => {
  // Get courses with ratings
  // Canonical own-rating cascade: rating DESC → breakdown sum DESC → review_date DESC → course_id ASC
  const rated = userCourses
    .filter(c => c.rating !== null && c.rating !== undefined)
    .sort((a, b) => compareOwnRatings(
      {
        course_id: a.course_id ?? a.golf_courses?.id ?? '',
        rating: a.rating,
        design_score: a.design_score,
        condition_score: a.condition_score,
        clubhouse_score: a.clubhouse_score,
        facilities_score: a.facilities_score,
        review_date: a.review_date ?? a.created_at ?? a.played_date,
      },
      {
        course_id: b.course_id ?? b.golf_courses?.id ?? '',
        rating: b.rating,
        design_score: b.design_score,
        condition_score: b.condition_score,
        clubhouse_score: b.clubhouse_score,
        facilities_score: b.facilities_score,
        review_date: b.review_date ?? b.created_at ?? b.played_date,
      },
      'desc'
    ));
  
  // Get courses without ratings, sorted by Top 100 ranking
  const unrated = userCourses
    .filter(c => c.rating === null || c.rating === undefined)
    .sort((a, b) => {
      const aRank = getCourseRanking(a.golf_courses);
      const bRank = getCourseRanking(b.golf_courses);
      return aRank - bRank; // Lower rank number first
    });

  return [...rated, ...unrated];
};

export const useMyCourses = () => {
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch user's played courses from user_courses table with ratings
  const { data: playedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['user-played-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: courses, error: coursesError } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', user.id)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (coursesError) throw coursesError;

      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating, design_score, condition_score, clubhouse_score, facilities_score, review_date')
        .eq('user_id', user.id);

      if (ratingsError) throw ratingsError;

      const ratingsMap = new Map();
      ratings?.forEach(r => {
        ratingsMap.set(r.course_id, r);
      });

      const coursesWithRatings = courses?.map(course => {
        const r = ratingsMap.get(course.course_id);
        return {
          ...course,
          rating: r?.rating ?? null,
          design_score: r?.design_score ?? null,
          condition_score: r?.condition_score ?? null,
          clubhouse_score: r?.clubhouse_score ?? null,
          facilities_score: r?.facilities_score ?? null,
          review_date: r?.review_date ?? null,
        };
      }) || [];

      return coursesWithRatings;
    },
    enabled: !!user?.id,
  });

  // Fetch user's Top 100 courses with ratings (ratings-only: single source of truth)
  const { data: top100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get rated courses with golf_courses data
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          review_date,
          created_at,
          golf_courses (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Filter for Top 100 courses only
      const top100Courses = (ratings || []).filter(r => {
        const gc = r.golf_courses;
        return gc && (gc.regional_rank || gc.usa_rank || gc.global_rank);
      });

      const coursesWithRatings = top100Courses.map(r => ({
        course_id: r.course_id,
        played_date: r.created_at,
        golf_courses: r.golf_courses,
        rating: r.rating,
        design_score: r.design_score,
        condition_score: r.condition_score,
        clubhouse_score: r.clubhouse_score,
        facilities_score: r.facilities_score,
        review_date: r.review_date,
      }));

      return coursesWithRatings;
    },
    enabled: !!user?.id,
  });

  const { data: averageRating } = useQuery({
    queryKey: ['user-average-rating', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const total = data.reduce((sum, rating) => sum + rating.rating, 0);
      return (total / data.length).toFixed(1);
    },
    enabled: !!user?.id,
  });

  // Add source property to Top 100 courses (ratings-only)
  const top100Courses = React.useMemo(() => {
    const coursesWithSource = top100CoursesRaw.map(course => ({
      ...course,
      source: 'course_ratings' as const
    }));
    
    // Apply custom sorting to Top 100 courses
    return getSortedUserCourses(coursesWithSource);
  }, [top100CoursesRaw]);

  // Combine all played courses from both tables, removing duplicates
  // RATINGS-ONLY: course_ratings is the single source of truth
  const allPlayedCourses = React.useMemo(() => {
    const courseMap = new Map();
    
    // Add courses from user_courses table
    playedCourses.forEach(userCourse => {
      if (userCourse.golf_courses) {
        courseMap.set(userCourse.golf_courses.id, {
          ...userCourse,
          source: 'user_courses'
        });
      }
    });
    
    // Add courses from course_ratings (ratings-only, single source of truth)
    top100CoursesRaw.forEach(userCourse => {
      if (userCourse.golf_courses) {
        courseMap.set(userCourse.golf_courses.id, {
          ...userCourse,
          source: 'course_ratings'
        });
      }
    });
    
    const combinedCourses = Array.from(courseMap.values());
    
    // Apply custom sorting to all courses
    return getSortedUserCourses(combinedCourses);
  }, [playedCourses, top100CoursesRaw]);

  // Calculate statistics
  const totalCoursesPlayed = allPlayedCourses.length;
  const totalTop100Played = top100Courses.length;

  // Filter recent courses to only include those played within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = allPlayedCourses
    .filter((userCourse) => {
      if (!userCourse.played_date) return false;
      const playedDate = new Date(userCourse.played_date);
      return playedDate >= thirtyDaysAgo;
    })
    .slice(0, 12);

  const isLoading = isLoadingPlayed || isLoadingTop100;

  return {
    user,
    activeTab,
    setActiveTab,
    allPlayedCourses,
    top100Courses,
    recentCourses,
    totalCoursesPlayed,
    totalTop100Played,
    averageRating,
    isLoading,
    isLoadingTop100
  };
};

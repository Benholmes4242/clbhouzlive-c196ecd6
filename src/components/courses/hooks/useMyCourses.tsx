
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
  const rated = userCourses
    .filter(c => c.rating !== null && c.rating !== undefined)
    .sort((a, b) => b.rating - a.rating); // Highest rating first
  
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

  // Fetch user's played courses from user_courses table
  const { data: playedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['user-played-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', user.id)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's Top 100 courses
  const { data: top100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', user.id)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's average rating
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

  // Add source property to Top 100 courses
  const top100Courses = React.useMemo(() => {
    const coursesWithSource = top100CoursesRaw.map(course => ({
      ...course,
      source: 'user_top100_courses' as const
    }));
    
    // Apply custom sorting to Top 100 courses
    return getSortedUserCourses(coursesWithSource);
  }, [top100CoursesRaw]);

  // Combine all played courses from both tables, removing duplicates
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
    
    // Add courses from user_top100_courses table (will overwrite if duplicate)
    top100CoursesRaw.forEach(userCourse => {
      if (userCourse.golf_courses) {
        courseMap.set(userCourse.golf_courses.id, {
          ...userCourse,
          source: 'user_top100_courses'
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

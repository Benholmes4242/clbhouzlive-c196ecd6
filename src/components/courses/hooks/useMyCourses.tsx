
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
  const { data: top100Courses = [], isLoading: isLoadingTop100 } = useQuery({
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
    top100Courses.forEach(userCourse => {
      if (userCourse.golf_courses) {
        courseMap.set(userCourse.golf_courses.id, {
          ...userCourse,
          source: 'user_top100_courses'
        });
      }
    });
    
    return Array.from(courseMap.values()).sort((a, b) => 
      new Date(b.played_date || 0).getTime() - new Date(a.played_date || 0).getTime()
    );
  }, [playedCourses, top100Courses]);

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

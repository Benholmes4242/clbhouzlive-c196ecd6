
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999;
};

// Custom sorting function for user courses
const getSortedUserCourses = (userCourses: any[]) => {
  const rated = userCourses
    .filter(c => c.rating !== null && c.rating !== undefined)
    .sort((a, b) => b.rating - a.rating);
  
  const unrated = userCourses
    .filter(c => c.rating === null || c.rating === undefined)
    .sort((a, b) => {
      const aRank = getCourseRanking(a.golf_courses);
      const bRank = getCourseRanking(b.golf_courses);
      return aRank - bRank;
    });

  return [...rated, ...unrated];
};

export const useUserCoursesData = (username?: string) => {
  const { user: currentUser } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('top100');

  const isOwnProfile = !username;

  // Get target user profile if viewing another user
  const { data: targetUserProfile } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username) return null;
      
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();
      
      if (!data && !error) {
        const { data: idData, error: idError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', username)
          .eq('is_public', true)
          .maybeSingle();
        
        data = idData;
        error = idError;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const targetUserId = isOwnProfile ? currentUser?.id : targetUserProfile?.id;
  const displayName = isOwnProfile ? 'My' : (targetUserProfile?.display_name || targetUserProfile?.username || 'User\'s');

  // Fetch user's Top 100 courses with ratings
  const { data: top100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data: courses, error: coursesError } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', targetUserId)
        .eq('played', true);

      if (coursesError) throw coursesError;
      
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', targetUserId);

      if (ratingsError) throw ratingsError;
      
      const ratingsMap = new Map();
      ratings?.forEach(rating => {
        ratingsMap.set(rating.course_id, rating.rating);
      });
      
      const coursesWithRatings = courses?.map(course => ({
        ...course,
        rating: ratingsMap.get(course.course_id) || null
      })) || [];
      
      return getSortedUserCourses(coursesWithRatings);
    },
    enabled: !!targetUserId,
  });

  // Fetch user's average rating
  const { data: averageRating } = useQuery({
    queryKey: ['user-average-rating', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', targetUserId);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const total = data.reduce((sum, rating) => sum + rating.rating, 0);
      return (total / data.length).toFixed(1);
    },
    enabled: !!targetUserId,
  });

  // Calculate recent courses
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = top100CoursesRaw
    .filter((userCourse) => {
      if (!userCourse.played_date) return false;
      const playedDate = new Date(userCourse.played_date);
      return playedDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.played_date || 0).getTime() - new Date(a.played_date || 0).getTime())
    .slice(0, 6);

  const handleAverageRatingClick = () => {
    if (isOwnProfile) {
      navigate('/my-ratings');
    } else if (targetUserProfile?.username) {
      navigate(`/my-ratings?user=${targetUserProfile.username}`);
    } else if (targetUserId) {
      navigate(`/my-ratings?userId=${targetUserId}`);
    }
  };

  return {
    currentUser,
    targetUserProfile,
    targetUserId,
    displayName,
    isOwnProfile,
    activeTab,
    setActiveTab,
    top100CoursesRaw,
    isLoadingTop100,
    averageRating,
    recentCourses,
    handleAverageRatingClick
  };
};

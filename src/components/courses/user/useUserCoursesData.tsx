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

// Custom sorting function for user courses - prioritize user ratings first
const getSortedUserCourses = (userCourses: any[]) => {
  console.log('Sorting user courses:', userCourses.map(c => ({ 
    name: c.golf_courses?.name, 
    rating: c.rating 
  })));
  
  // Sort all courses by rating in descending order (10 first, then 9, 8, etc., null/undefined last)
  const sortedCourses = userCourses.sort((a, b) => {
    const aRating = a.rating;
    const bRating = b.rating;
    
    // If both have ratings, sort by rating descending (10, 9, 8, ...)
    if (aRating !== null && aRating !== undefined && bRating !== null && bRating !== undefined) {
      return bRating - aRating;
    }
    
    // If only one has a rating, put the rated one first
    if (aRating !== null && aRating !== undefined) return -1;
    if (bRating !== null && bRating !== undefined) return 1;
    
    // If neither has a rating, sort by official ranking
    const aRank = getCourseRanking(a.golf_courses);
    const bRank = getCourseRanking(b.golf_courses);
    return aRank - bRank;
  });
  
  console.log('Final sorted order:', sortedCourses.map(c => ({ 
    name: c.golf_courses?.name, 
    rating: c.rating 
  })));
  
  return sortedCourses;
};

export const useUserCoursesData = (username?: string) => {
  const { user: currentUser } = useSupabaseSession();
  const navigate = useNavigate();

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

  // Fetch user's rated courses (ratings-only)
  const { data: top100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      // Ratings-only: get all rated courses
      const { data: userRatings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (*)
        `)
        .eq('user_id', targetUserId);

      if (ratingsError) {
        console.error('Error fetching user ratings:', ratingsError);
        throw ratingsError;
      }

      console.log('User ratings:', userRatings);
      
      // Map to expected structure
      const coursesWithRatings = userRatings?.map(r => ({
        course_id: r.course_id,
        played_date: r.created_at,
        golf_courses: r.golf_courses,
        rating: r.rating
      })) || [];
      
      console.log('Raw courses with ratings before sorting:', coursesWithRatings.map(c => ({ 
        name: c.golf_courses?.name, 
        rating: c.rating,
        course_id: c.course_id
      })));
      
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

  // Average-rating tile no longer navigates to a standalone page; the
  // world-class card list lives in the profile Courses tab.
  const handleAverageRatingClick = () => {
    if (isOwnProfile) {
      navigate('/profile?tab=courses');
    } else if (targetUserProfile?.username) {
      navigate(`/user/${targetUserProfile.username}/courses`);
    }
  };

  return {
    currentUser,
    targetUserProfile,
    targetUserId,
    displayName,
    isOwnProfile,
    top100CoursesRaw,
    isLoadingTop100,
    averageRating,
    handleAverageRatingClick
  };
};

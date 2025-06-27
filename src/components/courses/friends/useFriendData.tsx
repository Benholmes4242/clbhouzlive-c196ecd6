
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  // Prioritize rankings in this order: regional, global
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999; // Default for courses without rankings
};

// Custom sorting function for user courses
const getSortedUserCourses = (userCourses: any[]) => {
  // Get courses with ratings (from course_ratings table)
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

export const useFriendData = (userId: string | undefined, selectedFriendId: string) => {
  // Fetch user's accepted friends with their profile data
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ['user-friends', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('useFriendData: No userId provided');
        return [];
      }
      
      console.log('useFriendData: Fetching friends for userId:', userId);
      
      // First get friend IDs
      const { data: friendships, error: friendshipsError } = await supabase
        .from('user_friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      console.log('useFriendData: Friendships query result:', { friendships, friendshipsError });

      if (friendshipsError) throw friendshipsError;
      if (!friendships || friendships.length === 0) {
        console.log('useFriendData: No friendships found');
        return [];
      }

      // Then get profile data for those friends
      const friendIds = friendships.map(f => f.friend_id);
      console.log('useFriendData: Friend IDs:', friendIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', friendIds);

      console.log('useFriendData: Profiles query result:', { profiles, profilesError });

      if (profilesError) throw profilesError;
      
      const result = profiles?.map(profile => ({
        friend_id: profile.id,
        user_profiles: profile
      })) || [];
      
      console.log('useFriendData: Final friends result:', result);
      return result;
    },
    enabled: !!userId,
  });

  // Fetch selected friend's played courses with their ratings
  const { data: friendPlayedCoursesRaw = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['friend-played-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      // First get the courses
      const { data: courses, error: coursesError } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', selectedFriendId)
        .eq('played', true);

      if (coursesError) throw coursesError;
      
      // Then get ratings for these courses
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', selectedFriendId);

      if (ratingsError) throw ratingsError;
      
      // Create a map of ratings by course_id
      const ratingsMap = new Map();
      ratings?.forEach(rating => {
        ratingsMap.set(rating.course_id, rating.rating);
      });
      
      // Add ratings to courses
      const coursesWithRatings = courses?.map(course => ({
        ...course,
        rating: ratingsMap.get(course.course_id) || null
      })) || [];
      
      return getSortedUserCourses(coursesWithRatings);
    },
    enabled: !!selectedFriendId,
  });

  // Fetch selected friend's Top 100 courses with their ratings
  const { data: friendTop100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['friend-top100-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      // First get the courses
      const { data: courses, error: coursesError } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', selectedFriendId)
        .eq('played', true);

      if (coursesError) throw coursesError;
      
      // Then get ratings for these courses
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', selectedFriendId);

      if (ratingsError) throw ratingsError;
      
      // Create a map of ratings by course_id
      const ratingsMap = new Map();
      ratings?.forEach(rating => {
        ratingsMap.set(rating.course_id, rating.rating);
      });
      
      // Add ratings to courses
      const coursesWithRatings = courses?.map(course => ({
        ...course,
        rating: ratingsMap.get(course.course_id) || null
      })) || [];
      
      return getSortedUserCourses(coursesWithRatings);
    },
    enabled: !!selectedFriendId,
  });

  // Fetch selected friend's average rating
  const { data: friendAverageRating } = useQuery({
    queryKey: ['friend-average-rating', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return null;
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', selectedFriendId);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const total = data.reduce((sum, rating) => sum + rating.rating, 0);
      return (total / data.length).toFixed(1);
    },
    enabled: !!selectedFriendId,
  });

  console.log('useFriendData: Hook returning:', {
    friends: friends.length,
    isLoadingFriends,
    selectedFriendId,
    friendTop100Courses: friendTop100CoursesRaw.length,
    friendPlayedCourses: friendPlayedCoursesRaw.length
  });

  return {
    friends,
    isLoadingFriends,
    friendPlayedCourses: friendPlayedCoursesRaw,
    isLoadingPlayed,
    friendTop100Courses: friendTop100CoursesRaw,
    isLoadingTop100,
    friendAverageRating
  };
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  // Get courses with ratings (from course_ratings table)
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
        .select('course_id, rating, design_score, condition_score, clubhouse_score, facilities_score, review_date')
        .eq('user_id', selectedFriendId);

      if (ratingsError) throw ratingsError;
      
      // Create a map of ratings by course_id (full row, not just the score)
      const ratingsMap = new Map();
      ratings?.forEach(r => {
        ratingsMap.set(r.course_id, r);
      });
      
      // Add ratings to courses (merge canonical sort fields onto the row)
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
      
      return getSortedUserCourses(coursesWithRatings);
    },
    enabled: !!selectedFriendId,
  });

  // Fetch selected friend's rated courses (ratings-only)
  const { data: friendTop100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['friend-top100-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      // Get all rated courses (ratings-only system)
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
        .eq('user_id', selectedFriendId);

      if (ratingsError) throw ratingsError;
      
      // Map to expected structure (preserve canonical sort fields)
      const coursesWithRatings = ratings?.map(r => ({
        course_id: r.course_id,
        played_date: r.created_at,
        golf_courses: r.golf_courses,
        rating: r.rating,
        design_score: r.design_score,
        condition_score: r.condition_score,
        clubhouse_score: r.clubhouse_score,
        facilities_score: r.facilities_score,
        review_date: r.review_date,
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

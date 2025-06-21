
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  // Fetch selected friend's played courses
  const { data: friendPlayedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['friend-played-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', selectedFriendId)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFriendId,
  });

  // Fetch selected friend's Top 100 courses
  const { data: friendTop100Courses = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['friend-top100-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', selectedFriendId)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
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
    friendTop100Courses: friendTop100Courses.length,
    friendPlayedCourses: friendPlayedCourses.length
  });

  return {
    friends,
    isLoadingFriends,
    friendPlayedCourses,
    isLoadingPlayed,
    friendTop100Courses,
    isLoadingTop100,
    friendAverageRating
  };
};

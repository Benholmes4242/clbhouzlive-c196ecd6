import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FriendLeaderboardEntry {
  id: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
  coursesPlayed: number;
  totalXP: number;
  lastPlayedDate?: string;
  britainIrelandCompleted: number;
  europeCompleted: number;
  usaCompleted: number;
  worldwideCompleted: number;
}

export const useFriendsLeaderboard = (userId?: string) => {
  return useQuery({
    queryKey: ['friends-leaderboard', userId],
    queryFn: async (): Promise<FriendLeaderboardEntry[]> => {
      if (!userId) return [];

      // Get user's friends - bidirectional query (where user sent OR received the request)
      const { data: friendships, error: friendshipsError } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;
      if (!friendships || friendships.length === 0) return [];

      // Extract the correct friend ID (the one that isn't the current user)
      const friendIds = friendships.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Get course data for all friends
      const leaderboardEntries = await Promise.all(
        profiles?.map(async (profile) => {
          // Get rated courses (ratings-only: the single source of truth)
          const { data: ratedData } = await supabase
            .from('course_ratings')
            .select(`
              course_id,
              created_at,
              golf_courses (
                country,
                continent,
                global_rank,
                regional_rank,
                usa_rank
              )
            `)
            .eq('user_id', profile.id);

          const uniqueCourses = ratedData || [];

          let britainIrelandCompleted = 0;
          let europeCompleted = 0;
          let usaCompleted = 0;
          let worldwideCompleted = 0;
          let lastPlayedDate: string | undefined;

          uniqueCourses.forEach((courseData) => {
            const course = courseData.golf_courses;
            if (!course) return;

            // Get the most recent date (ratings use created_at)
            const courseDate = (courseData as any).created_at;
            if (courseDate && (!lastPlayedDate || courseDate > lastPlayedDate)) {
              lastPlayedDate = courseDate;
            }

            // Count by regions
            const isTop100 = course.global_rank || course.regional_rank || course.usa_rank;
            if (isTop100) {
              worldwideCompleted++;

              if (course.country === 'Britain & Ireland') {
                britainIrelandCompleted++;
              }
              
              if (course.country === 'USA') {
                usaCompleted++;
              }
            }

            if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
              europeCompleted++;
            }
          });

          const coursesPlayed = worldwideCompleted;
          const totalXP = coursesPlayed * 110;

          return {
            id: profile.id,
            display_name: profile.display_name,
            username: profile.username,
            profile_photo_url: profile.profile_photo_url,
            coursesPlayed,
            totalXP,
            lastPlayedDate,
            britainIrelandCompleted,
            europeCompleted,
            usaCompleted,
            worldwideCompleted
          };
        }) || []
      );

      // Filter out friends with 0 courses and sort by courses played descending
      return leaderboardEntries
        .filter(friend => friend.coursesPlayed > 0)
        .sort((a, b) => b.coursesPlayed - a.coursesPlayed);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
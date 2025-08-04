import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserAchievements } from './useUserAchievements';

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

      // Get user's friends
      const { data: friendships, error: friendshipsError } = await supabase
        .from('user_friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;
      if (!friendships || friendships.length === 0) return [];

      const friendIds = friendships.map(f => f.friend_id);

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Get course data for all friends
      const leaderboardEntries = await Promise.all(
        profiles?.map(async (profile) => {
          // Get Top 100 courses played
          const { data: top100Data } = await supabase
            .from('user_top100_courses')
            .select(`
              course_id,
              played_date,
              golf_courses (
                country,
                continent,
                global_rank,
                regional_rank,
                usa_rank
              )
            `)
            .eq('user_id', profile.id)
            .eq('played', true);

          // Get rated courses
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

          // Combine and deduplicate courses
          const allCourses = [...(top100Data || []), ...(ratedData || [])];
          const uniqueCourses = allCourses.filter((course, index, self) => 
            index === self.findIndex(c => c.course_id === course.course_id)
          );

          let britainIrelandCompleted = 0;
          let europeCompleted = 0;
          let usaCompleted = 0;
          let worldwideCompleted = 0;
          let lastPlayedDate: string | undefined;

          uniqueCourses.forEach((courseData) => {
            const course = courseData.golf_courses;
            if (!course) return;

            // Get the most recent date
            const courseDate = (courseData as any).played_date || (courseData as any).created_at;
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

      return leaderboardEntries;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
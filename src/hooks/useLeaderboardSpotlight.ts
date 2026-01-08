import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';
import { FLAGS } from '@/config/flags';
import { getMockSpotlightPlayers, BENJAMIN_HOLMES_USER_ID } from '@/mocks/leaderboardMockUsers';

export type SpotlightType = 'most_played' | 'highest_rated' | 'fastest_riser';

export interface SpotlightPlayer {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  home_club: string | null;
  metric_value: number;
  spotlight_type: SpotlightType;
}

export function useLeaderboardSpotlight() {
  return useQuery({
    queryKey: ['leaderboard-spotlight'],
    queryFn: async (): Promise<SpotlightPlayer[]> => {
      // Check if current user is Benjamin Holmes for mock injection
      const { data: { user } } = await supabase.auth.getUser();
      const isBenjaminHolmes = user?.id === BENJAMIN_HOLMES_USER_ID;
      
      // If flag enabled and Benjamin Holmes, return mock spotlights
      if (FLAGS.LEADERBOARD_MOCK_USERS_ENABLED && isBenjaminHolmes) {
        return getMockSpotlightPlayers();
      }

      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const spotlights: SpotlightPlayer[] = [];

      // 1. Most TOP 100 courses rated in last 30 days
      // First get all Top 100 course IDs
      const { data: top100Courses } = await supabase
        .from('course_top100_memberships')
        .select('course_id');
      
      const top100CourseIds = new Set(top100Courses?.map(c => c.course_id) || []);

      const { data: mostPlayed } = await supabase
        .from('course_ratings')
        .select(`
          user_id,
          course_id,
          user_profiles!course_ratings_user_id_fkey (
            display_name,
            profile_photo_url,
            home_club
          )
        `)
        .gte('created_at', thirtyDaysAgo)
        .not('user_id', 'is', null);

      if (mostPlayed && mostPlayed.length > 0) {
        // Count unique TOP 100 courses per user (filter to only Top 100 courses)
        const userCourses: Record<string, { courses: Set<string>; profile: any }> = {};
        for (const rating of mostPlayed) {
          if (!rating.user_id) continue;
          // Only count if course is a Top 100 course
          if (!top100CourseIds.has(rating.course_id)) continue;
          
          const profile = rating.user_profiles;
          if (!userCourses[rating.user_id]) {
            userCourses[rating.user_id] = { courses: new Set(), profile };
          }
          userCourses[rating.user_id].courses.add(rating.course_id);
        }

        // Find user with most unique Top 100 courses
        const topUser = Object.entries(userCourses)
          .map(([userId, data]) => ({ userId, count: data.courses.size, profile: data.profile }))
          .sort((a, b) => b.count - a.count)
          .find((u) => u.count >= 1);

        if (topUser) {
          spotlights.push({
            user_id: topUser.userId,
            display_name: topUser.profile?.display_name || 'Anonymous',
            avatar_url: topUser.profile?.profile_photo_url || null,
            home_club: topUser.profile?.home_club || null,
            metric_value: topUser.count,
            spotlight_type: 'most_played',
          });
        }
      }

      // 2. Highest average rating (min 3 ratings in last 30 days)
      const { data: ratingData } = await supabase
        .from('course_ratings')
        .select(`
          user_id,
          rating,
          user_profiles!course_ratings_user_id_fkey (
            display_name,
            profile_photo_url,
            home_club
          )
        `)
        .gte('created_at', thirtyDaysAgo)
        .not('user_id', 'is', null);

      if (ratingData && ratingData.length > 0) {
        // Calculate avg rating per user (min 3 ratings)
        const userRatings: Record<string, { ratings: number[]; profile: any }> = {};
        for (const rating of ratingData) {
          if (!rating.user_id || rating.rating == null) continue;
          const profile = rating.user_profiles;
          if (!userRatings[rating.user_id]) {
            userRatings[rating.user_id] = { ratings: [], profile };
          }
          userRatings[rating.user_id].ratings.push(rating.rating);
        }

        const userAvgs = Object.entries(userRatings)
          .filter(([_, data]) => data.ratings.length >= 3)
          .map(([userId, data]) => ({
            userId,
            avg: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
            profile: data.profile,
          }))
          .sort((a, b) => b.avg - a.avg);

        if (userAvgs.length > 0 && !spotlights.find(s => s.user_id === userAvgs[0].userId)) {
          spotlights.push({
            user_id: userAvgs[0].userId,
            display_name: userAvgs[0].profile?.display_name || 'Anonymous',
            avatar_url: userAvgs[0].profile?.profile_photo_url || null,
            home_club: userAvgs[0].profile?.home_club || null,
            metric_value: Math.round(userAvgs[0].avg * 10) / 10,
            spotlight_type: 'highest_rated',
          });
        }
      }

      // 3. For "fastest riser" we'd need rank history tracking
      // Placeholder: use most rounds logged as alternative
      // This can be enhanced later when rank snapshots are available

      return spotlights.slice(0, 3);
    },
    staleTime: 60 * 1000, // 1 minute - reduced to refresh more often
  });
}

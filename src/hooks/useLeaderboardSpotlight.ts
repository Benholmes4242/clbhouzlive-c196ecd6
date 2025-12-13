import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

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
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const spotlights: SpotlightPlayer[] = [];

      // 1. Most courses rated in last 30 days
      const { data: mostPlayed } = await supabase
        .from('course_ratings')
        .select(`
          user_id,
          user_profiles!course_ratings_user_id_fkey (
            display_name,
            profile_photo_url,
            home_club
          )
        `)
        .gte('created_at', thirtyDaysAgo)
        .not('user_id', 'is', null);

      if (mostPlayed && mostPlayed.length > 0) {
        // Count ratings per user
        const userCounts: Record<string, { count: number; profile: any }> = {};
        for (const rating of mostPlayed) {
          if (!rating.user_id) continue;
          const profile = rating.user_profiles;
          if (!userCounts[rating.user_id]) {
            userCounts[rating.user_id] = { count: 0, profile };
          }
          userCounts[rating.user_id].count++;
        }

        // Find user with most ratings
        const topUser = Object.entries(userCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .find(([_, data]) => data.count >= 2);

        if (topUser) {
          spotlights.push({
            user_id: topUser[0],
            display_name: topUser[1].profile?.display_name || 'Anonymous',
            avatar_url: topUser[1].profile?.profile_photo_url || null,
            home_club: topUser[1].profile?.home_club || null,
            metric_value: topUser[1].count,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

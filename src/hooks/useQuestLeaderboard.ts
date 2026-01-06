/**
 * useQuestLeaderboard - Simple leaderboard for Quest page
 * Uses the existing get_top100_leaderboard RPC
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuestLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPlayed: number;
  rank: number;
}

export interface QuestLeaderboardData {
  entries: QuestLeaderboardEntry[];
  userRank: number | null;
  userTotal: number;
  behindTenth: number | null;
}

export function useQuestLeaderboard(userId: string | undefined | null) {
  return useQuery({
    queryKey: ['quest-leaderboard', userId],
    queryFn: async (): Promise<QuestLeaderboardData> => {
      // Use the existing RPC to get leaderboard data
      const { data, error } = await supabase.rpc('get_top100_leaderboard', {
        scope_param: 'worldwide',
        time_range_param: 'all_time',
        limit_param: 10,
        offset_param: 0,
        current_user_id: userId || null,
      });

      if (error) throw error;

      const rows = (data || []) as Array<{
        user_id: string;
        username: string;
        display_name: string | null;
        profile_photo_url: string | null;
        top100_courses_played: number;
        global_rank: number;
      }>;

      const entries: QuestLeaderboardEntry[] = rows.map((row, index) => ({
        userId: row.user_id,
        displayName: row.display_name || row.username || 'Golfer',
        avatarUrl: row.profile_photo_url || null,
        totalPlayed: row.top100_courses_played,
        rank: row.global_rank || (index + 1),
      }));

      // Find current user's position
      let userRank: number | null = null;
      let userTotal = 0;

      if (userId) {
        const userEntry = entries.find(e => e.userId === userId);
        if (userEntry) {
          userRank = userEntry.rank;
          userTotal = userEntry.totalPlayed;
        } else {
          // User not in top 10, need to get their rank separately
          const { data: userData, error: userError } = await supabase.rpc('get_top100_leaderboard', {
            scope_param: 'worldwide',
            time_range_param: 'all_time',
            limit_param: 1000,
            offset_param: 0,
            current_user_id: userId,
          });

          if (!userError && userData) {
            const userRow = (userData as any[]).find((r: any) => r.user_id === userId);
            if (userRow) {
              userRank = userRow.global_rank;
              userTotal = userRow.top100_courses_played;
            }
          }
        }
      }

      // Get 10th place score for "behind" calculation
      const tenthPlace = entries.find(e => e.rank === 10) || entries[entries.length - 1];
      const tenthScore = tenthPlace?.totalPlayed || 0;
      const behindTenth = userRank && userRank > 10 ? Math.max(0, tenthScore - userTotal + 1) : null;

      return {
        entries,
        userRank,
        userTotal,
        behindTenth,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * useFastClimbers - Fetches players who logged the most Top 100 courses recently
 * 
 * Phase 1: Activity-based "Most Active This Month"
 * Uses get_fast_climbers RPC to show players with the most recent activity
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FastClimberEntry = {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  home_club: string | null;
  courses_logged_recently: number;
  total_top100_played: number;
  global_rank: number;
};

type FastClimbersRpcRow = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  courses_logged_recently: number;
  total_top100_played: number;
  global_rank: number;
};

export type UseFastClimbersArgs = {
  days?: number;
  limit?: number;
  enabled?: boolean;
};

export function useFastClimbers(args: UseFastClimbersArgs = {}) {
  const { days = 30, limit = 50, enabled = true } = args;

  return useQuery({
    queryKey: ['fast-climbers', days, limit],
    enabled,
    queryFn: async (): Promise<FastClimberEntry[]> => {
      const { data, error } = await supabase.rpc('get_fast_climbers', {
        days_param: days,
        limit_param: limit,
      });

      if (error) {
        console.error('[useFastClimbers] RPC error:', error);
        throw error;
      }

      const rows = (data || []) as FastClimbersRpcRow[];

      return rows.map((row): FastClimberEntry => ({
        user_id: row.user_id,
        display_name: row.display_name || row.username || 'Anonymous',
        username: row.username || '',
        avatar_url: row.profile_photo_url || null,
        home_club: row.home_club || null,
        courses_logged_recently: row.courses_logged_recently,
        total_top100_played: Number(row.total_top100_played),
        global_rank: Number(row.global_rank),
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserChampionshipStatus, DivisionSlug, ZoneType } from '@/types/championship';

function toSlug(divisionId: string): DivisionSlug {
  return divisionId.toLowerCase().replace(/\s+/g, '-') as DivisionSlug;
}

function toZone(zoneType: string): ZoneType {
  if (zoneType === 'promotion') return 'promotion';
  if (zoneType === 'relegation') return 'relegation';
  if (zoneType === 'safe') return 'safe';
  return null;
}

export function useUserChampionshipStatus(userId?: string) {
  return useQuery({
    queryKey: ['user-championship-status', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserChampionshipStatus | null> => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_user_championship_status', {
        p_user_id: userId,
      });

      if (error) throw error;
      
      // RPC returns an array
      const statuses = data as Array<{
        active_streak_days: number;
        best_rank_this_season: number;
        closest_rival_gap: number;
        closest_rival_name: string;
        courses_logged: number;
        courses_to_promotion: number;
        days_remaining: number;
        division_id: string;
        division_name: string;
        division_ring_color: string;
        global_rank: number;
        longest_streak_this_season: number;
        next_division_name: string;
        rank_change_today: number;
        rank_change_week: number;
        rivals_ahead: number;
        rivals_count: number;
        season_ends_at: string;
        season_id: string;
        season_name: string;
        zone_type: string;
      }>;
      
      if (!statuses || statuses.length === 0) return null;
      
      const status = statuses[0];

      return {
        user_id: userId,
        season_id: status.season_id,
        courses_this_season: status.courses_logged,
        current_rank: status.global_rank,
        rank_movement_daily: status.rank_change_today,
        rank_movement_weekly: status.rank_change_week,
        division_slug: toSlug(status.division_id),
        division_name: status.division_name,
        division_color: status.division_ring_color,
        zone: toZone(status.zone_type),
        courses_to_next_division: status.courses_to_promotion,
        next_division_name: status.next_division_name ?? null,
        days_remaining: status.days_remaining,
        streak_current: status.active_streak_days,
        streak_best: status.longest_streak_this_season,
        best_rank_this_season: status.best_rank_this_season ?? 0,
        closest_rival: status.closest_rival_name ? {
          user_id: '', // Not provided by RPC
          display_name: status.closest_rival_name,
          gap: status.closest_rival_gap,
        } : null,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
